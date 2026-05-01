import axios from "axios";

/**
 * Generate AI cover art using Pollinations.ai (free, no API key)
 * @param {string} prompt - Description of the desired image
 * @param {string} size - Image size (default: "1024x1024")
 */
export const generateCoverArt = async (prompt, size = "1024x1024") => {
	try {
		const encodedPrompt = encodeURIComponent(`Album cover art: ${prompt}. High quality, artistic, music album style, professional design.`);
		const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 10000)}`;

		return {
			success: true,
			imageUrl: imageUrl,
			revisedPrompt: prompt,
		};
	} catch (error) {
		console.error("Pollinations Error:", error.message);
		throw new Error(`Failed to generate cover art: ${error.message}`);
	}
};

/**
 * Generate playlist from text prompt using Pollinations.ai (free, no API key)
 * @param {string} prompt - User's playlist description
 * @param {string[]} availableSongs - Array of song titles/genre
 */
export const generatePlaylistFromPrompt = async (prompt, availableSongs = []) => {
	try {
		const systemPrompt = `You are a music curator. Given a user prompt, select songs that match the mood/genre. Return ONLY valid JSON with this format: {"songs": ["song1", "song2"], "description": "brief description"}. Available songs: ${availableSongs.join(", ")}`;

		const encodedPrompt = encodeURIComponent(`${systemPrompt}\n\nUser: Create a playlist for: "${prompt}"\n\nAssistant: {"songs":`);
		const response = await axios.get(`https://text.pollinations.ai/${encodedPrompt}`, {
			headers: {
				'Accept': 'application/json',
			},
		});

		let result;
		try {
			result = JSON.parse(response.data);
		} catch {
			const match = response.data.match(/\{[^{}]*"songs"[^{}]*\}/s);
			if (match) {
				result = JSON.parse(match[0]);
			} else {
				result = { songs: [], description: `AI-generated playlist: ${prompt}` };
			}
		}

		return {
			success: true,
			playlist: result.songs || [],
			description: result.description || `AI-generated playlist: ${prompt}`,
		};
	} catch (error) {
		console.error("Pollinations Playlist Error:", error.message);
		throw new Error(`Failed to generate playlist: ${error.message}`);
	}
};

/**
 * Analyze song lyrics meaning using Pollinations.ai (free, no API key)
 * @param {string} lyrics - Song lyrics
 */
export const analyzeLyricsMeaning = async (lyrics) => {
	try {
		const systemPrompt = "You are a music analyst. Explain the meaning, themes, and context of song lyrics in 2-3 paragraphs.";
		const encodedPrompt = encodeURIComponent(`${systemPrompt}\n\nAnalyze these lyrics:\n\n${lyrics}\n\nAnalysis:`);
		const response = await axios.get(`https://text.pollinations.ai/${encodedPrompt}`);

		return {
			success: true,
			analysis: response.data,
		};
	} catch (error) {
		console.error("Pollinations Lyrics Error:", error.message);
		throw new Error(`Failed to analyze lyrics: ${error.message}`);
	}
};

/**
 * Generate AI DJ script using Pollinations.ai (free, no API key)
 * @param {string} songTitle - Title of the song
 * @param {string} artist - Artist name
 * @param {string} genre - Song genre
 * @param {object} userPreferences - User's listening habits
 */
export const generateDJScript = async (songTitle, artist, genre, userPreferences = {}) => {
	try {
		const systemPrompt = "You are a cool, friendly AI DJ. Create a short (1-2 sentences) intro for the next song. Keep it natural and engaging.";
		const encodedPrompt = encodeURIComponent(`${systemPrompt}\n\nIntroduce "${songTitle}" by ${artist} (${genre}). User likes: ${JSON.stringify(userPreferences)}\n\nDJ Intro:`);
		const response = await axios.get(`https://text.pollinations.ai/${encodedPrompt}`);

		return {
			success: true,
			script: response.data,
		};
	} catch (error) {
		console.error("Pollinations DJ Script Error:", error.message);
		throw new Error(`Failed to generate DJ script: ${error.message}`);
	}
};

export default {
	generateCoverArt,
	generatePlaylistFromPrompt,
	analyzeLyricsMeaning,
	generateDJScript,
};
