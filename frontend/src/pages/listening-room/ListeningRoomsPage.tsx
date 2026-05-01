import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Users,
	Plus,
	Music,
	Play,
	Mic2,
	X,
	Copy,
	Check,
	Headphones,
} from "lucide-react";
import {
	getRooms,
	createRoom,
	joinRoom,
	leaveRoom,
	initializeRoomSocket,
	joinRoomSocket,
	leaveRoomSocket,
	syncPlay,
	sendRoomMessage,
	disconnectSocket,
	type Room,
} from "@/services/roomService";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import toast from "react-hot-toast";

export default function ListeningRoomsPage() {
	const { userId } = useAuth();
	const { user } = useUser();
	const { songs } = useMusicStore();
	const { currentSong, isPlaying, playSongs, pause } = usePlayerStore();

	const [rooms, setRooms] = useState<Room[]>([]);
	const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [newRoomName, setNewRoomName] = useState("");
	const [roomMessages, setRoomMessages] = useState<any[]>([]);
	const [messageInput, setMessageInput] = useState("");
	const [copiedInvite, setCopiedInvite] = useState(false);

	// Initialize and load rooms
	useEffect(() => {
		loadRooms();
		return () => {
			disconnectSocket();
		};
	}, []);

	// Socket event listeners
	useEffect(() => {
		if (currentRoom) {
			const socket = initializeRoomSocket(currentRoom._id);

			socket.on("room_state", ({ room }: { room: Room }) => {
				setCurrentRoom(room);
			});

			socket.on("user_joined_room", ({ username }: { userId: string; username: string }) => {
				toast.success(`${username} joined the room`);
				loadRooms();
			});

			socket.on("user_left_room", ({ username }: { userId: string; username: string }) => {
				toast(`${username} left the room`);
				loadRooms();
			});

			socket.on("play_song", ({ song }: { song: any, currentTime: number }) => {
				// Find song in library and play
				const songToPlay = songs.find((s) => s._id === song.songId || s.title === song.title);
				if (songToPlay) {
					playSongs([songToPlay], 0);
				}
			});

			socket.on("pause_song", () => {
				pause();
			});

			socket.on("receive_room_message", (msg: any) => {
				setRoomMessages((prev) => [...prev, msg]);
			});

			return () => {
				socket.off("room_state");
				socket.off("user_joined_room");
				socket.off("user_left_room");
				socket.off("play_song");
				socket.off("pause_song");
				socket.off("receive_room_message");
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentRoom, songs]);

	const loadRooms = async () => {
		try {
			const result = await getRooms();
			setRooms(result.rooms);
		} catch (error) {
			console.error("Failed to load rooms:", error);
		}
	};

	const handleCreateRoom = async () => {
		if (!newRoomName.trim() || !userId || !user) return;

		setIsLoading(true);
		try {
			const result = await createRoom({
				name: newRoomName,
				hostId: userId,
				hostName: user.username || user.firstName || "Anonymous",
			});

			const room = result.room;
			setCurrentRoom(room);

			// Join room socket
			joinRoomSocket(room._id, userId, user.username || "Anonymous", user.imageUrl || "");

			setCreateDialogOpen(false);
			setNewRoomName("");
			toast.success("Room created!");
			loadRooms();
		} catch (error: any) {
			console.error("Create room error:", error);
			toast.error("Failed to create room");
		} finally {
			setIsLoading(false);
		}
	};

	const handleJoinRoom = async (room: Room) => {
		if (!userId || !user) {
			toast.error("You must be logged in");
			return;
		}

		try {
			await joinRoom(room._id, userId, user.username || "Anonymous", user.imageUrl || "");
			setCurrentRoom(room);

			// Join room socket
			joinRoomSocket(room._id, userId, user.username || "Anonymous", user.imageUrl || "");

			toast.success(`Joined ${room.name}`);
			loadRooms();
		} catch (error: any) {
			console.error("Join room error:", error);
			toast.error("Failed to join room");
		}
	};

	const handleLeaveRoom = async () => {
		if (!currentRoom || !userId) return;

		try {
			await leaveRoom(currentRoom._id, userId);
			leaveRoomSocket(currentRoom._id, userId);

			setCurrentRoom(null);
			setRoomMessages([]);
			toast.success("Left the room");
			loadRooms();
		} catch (error: any) {
			console.error("Leave room error:", error);
			toast.error("Failed to leave room");
		}
	};

	const handleSendMessage = () => {
		if (!messageInput.trim() || !currentRoom || !userId || !user) return;

		sendRoomMessage(
			currentRoom._id,
			userId,
			user.username || user.firstName || "Anonymous",
			messageInput
		);

		setRoomMessages((prev) => [
			...prev,
			{
				senderId: userId,
				senderName: user.username || user.firstName || "Anonymous",
				content: messageInput,
				timestamp: new Date(),
			},
		]);
		setMessageInput("");
	};

	const handleCopyInvite = () => {
		if (currentRoom) {
			navigator.clipboard.writeText(`${window.location.origin}/rooms/${currentRoom._id}`);
			setCopiedInvite(true);
			setTimeout(() => setCopiedInvite(false), 2000);
			toast.success("Invite link copied!");
		}
	};

	// If in a room, show room view
	if (currentRoom) {
		return (
			<div className='h-full bg-gradient-to-b from-blue-900/20 to-zinc-900'>
				<div className='flex h-full'>
					{/* Main Room Area */}
					<div className='flex-1 p-6'>
						<div className='flex items-center justify-between mb-6'>
							<div className='flex items-center gap-3'>
								<Headphones className='w-8 h-8 text-blue-500' />
								<div>
									<h1 className='text-2xl font-bold'>{currentRoom.name}</h1>
									<p className='text-sm text-zinc-400'>
										Hosted by {currentRoom.hostName} • {currentRoom.members.length}{" "}
										{currentRoom.members.length === 1 ? "listener" : "listeners"}
									</p>
								</div>
							</div>
							<div className='flex gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={handleCopyInvite}
									className='gap-2 border-zinc-700'
								>
									{copiedInvite ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
									Invite
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={handleLeaveRoom}
									className='gap-2 border-red-900 text-red-400 hover:bg-red-900/20'
								>
									<X className='w-4 h-4' />
									Leave
								</Button>
							</div>
						</div>

						{/* Now Playing */}
						<Card className='bg-zinc-800/50 border-zinc-700 mb-6'>
							<CardContent className='pt-6'>
								<div className='flex items-center gap-6'>
									{currentRoom.currentSong ? (
										<>
											<img
												src={currentRoom.currentSong.imageUrl}
												alt={currentRoom.currentSong.title}
												className='w-32 h-32 rounded-lg object-cover shadow-xl'
											/>
											<div className='flex-1'>
												<p className='text-sm text-blue-400 mb-1'>Now Playing</p>
												<h2 className='text-2xl font-bold mb-1'>
													{currentRoom.currentSong.title}
												</h2>
												<p className='text-zinc-400'>{currentRoom.currentSong.artist}</p>
											</div>
										</>
									) : (
										<div className='text-center py-8 text-zinc-400'>
											<Music className='w-12 h-12 mx-auto mb-2 opacity-50' />
											<p>No song playing - start the music!</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						/* Song Selection */
						<Card className='bg-zinc-800/50 border-zinc-700'>
							<CardContent className='pt-6'>
								<h3 className='text-lg font-semibold mb-4'>Play a Song</h3>
								<ScrollArea className='h-64'>
									<div className='space-y-2'>
										{songs.map((song) => (
											<div
												key={song._id}
												className='flex items-center gap-3 p-2 rounded hover:bg-zinc-800 cursor-pointer'
												onClick={() => {
													syncPlay(currentRoom._id, {
														songId: song._id,
														title: song.title,
														artist: song.artist,
														imageUrl: song.imageUrl,
														audioUrl: song.audioUrl,
													});
													playSongs([song], 0);
												}}
											>
												<img src={song.imageUrl} alt={song.title} className='w-10 h-10 rounded' />
												<div className='flex-1'>
													<p className='font-medium text-sm'>{song.title}</p>
													<p className='text-xs text-zinc-400'>{song.artist}</p>
												</div>
												<Play className='w-4 h-4 text-zinc-500' />
											</div>
										))}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>

					{/* Chat Sidebar */}
					<div className='w-80 border-l border-zinc-700 p-4'>
						<div className='flex items-center gap-2 mb-4'>
							<Mic2 className='w-5 h-5 text-zinc-400' />
							<h3 className='font-semibold'>Room Chat</h3>
						</div>
						<ScrollArea className='h-[calc(100vh-300px)] mb-4'>
							<div className='space-y-2'>
								{roomMessages.length === 0 ? (
									<p className='text-sm text-zinc-500 text-center py-4'>No messages yet</p>
								) : (
									roomMessages.map((msg, i) => (
										<div
											key={i}
											className={`p-2 rounded ${
												msg.senderId === userId ? "bg-blue-600/20 ml-4" : "bg-zinc-800"
											}`}
										>
											<p className='text-xs font-medium text-zinc-400'>{msg.senderName}</p>
											<p className='text-sm'>{msg.content}</p>
										</div>
									))
								)}
							</div>
						</ScrollArea>
						<div className='flex gap-2'>
							<Input
								placeholder='Say something...'
								value={messageInput}
								onChange={(e) => setMessageInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
								className='bg-zinc-800 border-zinc-700'
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Room selection view
	return (
		<div className='min-h-screen bg-gradient-to-b from-blue-900/20 to-zinc-900'>
			<div className='max-w-6xl mx-auto px-6 py-12'>
				<div className='flex items-center justify-between mb-8'>
					<div className='flex items-center gap-3'>
						<Headphones className='w-8 h-8 text-blue-500' />
						<h1 className='text-3xl font-bold'>Listening Rooms</h1>
					</div>
					<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button className='bg-blue-600 hover:bg-blue-700 gap-2'>
								<Plus className='w-4 h-4' />
								Create Room
							</Button>
						</DialogTrigger>
						<DialogContent className='bg-zinc-900 border-zinc-700'>
							<DialogHeader>
								<DialogTitle>Create Listening Room</DialogTitle>
							</DialogHeader>
							<div className='space-y-4'>
								<div>
									<label className='text-sm font-medium mb-2 block'>Room Name</label>
									<Input
										placeholder='e.g., Chill Vibes Only'
										value={newRoomName}
										onChange={(e) => setNewRoomName(e.target.value)}
										className='bg-zinc-800 border-zinc-700'
									/>
								</div>
								<Button
									onClick={handleCreateRoom}
									disabled={isLoading || !newRoomName.trim()}
									className='w-full bg-blue-600 hover:bg-blue-700'
								>
									{isLoading ? "Creating..." : "Create Room"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{rooms.map((room: Room) => (
						<Card
							key={room._id}
							className='bg-zinc-800/50 border-zinc-700 hover:border-blue-500 transition-colors cursor-pointer'
							onClick={() => handleJoinRoom(room)}
						>
							<CardContent className='pt-4'>
								<div className='flex items-start justify-between mb-3'>
									<div className='flex items-center gap-3'>
										<Users className='w-5 h-5 text-blue-500' />
										<h3 className='font-semibold'>{room.name}</h3>
									</div>
									{room.hostId === userId && (
										<span className='text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded'>
											Host
										</span>
									)}
								</div>
								<p className='text-sm text-zinc-400 mb-3'>
									Hosted by {room.hostName}
								</p>
								<div className='flex items-center gap-2 text-xs text-zinc-500'>
									<Users className='w-3 h-3' />
									{room.members.length} {room.members.length === 1 ? "listener" : "listeners"}
									{room.currentSong && (
										<>
											<Music className='w-3 h-3 ml-2' />
											Playing: {room.currentSong.title}
										</>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{rooms.length === 0 && (
					<div className='text-center py-12 text-zinc-400'>
						<Users className='w-12 h-12 mx-auto mb-4 opacity-50' />
						<p>No active rooms - be the first to create one!</p>
					</div>
				)}
			</div>
		</div>
	);
}
