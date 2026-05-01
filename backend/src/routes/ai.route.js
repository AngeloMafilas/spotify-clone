import express from "express";
import { generateCoverArt, generatePlaylistFromPrompt, analyzeLyricsMeaning } from "../services/openai.service.js";
import { getVideoInfo, downloadAudio } from "../services/youtube.service.js";
import { uploadToCloudinary } from "../utils/cloudinary.util.js";
import path from "path";

const router = express.Router();

/**
 * POST /api/ai/generate-cover
 * Generate AI cover art and upload to Cloudinary
 */
router.post("/generate-cover", async (req, res) => {
	try {
		const { prompt, albumId } = req.body;

		if (!prompt) {
			return res.status(400).json({ error: "Prompt is required" });
		}

		const result = await generateCoverArt(prompt);

		res.json({
			success: true,
			imageUrl: result.imageUrl,
			revisedPrompt: result.revisedPrompt,
		});
	} catch (error) {
		console.error("Generate cover error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/ai/generate-playlist
 * Generate playlist from text prompt
 */
router.post("/generate-playlist", async (req, res) => {
	try {
		const { prompt, availableSongs } = req.body;

		if (!prompt) {
			return res.status(400).json({ error: "Prompt is required" });
		}

		const result = await generatePlaylistFromPrompt(prompt, availableSongs || []);

		res.json(result);
	} catch (error) {
		console.error("Generate playlist error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/ai/analyze-lyrics
 * Analyze song lyrics meaning
 */
router.post("/analyze-lyrics", async (req, res) => {
	try {
		const { lyrics } = req.body;

		if (!lyrics) {
			return res.status(400).json({ error: "Lyrics are required" });
		}

		const result = await analyzeLyricsMeaning(lyrics);

		res.json(result);
	} catch (error) {
		console.error("Analyze lyrics error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/youtube/info
 * Get YouTube video info
 */
router.get("/youtube/info", async (req, res) => {
	try {
		const { url } = req.query;

		if (!url) {
			return res.status(400).json({ error: "URL is required" });
		}

		const result = await getVideoInfo(url);

		res.json(result);
	} catch (error) {
		console.error("YouTube info error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/youtube/download
 * Download audio from YouTube video
 */
router.post("/youtube/download", async (req, res) => {
	try {
		const { url } = req.body;

		if (!url) {
			return res.status(400).json({ error: "URL is required" });
		}

		const downloadDir = path.join(process.cwd(), "uploads", "youtube");
		const result = await downloadAudio(url, downloadDir);

		res.json(result);
	} catch (error) {
		console.error("YouTube download error:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
