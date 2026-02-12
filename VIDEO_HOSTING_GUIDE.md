# Video Hosting API Integration - Configuration Guide

## 🎯 Overview
Your SKYFLIX platform now supports **4 video hosting APIs** with automatic primary/fallback switching:
- Streamp2p
- SeekStreaming
- Upnshare
- Rpmshare

## ✅ What's Implemented

### Backend (`/backend`)
- ✅ Configuration system (`config/videohosting.config.js`)
- ✅ Service layer (`services/videohosting.service.js`)
  - Title parsing (removes SKYFLIX, {Hindi-English}, etc.)
  - TMDB content matching (title+year for movies, title+season+episode for series)
  - Primary/fallback API logic
  - Concurrent fetching with `Promise.all()`
- ✅ Controller (`controllers/videohosting.controller.js`)
- ✅ Routes (`routes/videohosting.routes.js`)
  - `POST /api/videohosting/fetch` - Fetch videos
  - `GET /api/videohosting/status` - Check service status

### Frontend (`/frontend`)
- ✅ Service (`services/videohosting.service.ts`)
- ✅ Video Player (`pages/VideoPlayerPage.tsx`)
  - Multi-server selector UI
  - Auto-switch to first available server
  - Server switching without reload
  - Fallback to Videasy.net if no servers available
- ✅ Download Page (`pages/DownloadPage.tsx`)
  - Multiple download buttons (1-4 based on availability)
  - Server names displayed
  - Proper error handling

---

## 📋 API Configuration Required

You need to provide the following API details for each service:

### 1. Streamp2p (Partial - Need Endpoints)
```env
STREAMP2P_PRIMARY_ENDPOINT=https://api.streamp2p.com/v1/videos  # EXAMPLE - Replace with real
STREAMP2P_PRIMARY_KEY=a56bbd94407e8de1550df9cf  # ✅ Provided
STREAMP2P_FALLBACK_ENDPOINT=https://api.streamp2p.com/v1/videos  # EXAMPLE - Replace with real
STREAMP2P_FALLBACK_KEY=10396bb2ed0fee13eebfe9b0  # ✅ Provided
```

### 2. SeekStreaming (Not Configured)
```env
SEEKSTREAMING_PRIMARY_ENDPOINT=  # ❌ NEED THIS
SEEKSTREAMING_PRIMARY_KEY=  # ❌ NEED THIS
SEEKSTREAMING_FALLBACK_ENDPOINT=  # ❌ NEED THIS
SEEKSTREAMING_FALLBACK_KEY=  # ❌ NEED THIS
```

### 3. Upnshare (Not Configured)
```env
UPNSHARE_PRIMARY_ENDPOINT=  # ❌ NEED THIS
UPNSHARE_PRIMARY_KEY=  # ❌ NEED THIS
UPNSHARE_FALLBACK_ENDPOINT=  # ❌ NEED THIS
UPNSHARE_FALLBACK_KEY=  # ❌ NEED THIS
```

### 4. Rpmshare (Not Configured)
```env
RPMSHARE_PRIMARY_ENDPOINT=  # ❌ NEED THIS
RPMSHARE_PRIMARY_KEY=  # ❌ NEED THIS
RPMSHARE_FALLBACK_ENDPOINT=  # ❌ NEED THIS
RPMSHARE_FALLBACK_KEY=  # ❌ NEED THIS
```

---

## 🔧 How to Configure

### Step 1: Update `.env` File
Add the environment variables to `backend/.env`:

```env
# Streamp2p
STREAMP2P_PRIMARY_ENDPOINT=https://your-api-url.com/v1/videos
STREAMP2P_PRIMARY_KEY=a56bbd94407e8de1550df9cf
STREAMP2P_FALLBACK_ENDPOINT=https://your-fallback-url.com/v1/videos
STREAMP2P_FALLBACK_KEY=10396bb2ed0fee13eebfe9b0

# SeekStreaming
SEEKSTREAMING_PRIMARY_ENDPOINT=
SEEKSTREAMING_PRIMARY_KEY=
SEEKSTREAMING_FALLBACK_ENDPOINT=
SEEKSTREAMING_FALLBACK_KEY=

# Upnshare
UPNSHARE_PRIMARY_ENDPOINT=
UPNSHARE_PRIMARY_KEY=
UPNSHARE_FALLBACK_ENDPOINT=
UPNSHARE_FALLBACK_KEY=

# Rpmshare
RPMSHARE_PRIMARY_ENDPOINT=
RPMSHARE_PRIMARY_KEY=
RPMSHARE_FALLBACK_ENDPOINT=
RPMSHARE_FALLBACK_KEY=
```

### Step 2: Enable Services
In `backend/src/config/videohosting.config.js`, change `enabled: false` to `enabled: true`:

```javascript
seekstreaming: {
    enabled: true,  // Change this to true after adding credentials
    // ...
},
```

### Step 3: Restart Backend
```bash
cd backend
npm run dev
```

---

## 📊 Expected API Response Format

The system expects this JSON structure from each API:

```json
{
  "results": [
    {
      "id": "video_12345",
      "name": "Spider-Man: Homecoming (2017) {Hindi-English} SKYFLIX",
      "title": "Spider-Man: Homecoming (2017) {Hindi-English} SKYFLIX",
      "embed": "<iframe src='https://embed.example.com/video_12345'></iframe>",
      "embedUrl": "https://embed.example.com/video_12345",
      "download": "https://download.example.com/video_12345",
      "downloadUrl": "https://download.example.com/video_12345"
    }
  ]
}
```

**Important Notes:**
- Either `embed` (iframe) or `embedUrl` (direct URL) must be present
- Either `download` or `downloadUrl` must be present
- `name` or `title` should include the content name with optional year/season/episode

---

## 🧪 How It Works

### Title Matching

**For Movies:**
```javascript
TMDB Data: { title: "Spider-Man: Homecoming", type: "movie", year: 2017 }
API Response: "Spider-Man: Homecoming (2017) {Hindi-English} SKYFLIX"

Parsing:
1. Remove {Hindi-English} → "Spider-Man: Homecoming (2017) SKYFLIX"
2. Remove SKYFLIX → "Spider-Man: Homecoming (2017)"
3. Extract year (2017) → year: 2017
4. Extract title → "Spider-Man: Homecoming"

Match: title === title && year === year ✅
```

**For TV Series:**
```javascript
TMDB Data: { title: "It: Welcome to Derry", type: "series", season: 1, episode: 8 }
API Response: "It: Welcome to Derry S01E08 Winter Fire SKYFLIX"

Parsing:
1. Remove SKYFLIX → "It: Welcome to Derry S01E08 Winter Fire"
2. Extract S01E08 → season: 1, episode: 8
3. Extract title → "It: Welcome to Derry"

Match: title === title && season === season && episode === episode ✅
```

### Primary/Fallback Logic

```
User plays video
    ↓
Fetch from ALL 4 hosts concurrently (Promise.all)
    ↓
For each host:
    ├─ Try PRIMARY API
    │   ├─ Success? → Return embed/download URLs
    │   └─ Fail? → Try FALLBACK API
    │       ├─ Success? → Return embed/download URLs
    │       └─ Fail? → Mark as unavailable
    ↓
Display only available servers
Auto-load first available server
```

---

## 🎮 User Features

### Video Player
- **Server Selector Button** (top-left) shows when 2+ servers available
- **Auto-switch** to first available server on load
- **Server Count Badge** shows number of online servers
- **Fallback to Videasy.net** if no video hosting servers available
- **Yellow Warning** shows when using fallback

### Download Page
- Shows **1-4 download buttons** based on available servers
- Each button labeled with server name (e.g., "Download from Streamp2p")
- **Blue Download Buttons** for available servers
- **Warning Message** if no servers available

---

## 🐛 Troubleshooting

### No Servers Available
**Symptoms:** Yellow warning "Using fallback player"
**Causes:**
1. API endpoints not configured
2. API keys invalid
3. Network/CORS issues
4. No matching content found

**Check:**
```bash
# Test backend endpoint
curl -X POST http://localhost:5000/api/videohosting/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spider-Man: Homecoming",
    "type": "movie",
    "year": 2017
  }'

# Check service status
curl http://localhost:5000/api/videohosting/status
```

### Title Mismatch
If content isn't matching, check the console logs:
```
[streamp2p] Trying primary API...
[streamp2p] Match found in primary API
```

The system normalizes titles (removes special chars, lowercases), so "Spider-Man" matches "Spider Man".

### CORS Errors
Ensure backend CORS is configured in `backend/src/config/api.config.js`:
```javascript
cors: {
    origin: 'https://skyflixer.netlify.app',  // Frontend URL
    // ...
}
```

---

## ✅ Testing Checklist

- [ ] Add API credentials to `backend/.env`
- [ ] Enable services in `videohosting.config.js`
- [ ] Restart backend server
- [ ] Test `/api/videohosting/status` endpoint
- [ ] Test `/api/videohosting/fetch` with movie
- [ ] Test `/api/videohosting/fetch` with TV series
- [ ] Open video player - verify server selector shows
- [ ] Switch between servers - verify video changes
- [ ] Open download page - verify multiple download buttons
- [ ] Test with content that doesn't exist - verify fallback

---

## 📞 Need Help?

**To complete the integration:**
1. Provide API endpoints and keys for the missing services
2. Confirm the API response format matches the expected structure
3. Test with actual content and share any errors

The system is **fully functional** right now - it just needs the API credentials to activate the services!
