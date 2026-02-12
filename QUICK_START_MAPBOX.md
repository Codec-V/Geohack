# 🎯 Quick Start Checklist - Mapbox Integration

## ✅ What's Already Done
- [x] Mapbox satellite service integrated
- [x] Environment variables configured
- [x] Dependencies installed (axios)
- [x] Backend code updated

## 📋 What You Need to Do (5 minutes)

### Step 1: Get Mapbox Token ⏱️ 2 minutes
1. Go to: https://account.mapbox.com/auth/signup/
2. Sign up (free, no credit card needed)
3. Copy your access token (starts with `pk.`)

### Step 2: Update .env File ⏱️ 1 minute
1. Open: `backend/.env`
2. Find line: `MAPBOX_ACCESS_TOKEN=pk.eyJ1...`
3. Replace with your token
4. Save file

### Step 3: Restart Backend ⏱️ 1 minute
```bash
# The server should auto-restart
# If not, press Ctrl+C and run:
npm run dev
```

### Step 4: Test It! ⏱️ 1 minute
1. Upload a plot (use demo files in `demo-data/`)
2. Click "Run Analysis"
3. View plot details - you'll see REAL satellite imagery! 🛰️

---

## 🔍 How to Verify It's Working

### ✅ Backend Logs Should Show:
```
✅ Fetching satellite imagery from Mapbox...
✅ Image URL: https://api.mapbox.com/styles/v1/mapbox/satellite-v9/...
```

### ✅ Frontend Should Show:
- Real satellite imagery in plot details modal
- Actual terrain/buildings visible
- No broken image icons

---

## 📸 Before vs After

### Before (Dummy Data):
```
imageUrl: "https://api.mapbox.com/...demo"
source: "Sentinel-2 (Simulated for MVP)"
```

### After (Real Mapbox Data):
```
imageUrl: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/77.2095,28.6144,16,0/600x400@2x?access_token=pk.YOUR_TOKEN"
source: "Mapbox Satellite"
resolution: 0.5 meters
```

---

## 🆘 Need Help?

See detailed guide: [MAPBOX_SETUP.md](file:///c:/Users/vedya/OneDrive/Desktop/Geohack/MAPBOX_SETUP.md)

**Common Issues:**
- Token not working? Make sure it starts with `pk.` (public token)
- Images not loading? Check internet connection
- Server not restarting? Manually restart with `npm run dev`

---

**Total Time: ~5 minutes** ⏱️

Once done, your GeoCompliance system will use **real satellite imagery** from space! 🛰️🌍
