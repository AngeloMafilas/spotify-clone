import express from "express";
import { Room } from "../models/room.model.js";

const router = express.Router();

/**
 * GET /api/rooms - Get all active rooms
 */
router.get("/", async (req, res) => {
	try {
		const rooms = await Room.find({ isActive: true })
			.select("-queue") // Don't send full queue in list view
			.sort({ createdAt: -1 });

		res.json({ success: true, rooms });
	} catch (error) {
		console.error("Get rooms error:", error);
		res.status(500).json({ error: "Failed to fetch rooms" });
	}
});

/**
 * GET /api/rooms/:id - Get single room details
 */
router.get("/:id", async (req, res) => {
	try {
		const room = await Room.findById(req.params.id);

		if (!room) {
			return res.status(404).json({ error: "Room not found" });
		}

		res.json({ success: true, room });
	} catch (error) {
		console.error("Get room error:", error);
		res.status(500).json({ error: "Failed to fetch room" });
	}
});

/**
 * POST /api/rooms - Create a new room
 */
router.post("/", async (req, res) => {
	try {
		const { name, hostId, hostName, isPublic } = req.body;

		const room = new Room({
			name,
			hostId,
			hostName,
			isPublic: isPublic ?? true,
			members: [
				{
					userId: hostId,
					username: hostName,
					joinedAt: new Date(),
				},
			],
		});

		await room.save();

		res.status(201).json({ success: true, room });
	} catch (error) {
		console.error("Create room error:", error);
		res.status(500).json({ error: "Failed to create room" });
	}
});

/**
 * POST /api/rooms/:id/join - Join a room
 */
router.post("/:id/join", async (req, res) => {
	try {
		const { userId, username, avatarUrl } = req.body;

		const room = await Room.findById(req.params.id);

		if (!room) {
			return res.status(404).json({ error: "Room not found" });
		}

		if (!room.isActive) {
			return res.status(400).json({ error: "Room is no longer active" });
		}

		// Check if user is already a member
		const existingMember = room.members.find((m) => m.userId === userId);
		if (existingMember) {
			return res.json({ success: true, room });
		}

		room.members.push({ userId, username, avatarUrl });
		await room.save();

		res.json({ success: true, room });
	} catch (error) {
		console.error("Join room error:", error);
		res.status(500).json({ error: "Failed to join room" });
	}
});

/**
 * POST /api/rooms/:id/leave - Leave a room
 */
router.post("/:id/leave", async (req, res) => {
	try {
		const { userId } = req.body;

		const room = await Room.findById(req.params.id);

		if (!room) {
			return res.status(404).json({ error: "Room not found" });
		}

		room.members = room.members.filter((m) => m.userId !== userId);

		// If host left and there are other members, transfer host
		if (room.hostId === userId && room.members.length > 0) {
			room.hostId = room.members[0].userId;
			room.hostName = room.members[0].username;
		}

		// If no members left, deactivate room
		if (room.members.length === 0) {
			room.isActive = false;
		}

		await room.save();

		res.json({ success: true, room });
	} catch (error) {
		console.error("Leave room error:", error);
		res.status(500).json({ error: "Failed to leave room" });
	}
});

/**
 * DELETE /api/rooms/:id - Delete/close a room
 */
router.delete("/:id", async (req, res) => {
	try {
		const { userId } = req.body;

		const room = await Room.findById(req.params.id);

		if (!room) {
			return res.status(404).json({ error: "Room not found" });
		}

		if (room.hostId !== userId) {
			return res.status(403).json({ error: "Only host can close the room" });
		}

		room.isActive = false;
		await room.save();

		res.json({ success: true, message: "Room closed" });
	} catch (error) {
		console.error("Delete room error:", error);
		res.status(500).json({ error: "Failed to close room" });
	}
});

export default router;
