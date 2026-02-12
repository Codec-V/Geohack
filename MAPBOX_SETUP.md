# 🛰️ Mapbox Satellite Integration - Quick Setup Guide

## ✅ What's Been Done

Your GeoCompliance system now uses **real satellite imagery** from Mapbox instead of dummy data!

### Changes Made:
1. ✅ Installed `axios` for HTTP requests
2. ✅ Updated `satelliteService.js` with Mapbox Static Images API
3. ✅ Added `MAPBOX_ACCESS_TOKEN` to environment variables
4. ✅ Implemented automatic zoom level calculation
5. ✅ Added high-resolution imagery support (up to 1280x1024)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Your Free Mapbox Token

1. **Sign up for Mapbox** (if you don't have an account):
   - Go to: https://account.mapbox.com/auth/signup/
   - Sign up with email (free forever)

2. **Get your access token**:
   - After signup, you'll be redirected to: https://account.mapbox.com/access-tokens/
   - Copy your **Default public token** (starts with `pk.`)
   - It looks like: `pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZjEyMzQ1Njc4OTAifQ.abcdefghijklmnop`

### Step 2: Update Your Environment File

1. Open `backend/.env` file
2. Replace the demo token with your real token:

```env
MAPBOX_ACCESS_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE
```

**Example:**
```env
# Before (demo token - won't work)
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrZGVtb3Rva2VuIn0.demo_token_replace_with_yours

# After (your real token)
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibXl1c2VybmFtZSIsImEiOiJjbGYxMjM0NTY3ODkwIn0.abcdefghijklmnop
```

### Step 3: Restart Backend Server

The backend server should automatically restart (if using `npm run dev`). If not:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### Step 4: Test Real Satellite Imagery

1. **Upload a plot** with real coordinates (or use demo plots)
2. **Run analysis** on the plot
3. **Check plot details** - you'll see real Mapbox satellite imagery!

---

## 🗺️ How It Works Now

### Before (Dummy Data):
- Placeholder image URLs
- Simulated satellite data
- No real imagery

### After (Real Mapbox Data):
- ✅ **Real satellite imagery** from Mapbox
- ✅ **High-resolution** composite imagery (0.5m resolution)
- ✅ **Cloud-free** - Mapbox provides pre-processed cloud-free composites
- ✅ **Automatic zoom** - calculates optimal zoom based on plot size
- ✅ **Overlay support** - can highlight plot boundaries on imagery

### API Features:

```javascript
// Basic satellite imagery
fetchSatelliteImagery(plotBoundary)
// Returns: Real satellite image URL from Mapbox

// High-resolution imagery
fetchHighResImagery(plotBoundary)
// Returns: 1280x1024 high-res satellite image

// With boundary overlay
generateOverlayImageUrl(plotBoundary, { 
  strokeColor: 'ff0000',  // Red boundary
  fillColor: 'ff000033'    // Semi-transparent red fill
})
// Returns: Satellite image with plot boundary highlighted
```

---

## 📊 Mapbox Free Tier Limits

Your free Mapbox account includes:
- ✅ **200,000 static image requests/month** (more than enough!)
- ✅ **50 GB map views/month**
- ✅ **Unlimited** map loads for development

**For your hackathon**: This is completely free and sufficient! 🎉

---

## 🧪 Testing Real Imagery

### Test with Demo Plots:

The demo plots in `demo-data/` use coordinates near Delhi, India:
- `sample-plot-1.geojson` - Small industrial plot
- `sample-plot-2.geojson` - Medium industrial plot

Upload these and run analysis to see real satellite imagery!

### Create Your Own Real Plots:

1. **Find your industrial area** on Google Maps
2. **Get coordinates**:
   - Right-click on map → "What's here?"
   - Copy latitude/longitude
3. **Create GeoJSON**:
   ```json
   {
     "type": "Polygon",
     "coordinates": [[
       [longitude1, latitude1],
       [longitude2, latitude2],
       [longitude3, latitude3],
       [longitude4, latitude4],
       [longitude1, latitude1]
     ]]
   }
   ```
4. **Upload to GeoCompliance**

---

## 🔍 Verification

To verify Mapbox is working:

1. **Check backend logs** when analyzing a plot:
   ```
   ✅ Fetching satellite imagery from Mapbox...
   ✅ Image URL: https://api.mapbox.com/styles/v1/mapbox/satellite-v9/...
   ```

2. **Check plot details modal**:
   - Should show real satellite imagery
   - Image should load (not broken)
   - Should show actual terrain/buildings

3. **Check browser console**:
   - No CORS errors
   - Image loads successfully

---

## 🐛 Troubleshooting

### Issue: "Invalid access token"
**Solution**: 
- Make sure you copied the full token (starts with `pk.`)
- No spaces before/after the token
- Restart backend server after updating `.env`

### Issue: Images not loading
**Solution**:
- Check internet connection
- Verify token is correct
- Check browser console for errors
- Try accessing the image URL directly in browser

### Issue: "403 Forbidden"
**Solution**:
- Token might be invalid or expired
- Generate a new token from Mapbox dashboard
- Make sure you're using the public token (not secret token)

---

## 🎯 Next Steps

Now that you have real satellite imagery:

1. ✅ **Upload real industrial plots** from your target area
2. ✅ **Run analysis** to see actual built-up areas
3. ✅ **Generate reports** with real satellite images
4. ✅ **Demo to judges** with confidence! 🏆

---

## 📸 Example Output

When you analyze a plot now, you'll get:

```json
{
  "satelliteImageUrl": "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/77.2095,28.6144,16,0/600x400@2x?access_token=pk.your_token",
  "source": "Mapbox Satellite",
  "resolution": 0.5,
  "cloudCoverage": 5,
  "date": "2026-02-11T22:41:02.000Z"
}
```

The image URL will show **real satellite imagery** of your plot! 🛰️

---

## 💡 Pro Tips

1. **Higher resolution for reports**:
   - The system automatically uses 800x600 for analysis
   - Reports can use up to 1280x1024

2. **Zoom levels**:
   - Automatically calculated based on plot size
   - Larger plots = lower zoom (wider view)
   - Smaller plots = higher zoom (detailed view)

3. **Overlay mode**:
   - Use `generateOverlayImageUrl()` to highlight boundaries
   - Great for reports and presentations

---

**You're all set!** 🎉 Your GeoCompliance system now uses real satellite data from Mapbox!
