import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		hostId: {
			type: String, // Clerk user ID
			required: true,
		},
		hostName: {
			type: String,
			required: true,
		},
		members: [
			{
				userId: String,
				username: String,
				avatarUrl: String,
				joinedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		currentSong: {
			songId: String,
			title: String,
			artist: String,
			imageUrl: String,
			audioUrl: String,
			startedAt: Date,
			paused: {
				type: Boolean,
				default: false,
			},
		},
		queue: [
			{
				songId: String,
				title: String,
				artist: String,
				imageUrl: String,
				audioUrl: String,
				duration: Number,
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
		isPublic: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
