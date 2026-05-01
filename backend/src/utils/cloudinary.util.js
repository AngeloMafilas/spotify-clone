import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder
 */
export const uploadFileToCloudinary = async (filePath, folder = "") => {
	try {
		const result = await cloudinary.uploader.upload(filePath, {
			folder: folder ? `audiocloud/${folder}` : "audiocloud",
		});

		// Clean up temp file
		fs.unlinkSync(filePath);

		return result;
	} catch (error) {
		console.error("Cloudinary upload error:", error);
		throw error;
	}
};

/**
 * Upload from URL to Cloudinary (for AI-generated images)
 * @param {string} url - Image URL
 * @param {string} folder - Cloudinary folder
 */
export const uploadToCloudinary = async (url, folder = "") => {
	try {
		const result = await cloudinary.uploader.upload(url, {
			folder: folder ? `audiocloud/${folder}` : "audiocloud",
		});

		return result;
	} catch (error) {
		console.error("Cloudinary upload error:", error);
		throw error;
	}
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteFromCloudinary = async (publicId) => {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		return result;
	} catch (error) {
		console.error("Cloudinary delete error:", error);
		throw error;
	}
};

export default {
	uploadFileToCloudinary,
	uploadToCloudinary,
	deleteFromCloudinary,
};
