# Real Satellite Data Integration Guide

## Current Status (MVP)
The system currently uses **simulated data** for the hackathon demo:
- Satellite imagery URLs are placeholders
- Built-up area detection uses simulated percentages
- NDBI calculations are mocked

## Integrating Real Sentinel-2 Data

### Option 1: Google Earth Engine (Recommended)

#### Step 1: Get API Access
1. Go to https://earthengine.google.com/
2. Sign up for Earth Engine access (free for research/non-commercial)
3. Create a Google Cloud Project
4. Enable Earth Engine API
5. Create service account credentials

#### Step 2: Install Earth Engine SDK
```bash
cd backend
npm install @google/earthengine
```

#### Step 3: Update Environment Variables
Add to `backend/.env`:
```env
# Google Earth Engine
EARTH_ENGINE_PROJECT_ID=your-project-id
EARTH_ENGINE_PRIVATE_KEY_PATH=./service-account-key.json
```

#### Step 4: Replace Satellite Service

Update `backend/src/services/satelliteService.js`:

```javascript
import ee from '@google/earthengine';
import fs from 'fs';

// Initialize Earth Engine
const privateKey = JSON.parse(fs.readFileSync(process.env.EARTH_ENGINE_PRIVATE_KEY_PATH));
ee.data.authenticateViaPrivateKey(privateKey, () => {
  ee.initialize(null, null, () => {
    console.log('✅ Earth Engine initialized');
  });
});

/**
 * Fetch real Sentinel-2 imagery for a plot
 */
export async function fetchSatelliteImagery(plotBoundary, options = {}) {
  try {
    const { date = new Date(), cloudCoverageMax = 20 } = options;
    
    // Convert GeoJSON to Earth Engine geometry
    const geometry = ee.Geometry.Polygon(plotBoundary.coordinates);
    
    // Get Sentinel-2 image collection
    const collection = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(geometry)
      .filterDate(
        new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before
        date
      )
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudCoverageMax))
      .sort('CLOUDY_PIXEL_PERCENTAGE');
    
    // Get the least cloudy image
    const image = collection.first();
    
    // Calculate NDBI (Normalized Difference Built-up Index)
    // NDBI = (SWIR - NIR) / (SWIR + NIR)
    const ndbi = image.normalizedDifference(['B11', 'B8']).rename('NDBI');
    
    // Get image URL for visualization
    const bbox = calculateBoundingBox(plotBoundary);
    const imageUrl = image.getThumbURL({
      min: 0,
      max: 3000,
      bands: ['B4', 'B3', 'B2'], // RGB
      dimensions: 512,
      region: geometry
    });
    
    // Get NDBI statistics
    const ndbiStats = ndbi.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: geometry,
      scale: 10
    });
    
    return {
      imageUrl,
      date: new Date(image.get('system:time_start').getInfo()),
      cloudCoverage: image.get('CLOUDY_PIXEL_PERCENTAGE').getInfo(),
      resolution: 10,
      source: 'Sentinel-2',
      ndbiMean: ndbiStats.get('NDBI').getInfo()
    };
  } catch (error) {
    console.error('Earth Engine error:', error);
    throw error;
  }
}

/**
 * Detect built-up areas using real NDBI from satellite
 */
export async function detectBuiltUpAreas(plotBoundary, satelliteData) {
  try {
    const geometry = ee.Geometry.Polygon(plotBoundary.coordinates);
    
    // Get Sentinel-2 image
    const collection = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(geometry)
      .filterDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      )
      .sort('CLOUDY_PIXEL_PERCENTAGE');
    
    const image = collection.first();
    
    // Calculate NDBI
    const ndbi = image.normalizedDifference(['B11', 'B8']);
    
    // Threshold for built-up areas (NDBI > 0.1)
    const builtUp = ndbi.gt(0.1);
    
    // Calculate built-up area
    const builtUpArea = builtUp.multiply(ee.Image.pixelArea());
    const stats = builtUpArea.reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geometry,
      scale: 10,
      maxPixels: 1e9
    });
    
    const totalBuiltUpArea = stats.get('nd').getInfo();
    const totalArea = geometry.area().getInfo();
    const builtUpPercentage = (totalBuiltUpArea / totalArea) * 100;
    
    return {
      builtUpArea: totalBuiltUpArea,
      builtUpPercentage,
      builtUpFootprint: {
        type: 'Polygon',
        coordinates: plotBoundary.coordinates
      }
    };
  } catch (error) {
    console.error('Built-up detection error:', error);
    throw error;
  }
}
```

#### Step 5: Update Analysis Engine

Update `backend/src/services/analysisEngine.js` to use real data:

```javascript
import { fetchSatelliteImagery, detectBuiltUpAreas } from './satelliteService.js';

export async function analyzePlot(plotData, options = {}) {
  try {
    const { boundary, approvedArea } = plotData;
    
    // Step 1: Fetch real satellite imagery
    const satelliteData = await fetchSatelliteImagery(boundary, {
      cloudCoverageMax: 30
    });
    
    // Step 2: Detect built-up areas using real NDBI
    const builtUpAnalysis = await detectBuiltUpAreas(boundary, satelliteData);
    
    // Step 3: Calculate boundary deviation
    const deviationAnalysis = calculateBoundaryDeviation(
      boundary,
      builtUpAnalysis.builtUpFootprint
    );
    
    // Step 4: Check vacant status
    const isVacant = checkVacantStatus(builtUpAnalysis.builtUpPercentage);
    
    // Step 5: Calculate violation scores
    const scores = calculateViolationScores({
      deviationPercentage: deviationAnalysis.deviationPercentage,
      builtUpPercentage: builtUpAnalysis.builtUpPercentage,
      isVacant,
      hasUnauthorizedConstruction: deviationAnalysis.hasDeviation
    });
    
    return {
      timestamp: new Date(),
      builtUpArea: builtUpAnalysis.builtUpArea,
      deviationArea: deviationAnalysis.deviationArea,
      deviationPercentage: deviationAnalysis.deviationPercentage,
      isVacant,
      ...scores,
      satelliteImageUrl: satelliteData.imageUrl,
      satelliteDate: satelliteData.date,
      cloudCoverage: satelliteData.cloudCoverage
    };
  } catch (error) {
    console.error('Plot analysis error:', error);
    throw error;
  }
}
```

---

### Option 2: Sentinel Hub API (Easier but Paid)

#### Step 1: Sign Up
1. Go to https://www.sentinel-hub.com/
2. Create account (free trial available)
3. Get API credentials

#### Step 2: Install SDK
```bash
npm install @sentinel-hub/sentinelhub-js
```

#### Step 3: Implementation
```javascript
import { SentinelHub } from '@sentinel-hub/sentinelhub-js';

const sh = new SentinelHub({
  clientId: process.env.SENTINEL_HUB_CLIENT_ID,
  clientSecret: process.env.SENTINEL_HUB_CLIENT_SECRET
});

export async function fetchSatelliteImagery(plotBoundary, options = {}) {
  const bbox = calculateBoundingBox(plotBoundary);
  
  const response = await sh.process({
    input: {
      bounds: {
        bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' }
      },
      data: [{
        type: 'sentinel-2-l2a',
        dataFilter: {
          timeRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          },
          maxCloudCoverage: 20
        }
      }]
    },
    output: {
      width: 512,
      height: 512,
      responses: [{
        identifier: 'default',
        format: { type: 'image/png' }
      }]
    },
    evalscript: `
      //VERSION=3
      function setup() {
        return {
          input: ["B04", "B03", "B02", "B08", "B11"],
          output: { bands: 4 }
        };
      }
      function evaluatePixel(sample) {
        // Calculate NDBI
        let ndbi = (sample.B11 - sample.B08) / (sample.B11 + sample.B08);
        return [sample.B04, sample.B03, sample.B02, ndbi];
      }
    `
  });
  
  return response;
}
```

---

## Quick Start for Testing with Real Data

### For Hackathon Demo (Recommended)

If you need real data quickly for the demo, use **publicly available GeoJSON datasets**:

1. **Get Real Plot Boundaries**:
   - Download from OpenStreetMap
   - Use QGIS to extract industrial plots
   - Export as GeoJSON

2. **Use Free Satellite Tile Services**:
   ```javascript
   // In satelliteService.js
   function generateSatelliteUrl(bbox) {
     // Use Mapbox Satellite (free tier)
     const { minLng, minLat, maxLng, maxLat } = bbox;
     const centerLng = (minLng + maxLng) / 2;
     const centerLat = (minLat + maxLat) / 2;
     
     return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/` +
            `${centerLng},${centerLat},15,0/600x400` +
            `?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
   }
   ```

3. **Get Mapbox Token** (Free):
   - Sign up at https://www.mapbox.com/
   - Get free access token
   - Add to `.env`: `MAPBOX_ACCESS_TOKEN=your_token`

---

## Testing Real Data Integration

1. **Start with one real plot**:
   - Get actual coordinates from Google Maps
   - Create GeoJSON polygon
   - Upload and analyze

2. **Verify satellite imagery loads**:
   - Check image URL in analysis results
   - View in plot details modal

3. **Validate NDBI calculations**:
   - Compare with known built-up areas
   - Adjust thresholds if needed

---

## Production Checklist

- [ ] Earth Engine API credentials configured
- [ ] Service account key secured
- [ ] Error handling for API failures
- [ ] Caching for satellite imagery
- [ ] Rate limiting for API calls
- [ ] Fallback to cached data if API unavailable
- [ ] Cost monitoring (if using paid services)

---

## Cost Considerations

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Google Earth Engine | Free for research | Contact for commercial |
| Sentinel Hub | 5,000 requests/month | $0.0005/request |
| Mapbox Satellite | 200,000 tiles/month | $0.50/1000 tiles |

For the hackathon, the **free tiers are sufficient**!
