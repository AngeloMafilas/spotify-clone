import { useState } from "react";
import MainLayout from "@/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Music, Loader2, Play, Shuffle } from "lucide-react";
import { generatePlaylist } from "@/services/aiService";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import toast from "react-hot-toast";

export default function AIPlaylistPage() {
	const { songs } = useMusicStore();
	const { playSongs } = usePlayerStore();

	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [matchedSongs, setMatchedSongs] = useState<any[]>([]);

	const handleGeneratePlaylist = async () => {
		if (!prompt.trim()) {
			toast.error("Please enter a prompt");
			return;
		}

		setIsGenerating(true);
		try {
			const availableSongs = songs.map((s) => s.title);
			const result = await generatePlaylist(prompt, availableSongs);

			// setGeneratedPlaylist(result.playlist);

			// Match generated song titles with actual song objects
			const matched = songs.filter((song) =>
				result.playlist.some(
					(title: string) =>
						title.toLowerCase().includes(song.title.toLowerCase()) ||
						song.title.toLowerCase().includes(title.toLowerCase())
				)
			);

			// If no exact matches, use random songs as fallback
			if (matched.length === 0) {
				const randomSongs = songs.sort(() => Math.random() - 0.5).slice(0, 5);
				setMatchedSongs(randomSongs);
				toast.success(`Generated playlist (no exact matches found, here are some recommendations)`);
			} else {
				setMatchedSongs(matched);
				toast.success(`Generated playlist with ${matched.length} songs!`);
			}
		} catch (error: any) {
			console.error("Playlist generation error:", error);
			toast.error(error.response?.data?.error || "Failed to generate playlist");
		} finally {
			setIsGenerating(false);
		}
	};

	const handlePlayPlaylist = () => {
		if (matchedSongs.length > 0) {
			playSongs(matchedSongs, 0);
		}
	};

	const handleShuffle = () => {
		if (matchedSongs.length > 0) {
			const shuffled = [...matchedSongs].sort(() => Math.random() - 0.5);
			playSongs(shuffled, 0);
		}
	};

	return (
		<MainLayout>
			<div className='min-h-screen bg-gradient-to-b from-purple-900/20 to-zinc-900'>
				<div className='max-w-4xl mx-auto px-6 py-12'>
					{/* Header */}
					<div className='text-center mb-12'>
						<div className='flex items-center justify-center gap-3 mb-4'>
							<Sparkles className='w-8 h-8 text-purple-500' />
							<h1 className='text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
								AI Playlist Generator
							</h1>
						</div>
						<p className='text-zinc-400 text-lg'>
							Describe your mood, activity, or vibe - let AI curate the perfect playlist
						</p>
					</div>

					{/* Input Section */}
					<Card className='bg-zinc-800/50 border-zinc-700 mb-8'>
						<CardContent className='pt-6'>
							<div className='flex gap-3'>
								<Input
									placeholder="e.g., 'Upbeat synthwave for a late-night coding session' or 'Rainy day jazz with coffee shop vibes'"
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleGeneratePlaylist()}
									disabled={isGenerating}
									className='flex-1 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500'
								/>
								<Button
									onClick={handleGeneratePlaylist}
									disabled={isGenerating || !prompt.trim()}
									className='bg-purple-600 hover:bg-purple-700 gap-2 px-6'
								>
									{isGenerating ? (
										<>
											<Loader2 className='w-4 h-4 animate-spin' />
											Generating...
										</>
									) : (
										<>
											<Sparkles className='w-4 h-4' />
											Generate
										</>
									)}
								</Button>
							</div>

							{/* Prompt suggestions */}
							<div className='flex flex-wrap gap-2 mt-4'>
								<span className='text-sm text-zinc-500'>Try:</span>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setPrompt("Energetic workout music to push through tough exercises")}
									className='text-xs border-zinc-700 hover:bg-zinc-800'
								>
									Workout Energy
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setPrompt("Chill lo-fi beats for studying and concentration")}
									className='text-xs border-zinc-700 hover:bg-zinc-800'
								>
									Study Focus
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setPrompt("Romantic dinner jazz with smooth saxophone")}
									className='text-xs border-zinc-700 hover:bg-zinc-800'
								>
									Romantic Jazz
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Results Section */}
					{matchedSongs.length > 0 && (
						<Card className='bg-zinc-800/50 border-zinc-700'>
							<CardContent className='pt-6'>
								<div className='flex items-center justify-between mb-6'>
									<div className='flex items-center gap-3'>
										<Music className='w-6 h-6 text-purple-500' />
										<h2 className='text-xl font-semibold'>Your AI Playlist</h2>
									</div>
									<div className='flex gap-2'>
										<Button onClick={handlePlayPlaylist} className='gap-2 bg-green-600 hover:bg-green-700'>
											<Play className='w-4 h-4' />
											Play All
										</Button>
										<Button
											onClick={handleShuffle}
											variant='outline'
											className='gap-2 border-zinc-700 hover:bg-zinc-800'
										>
											<Shuffle className='w-4 h-4' />
											Shuffle
										</Button>
									</div>
								</div>

								<div className='space-y-2'>
									{matchedSongs.map((song, index) => (
										<div
											key={song._id}
											className='flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer'
											onClick={() => playSongs(matchedSongs, index)}
										>
											<span className='text-zinc-500 w-6 text-center'>{index + 1}</span>
											<img
												src={song.imageUrl}
												alt={song.title}
												className='w-12 h-12 rounded object-cover'
											/>
											<div className='flex-1'>
												<p className='font-medium text-white'>{song.title}</p>
												<p className='text-sm text-zinc-400'>{song.artist}</p>
											</div>
											<span className='text-sm text-zinc-500'>{song.duration}s</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{isGenerating && (
						<div className='text-center py-12'>
							<Loader2 className='w-12 h-12 animate-spin mx-auto mb-4 text-purple-500' />
							<p className='text-zinc-400'>Analyzing your prompt and curating the perfect songs...</p>
						</div>
					)}
				</div>
			</div>
		</MainLayout>
	);
}
