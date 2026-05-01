import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { Room } from "../models/room.model.js";

export const initializeSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: "http://localhost:3000",
			credentials: true,
		},
	});

	const userSockets = new Map(); // { userId: socketId}
	const userActivities = new Map(); // {userId: activity}
	const roomUsers = new Map(); // {roomId: Set<userId>}

	io.on("connection", (socket) => {
		console.log("User connected:", socket.id);

		socket.on("user_connected", async (userId) => {
			userSockets.set(userId, socket.id);
			userActivities.set(userId, "Idle");

			// broadcast to all connected sockets that this user just logged in
			io.emit("user_connected", userId);

			socket.emit("users_online", Array.from(userSockets.keys()));

			io.emit("activities", Array.from(userActivities.entries()));
		});

		socket.on("update_activity", ({ userId, activity }) => {
			console.log("activity updated", userId, activity);
			userActivities.set(userId, activity);
			io.emit("activity_updated", { userId, activity });
		});

		// === Room Events ===

		socket.on("join_room", async ({ roomId, userId, username, avatarUrl }) => {
			try {
				socket.join(roomId);

				// Track user in room
				if (!roomUsers.has(roomId)) {
					roomUsers.set(roomId, new Set());
				}
				roomUsers.get(roomId).add(userId);

				// Update room in database
				await Room.findByIdAndUpdate(roomId, {
					$addToSet: {
						members: { userId, username, avatarUrl, joinedAt: new Date() },
					},
				});

				// Notify others in room
				socket.to(roomId).emit("user_joined_room", { userId, username, roomId });

				// Send current room state to joining user
				const room = await Room.findById(roomId);
				socket.emit("room_state", { room });

				console.log(`User ${userId} joined room ${roomId}`);
			} catch (error) {
				console.error("Join room error:", error);
				socket.emit("room_error", { message: "Failed to join room" });
			}
		});

		socket.on("leave_room", async ({ roomId, userId }) => {
			try {
				socket.leave(roomId);

				// Track user leaving room
				if (roomUsers.has(roomId)) {
					roomUsers.get(roomId).delete(userId);
				}

				// Update room in database
				const room = await Room.findById(roomId);
				if (room) {
					room.members = room.members.filter((m) => m.userId !== userId);

					// If host left, transfer host
					if (room.hostId === userId && room.members.length > 0) {
						room.hostId = room.members[0].userId;
						room.hostName = room.members[0].username;
						// Notify new host
						io.to(roomId).emit("host_transferred", { newHostId: room.hostId });
					}

					// Deactivate if empty
					if (room.members.length === 0) {
						room.isActive = false;
					}

					await room.save();
				}

				// Notify others
				socket.to(roomId).emit("user_left_room", { userId, roomId });

				console.log(`User ${userId} left room ${roomId}`);
			} catch (error) {
				console.error("Leave room error:", error);
			}
		});

		socket.on("sync_play", async ({ roomId, song, currentTime = 0 }) => {
			try {
				// Update room state
				await Room.findByIdAndUpdate(roomId, {
					currentSong: {
						...song,
						startedAt: new Date(Date.now() - currentTime * 1000),
						paused: false,
					},
				});

				// Broadcast to all in room except sender
				socket.to(roomId).emit("play_song", { song, currentTime });

				console.log(`Sync play in room ${roomId}:`, song.title);
			} catch (error) {
				console.error("Sync play error:", error);
			}
		});

		socket.on("sync_pause", async ({ roomId, currentTime }) => {
			try {
				await Room.findByIdAndUpdate(roomId, {
					"currentSong.paused": true,
				});

				socket.to(roomId).emit("pause_song", { currentTime });

				console.log(`Sync pause in room ${roomId} at ${currentTime}s`);
			} catch (error) {
				console.error("Sync pause error:", error);
			}
		});

		socket.on("sync_seek", async ({ roomId, currentTime }) => {
			try {
				await Room.findByIdAndUpdate(roomId, {
					"currentSong.startedAt": new Date(Date.now() - currentTime * 1000),
				});

				socket.to(roomId).emit("seek_song", { currentTime });

				console.log(`Sync seek in room ${roomId} to ${currentTime}s`);
			} catch (error) {
				console.error("Sync seek error:", error);
			}
		});

		socket.on("add_to_queue", async ({ roomId, song }) => {
			try {
				const room = await Room.findById(roomId);
				if (room) {
					room.queue.push(song);
					await room.save();

					socket.to(roomId).emit("queue_updated", { queue: room.queue });
				}
			} catch (error) {
				console.error("Add to queue error:", error);
			}
		});

		socket.on("update_queue", async ({ roomId, queue }) => {
			try {
				await Room.findByIdAndUpdate(roomId, { queue });
				socket.to(roomId).emit("queue_updated", { queue });
			} catch (error) {
				console.error("Update queue error:", error);
			}
		});

		socket.on("send_room_message", async ({ roomId, senderId, senderName, content }) => {
			try {
				// Broadcast to all in room
				io.to(roomId).emit("receive_room_message", {
					senderId,
					senderName,
					content,
					timestamp: new Date(),
				});
			} catch (error) {
				console.error("Room message error:", error);
			}
		});

		// === End Room Events ===

		socket.on("send_message", async (data) => {
			try {
				const { senderId, receiverId, content } = data;

				const message = await Message.create({
					senderId,
					receiverId,
					content,
				});

				// send to receiver in realtime, if they're online
				const receiverSocketId = userSockets.get(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("receive_message", message);
				}

				socket.emit("message_sent", message);
			} catch (error) {
				console.error("Message error:", error);
				socket.emit("message_error", error.message);
			}
		});

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.id);

			let disconnectedUserId;
			for (const [userId, socketId] of userSockets.entries()) {
				// find disconnected user
				if (socketId === socket.id) {
					disconnectedUserId = userId;
					userSockets.delete(userId);
					userActivities.delete(userId);
					break;
				}
			}

			// Handle leaving all rooms user was in
			if (disconnectedUserId) {
				io.emit("user_disconnected", disconnectedUserId);

				// Leave all rooms
				for (const [roomId, users] of roomUsers.entries()) {
					if (users.has(disconnectedUserId)) {
						users.delete(disconnectedUserId);
						socket.to(roomId).emit("user_left_room", {
							userId: disconnectedUserId,
							roomId,
						});

						// Update DB
						Room.findById(roomId).then((room) => {
							if (room) {
								room.members = room.members.filter((m) => m.userId !== disconnectedUserId);
								if (room.members.length === 0) room.isActive = false;
								room.save();
							}
						});
					}
				}
			}
		});
	});
};
