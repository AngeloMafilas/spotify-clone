import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Socket instance for room events
let socket: any = null;

export interface Room {
	_id: string;
	name: string;
	hostId: string;
	hostName: string;
	members: Array<{
		userId: string;
		username: string;
		avatarUrl: string;
	}>;
	currentSong: {
		songId: string;
		title: string;
		artist: string;
		imageUrl: string;
		audioUrl: string;
		startedAt: Date;
		paused: boolean;
	} | null;
	queue: Array<{
		songId: string;
		title: string;
		artist: string;
		imageUrl: string;
		audioUrl: string;
		duration: number;
	}>;
	isActive: boolean;
	isPublic: boolean;
}

export interface CreateRoomData {
	name: string;
	hostId: string;
	hostName: string;
	isPublic?: boolean;
}

/**
 * Get all active rooms
 */
export const getRooms = async () => {
	const response = await api.get("/api/rooms");
	return response.data;
};

/**
 * Get single room by ID
 */
export const getRoom = async (roomId: string) => {
	const response = await api.get(`/api/rooms/${roomId}`);
	return response.data;
};

/**
 * Create a new room
 */
export const createRoom = async (data: CreateRoomData) => {
	const response = await api.post("/api/rooms", data);
	return response.data;
};

/**
 * Join a room
 */
export const joinRoom = async (roomId: string, userId: string, username: string, avatarUrl: string) => {
	const response = await api.post(`/api/rooms/${roomId}/join`, { userId, username, avatarUrl });
	return response.data;
};

/**
 * Leave a room
 */
export const leaveRoom = async (roomId: string, userId: string) => {
	const response = await api.post(`/api/rooms/${roomId}/leave`, { userId });
	return response.data;
};

/**
 * Close a room (host only)
 */
export const closeRoom = async (roomId: string, userId: string) => {
	const response = await api.delete(`/api/rooms/${roomId}`, { data: { userId } });
	return response.data;
};

// === Socket Functions ===

/**
 * Initialize socket connection for room
 */
export const initializeRoomSocket = (roomId: string) => {
	if (!socket) {
		socket = io(API_URL, {
			transports: ["websocket", "polling"],
		});
	}
	return socket;
};

/**
 * Join room socket
 */
export const joinRoomSocket = (roomId: string, userId: string, username: string, avatarUrl: string) => {
	if (socket) {
		socket.emit("join_room", { roomId, userId, username, avatarUrl });
	}
};

/**
 * Leave room socket
 */
export const leaveRoomSocket = (roomId: string, userId: string) => {
	if (socket) {
		socket.emit("leave_room", { roomId, userId });
	}
};

/**
 * Sync play to all room members
 */
export const syncPlay = (roomId: string, song: any, currentTime: number = 0) => {
	if (socket) {
		socket.emit("sync_play", { roomId, song, currentTime });
	}
};

/**
 * Sync pause to all room members
 */
export const syncPause = (roomId: string, currentTime: number) => {
	if (socket) {
		socket.emit("sync_pause", { roomId, currentTime });
	}
};

/**
 * Sync seek to all room members
 */
export const syncSeek = (roomId: string, currentTime: number) => {
	if (socket) {
		socket.emit("sync_seek", { roomId, currentTime });
	}
};

/**
 * Add song to room queue
 */
export const addToQueue = (roomId: string, song: any) => {
	if (socket) {
		socket.emit("add_to_queue", { roomId, song });
	}
};

/**
 * Update room queue
 */
export const updateQueue = (roomId: string, queue: any[]) => {
	if (socket) {
		socket.emit("update_queue", { roomId, queue });
	}
};

/**
 * Send room chat message
 */
export const sendRoomMessage = (roomId: string, senderId: string, senderName: string, content: string) => {
	if (socket) {
		socket.emit("send_room_message", { roomId, senderId, senderName, content });
	}
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
};

export default {
	getRooms,
	getRoom,
	createRoom,
	joinRoom,
	leaveRoom,
	closeRoom,
	initializeRoomSocket,
	joinRoomSocket,
	leaveRoomSocket,
	syncPlay,
	syncPause,
	syncSeek,
	addToQueue,
	updateQueue,
	sendRoomMessage,
	disconnectSocket,
};
