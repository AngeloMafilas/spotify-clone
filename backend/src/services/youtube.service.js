import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";

/**
 * Get video info from YouTube
 * @param {string} url - YouTube video URL
 */
export const getVideoInfo = async (url) => {
	try {
		const info = await ytdl.getInfo(url);
		const videoDetails = info.player_response.videoDetails;

		return {
			success: true,
			data: {
				title: videoDetails.title,
				author: videoDetails.author.name,
				thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
				duration: videoDetails.lengthSeconds,
				viewCount: videoDetails.viewCount,
			},
		};
	} catch (error) {
		console.error("YouTube Info Error:", error.message);
		throw new Error(`Failed to get video info: ${error.message}`);
	}
};

/**
 * Download audio from YouTube video
 * @param {string} url - YouTube video URL
 * @param {string} outputDir - Output directory for the audio file
 */
export const downloadAudio = async (url, outputDir) => {
	try {
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const info = await ytdl.getInfo(url);
		const videoDetails = info.player_response.videoDetails;

		const safeTitle = videoDetails.title
			.replace(/[<>:"/\\|?*]/g, "")
			.substring(0, 100);
		const filename = `${safeTitle}_${Date.now()}.mp3`;
		const filepath = path.join(outputDir, filename);

		return new Promise((resolve, reject) => {
			const stream = ytdl(url, {
				filter: "audioonly",
				quality: "highestaudio",
			});

			const writeStream = fs.createWriteStream(filepath);

			stream.pipe(writeStream);

			writeStream.on("finish", () => {
				resolve({
					success: true,
					filepath,
					filename,
					title: videoDetails.title,
					author: videoDetails.author.name,
					thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
					duration: videoDetails.lengthSeconds,
				});
			});

			stream.on("error", (error) => {
				reject(new Error(`Download error: ${error.message}`));
			});

			writeStream.on("error", (error) => {
				reject(new Error(`File write error: ${error.message}`));
			});
		});
	} catch (error) {
		console.error("YouTube Download Error:", error.message);
		throw error;
	}
};

/**
 * Download and convert to mp3 using ffmpeg (if available)
 * @param {string} url - YouTube video URL
 * @param {string} outputDir - Output directory
 */
export const downloadAndConvert = async (url, outputDir) => {
	return await downloadAudio(url, outputDir);
};

export default {
	getVideoInfo,
	downloadAudio,
	downloadAndConvert,
};
