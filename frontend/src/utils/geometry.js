export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export const calculatePolygonPerimeter = (points) => {
    if (points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        // If the polygon is not closed yet (during drawing), don't connect last to first
        // But for "perimeter of the shape so far", we usually just sum the segments.
        // If it's a closed polygon analysis, we strict loop.
        // For drawing line string:
        if (i === points.length - 1) {
            // For a closed polygon perimeter, we add the closing segment.
            // But while drawing, maybe just the line length?
            // Let's assume we want the "perimeter of the implied polygon".
            perimeter += calculateDistance(p1[0], p1[1], points[0][0], points[0][1]);
        } else {
            perimeter += calculateDistance(p1[0], p1[1], p2[0], p2[1]);
        }
    }
    return perimeter;
};

// Calculate area using Shoelace formula adapted for spherical coordinates (rough approx for small areas)
// or better, using a spherical excess method if needed.
// For small industrial plots, projection needed.
// A simple approach: Convert to meters (approx) relative to a centroid and use planar shoelace.
export const calculatePolygonArea = (points) => {
    if (points.length < 3) return 0;

    const earthRadius = 6371000; // meters
    let area = 0;

    if (points.length > 2) {
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];

            const radX1 = (p1[1] * Math.PI) / 180;
            const radY1 = (p1[0] * Math.PI) / 180;
            const radX2 = (p2[1] * Math.PI) / 180;
            const radY2 = (p2[0] * Math.PI) / 180;

            area += (radX2 - radX1) * (2 + Math.sin(radY1) + Math.sin(radY2));
        }
        area = (area * earthRadius * earthRadius) / 2.0;
    }

    return Math.abs(area);
};
