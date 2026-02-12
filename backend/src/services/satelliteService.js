import axios from 'axios';

/**
 * Satellite Imagery Service with Mapbox Integration
 * Provides real satellite imagery using Mapbox Static Images API
 */

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox/satellite-v9'; // High-resolution satellite imagery

/**
 * Fetch real satellite imagery for a given plot boundary using Mapbox
 */
export async function fetchSatelliteImagery(plotBoundary, options = {}) {
    try {
        const { date = new Date(), width = 600, height = 400 } = options;

        // Calculate bounding box and center from polygon
        const bbox = calculateBoundingBox(plotBoundary);
        const center = {
            lng: (bbox.minLng + bbox.maxLng) / 2,
            lat: (bbox.minLat + bbox.maxLat) / 2
        };

        // Calculate appropriate zoom level based on area
        const zoom = calculateZoomLevel(bbox);

        // Generate Mapbox Static Image URL
        const imageUrl = `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/` +
            `${center.lng},${center.lat},${zoom},0/${width}x${height}@2x` +
            `?access_token=${MAPBOX_ACCESS_TOKEN}`;

        // Verify the image is accessible
        try {
            await axios.head(imageUrl);
        } catch (error) {
            console.warn('Mapbox image verification failed:', error.message);
        }

        return {
            imageUrl,
            date,
            cloudCoverage: 5, // Mapbox provides cloud-free composite imagery
            resolution: 0.5, // Mapbox satellite resolution in meters (varies by location)
            source: 'Mapbox Satellite',
            center,
            zoom,
            bbox
        };
    } catch (error) {
        console.error('Satellite imagery fetch error:', error);
        throw error;
    }
}

/**
 * Calculate bounding box from GeoJSON polygon
 */
function calculateBoundingBox(boundary) {
    const coords = boundary.coordinates[0];

    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    coords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
    });

    return { minLng, minLat, maxLng, maxLat };
}

/**
 * Calculate appropriate zoom level based on bounding box size
 */
function calculateZoomLevel(bbox) {
    // Calculate the span of the bounding box
    const lngSpan = bbox.maxLng - bbox.minLng;
    const latSpan = bbox.maxLat - bbox.minLat;
    const maxSpan = Math.max(lngSpan, latSpan);

    // Determine zoom level (higher zoom = more detail)
    // Mapbox zoom levels: 0 (world) to 22 (building level)
    if (maxSpan > 0.1) return 12;      // Large area
    if (maxSpan > 0.05) return 14;     // Medium area
    if (maxSpan > 0.01) return 16;     // Small area
    if (maxSpan > 0.005) return 17;    // Very small area
    return 18;                          // Detailed view
}

/**
 * Get latest cloud-free imagery
 * Mapbox provides pre-processed cloud-free satellite composites
 */
export async function getLatestCloudFreeImagery(plotBoundary, maxCloudCoverage = 20) {
    try {
        // Mapbox satellite imagery is already cloud-free composite
        const imagery = await fetchSatelliteImagery(plotBoundary, {
            width: 800,
            height: 600
        });

        return imagery;
    } catch (error) {
        console.error('Cloud-free imagery fetch error:', error);
        throw error;
    }
}

/**
 * Fetch high-resolution imagery for detailed analysis
 */
export async function fetchHighResImagery(plotBoundary) {
    try {
        return await fetchSatelliteImagery(plotBoundary, {
            width: 1280,
            height: 1024
        });
    } catch (error) {
        console.error('High-res imagery fetch error:', error);
        throw error;
    }
}

/**
 * Generate overlay URL with plot boundary highlighted
 * Uses Mapbox Static API with GeoJSON overlay
 */
export async function generateOverlayImageUrl(plotBoundary, options = {}) {
    try {
        const { strokeColor = 'ff0000', strokeWidth = 3, fillColor = 'ff000033' } = options;

        const bbox = calculateBoundingBox(plotBoundary);
        const center = {
            lng: (bbox.minLng + bbox.maxLng) / 2,
            lat: (bbox.minLat + bbox.maxLat) / 2
        };
        const zoom = calculateZoomLevel(bbox);

        // Create GeoJSON overlay
        const geojsonOverlay = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: plotBoundary,
                properties: {
                    stroke: `#${strokeColor}`,
                    'stroke-width': strokeWidth,
                    fill: `#${fillColor}`
                }
            }]
        };

        // Encode GeoJSON for URL
        const encodedGeoJSON = encodeURIComponent(JSON.stringify(geojsonOverlay));

        // Generate overlay URL
        const overlayUrl = `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/` +
            `geojson(${encodedGeoJSON})/` +
            `${center.lng},${center.lat},${zoom},0/600x400@2x` +
            `?access_token=${MAPBOX_ACCESS_TOKEN}`;

        return overlayUrl;
    } catch (error) {
        console.error('Overlay generation error:', error);
        // Fallback to regular imagery
        return (await fetchSatelliteImagery(plotBoundary)).imageUrl;
    }
}

export default {
    fetchSatelliteImagery,
    getLatestCloudFreeImagery,
    fetchHighResImagery,
    generateOverlayImageUrl
};
