import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { generateCoverArt } from "@/services/aiService";
import toast from "react-hot-toast";

interface AICoverGeneratorProps {
	onCoverGenerated?: (imageUrl: string, publicId: string) => void;
}

export default function AICoverGenerator({ onCoverGenerated }: AICoverGeneratorProps) {
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedImage, setGeneratedImage] = useState<{ url: string; publicId: string } | null>(null);
	const [open, setOpen] = useState(false);

	const handleGenerate = async () => {
		if (!prompt.trim()) {
			toast.error("Please enter a prompt");
			return;
		}

		setIsGenerating(true);
		try {
			const result = await generateCoverArt(prompt);
			setGeneratedImage({ url: result.imageUrl, publicId: result.publicId });
			toast.success("Cover art generated!");

			if (onCoverGenerated && result.imageUrl) {
				onCoverGenerated(result.imageUrl, result.publicId);
			}
		} catch (error: any) {
			console.error("Cover generation error:", error);
			toast.error(error.response?.data?.error || "Failed to generate cover art");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleUseCover = () => {
		if (generatedImage?.url) {
			onCoverGenerated?.(generatedImage.url, generatedImage.publicId);
			setOpen(false);
			toast.success("Cover art selected!");
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Sparkles className="w-4 h-4" />
					Generate AI Cover
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-purple-500" />
						AI Cover Art Generator
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-2 block">Describe your cover art</label>
						<div className="flex gap-2">
							<Input
								placeholder="e.g., 'Neon sunset over mountains, synthwave style, retro 80s aesthetic'"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
								disabled={isGenerating}
							/>
							<Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
								{isGenerating ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Generating...
									</>
								) : (
									<>
										<Sparkles className="w-4 h-4" />
										Generate
									</>
								)}
							</Button>
						</div>
					</div>

					{generatedImage && (
						<Card>
							<CardContent className="pt-4">
								<div className="space-y-4">
									<div className="relative aspect-square max-w-xs mx-auto rounded-lg overflow-hidden bg-gray-100">
										<img
											src={generatedImage.url}
											alt="Generated cover art"
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="flex gap-2 justify-center">
										<Button onClick={handleUseCover} className="gap-2">
											<Download className="w-4 h-4" />
											Use This Cover
										</Button>
										<Button
											variant="outline"
											onClick={() => window.open(generatedImage.url, "_blank")}
											className="gap-2"
										>
											<ImageIcon className="w-4 h-4" />
											View Full Size
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{!generatedImage && !isGenerating && (
						<div className="text-center py-8 text-muted-foreground">
							<Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
							<p>Enter a prompt to generate unique cover art using AI</p>
							<p className="text-sm mt-1">Powered by DALL-E 3</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
