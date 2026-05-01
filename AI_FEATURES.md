# AI-Powered Features Documentation

This document outlines all the AI features implemented in your Audiocloud clone.

---

## Features Implemented

### 1. AI Cover Art Generator (Grok/DALL-E 3)

**Location:** Admin Dashboard > Add Album Dialog

**How to use:**
1. Go to `/admin` page
2. Click "Add Album"
3. Click "Generate AI Cover" button
4. Enter a prompt describing your desired cover art
5. Click "Generate" - wait ~10 seconds
6. Click "Use This Cover" to attach to your album

**Required API Key:**
- `GROK_API_KEY` in backend `.env`

**Files:**
- Backend: `backend/src/services/openai.service.js`, `backend/src/routes/ai.route.js`
- Frontend: `frontend/src/components/coverArt/AICoverGenerator.tsx`

---

### 2. AI Playlist Generator (Grok/GPT-4)

**Location:** Homepage > "AI Playlist Generator" button OR `/ai-playlist`

**How to use:**
1. Click "AI Playlist Generator" on the homepage
2. Enter a mood/activity prompt (e.g., "Upbeat synthwave for late-night coding")
3. Click "Generate"
4. AI will select matching songs from your library
5. Click "Play All" or "Shuffle" to listen

**Required API Key:**
- `GROK_API_KEY` in backend `.env`

**Files:**
- Backend: `backend/src/services/openai.service.js`, `backend/src/routes/ai.route.js`
- Frontend: `frontend/src/pages/ai-playlist/AIPlaylistPage.tsx`, `frontend/src/services/aiService.ts`

---

### 3. Live Listening Rooms (WebSocket Sync)

**Location:** `/rooms`

**How to use:**
1. Navigate to `/rooms`
2. Click "Create Room" and give it a name
3. Share the invite link with friends
4. Click on a song to play it synced for everyone
5. Chat with room members in real-time

**Features:**
- Real-time play/pause/seek sync
- Room chat
- Member count tracking
- Host transfer when host leaves

**No additional API keys required** - uses existing Socket.io setup

**Files:**
- Backend: `backend/src/models/room.model.js`, `backend/src/routes/room.route.js`, `backend/src/lib/socket.js`
- Frontend: `frontend/src/pages/listening-room/ListeningRoomsPage.tsx`, `frontend/src/services/roomService.ts`

---

### 4. AI Lyrics Analysis (Grok/GPT-4)

**Endpoint:** `POST /api/ai/analyze-lyrics`

**Request:**
```json
{
  "lyrics": "Song lyrics text here..."
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "AI-generated meaning and themes..."
}
```

**Required API Key:**
- `GROK_API_KEY` in backend `.env`

**Files:**
- Backend: `backend/src/services/openai.service.js`

---

## Environment Setup

### Backend `.env` (required keys):

```env
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string

# Clerk Auth
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# === AI Services ===
GROK_API_KEY=xai-xxx  # Required for AI features
GROK_BASE_URL=https://api.x.ai/v1
```

### Frontend `.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_API_URL=http://localhost:5000
```

---

## Installation Steps

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables:**
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Fill in your API keys

4. **Get Grok API Key:**
   - Visit: https://x.ai/api
   - Create a new API key
   - Add to backend `.env` as `GROK_API_KEY`

5. **Run the app:**
   ```bash
   # From root directory
   npm run dev  # Runs both frontend and backend
   ```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-cover` | Generate album cover from text prompt |
| POST | `/api/ai/generate-playlist` | Generate playlist from text prompt |
| POST | `/api/ai/analyze-lyrics` | Analyze song lyrics meaning |
| GET | `/api/rooms` | Get all active rooms |
| POST | `/api/rooms` | Create a new room |
| POST | `/api/rooms/:id/join` | Join a room |
| POST | `/api/rooms/:id/leave` | Leave a room |
| DELETE | `/api/rooms/:id` | Close a room |

---

## Troubleshooting

### "Failed to generate cover art"
- Check that `GROK_API_KEY` is set in backend `.env`
- Ensure you have credits in your Grok/xAI account
- Check backend console for detailed error

### "Room sync not working"
- Verify Socket.io connection in browser console
- Check that CORS is properly configured
- Ensure all users are on the same room

### "Playlist generation returns no songs"
- Make sure you have songs in your library
- AI matches by title - ensure song titles are descriptive

---

**Built with:** React, TypeScript, Node.js, Express, Socket.io, Grok (xAI) API
