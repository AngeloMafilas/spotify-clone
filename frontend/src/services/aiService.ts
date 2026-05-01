import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface CoverArtGeneration {
	success: boolean;
	imageUrl: string;
	publicId: string;
	revisedPrompt: string;
}

export interface PlaylistGeneration {
	success: boolean;
	playlist: string[];
	description: string;
}

export interface LyricsAnalysis {
	success: boolean;
	analysis: string;
}

export interface TextToSpeechResult {
	success: boolean;
	audio: string;
}

/**
 * Generate AI cover art from a text prompt
 */
export const generateCoverArt = async (prompt: string, albumId?: string): Promise<CoverArtGeneration> => {
	const response = await api.post("/api/ai/generate-cover", { prompt, albumId });
	return response.data;
};

/**
 * Generate a playlist from a text prompt
 */
export const generatePlaylist = async (prompt: string, availableSongs?: string[]): Promise<PlaylistGeneration> => {
	const response = await api.post("/api/ai/generate-playlist", { prompt, availableSongs });
	return response.data;
};

/**
 * Analyze song lyrics meaning
 */
export const analyzeLyrics = async (lyrics: string): Promise<LyricsAnalysis> => {
	const response = await api.post("/api/ai/analyze-lyrics", { lyrics });
	return response.data;
};

/**
 * Generate AI DJ voice from text
 */
export const textToSpeech = async (text: string): Promise<TextToSpeechResult> => {
	const response = await api.post("/api/ai/text-to-speech", { text });
	return response.data;
};

export default {
	generateCoverArt,
	generatePlaylist,
	analyzeLyrics,
	textToSpeech,
};
