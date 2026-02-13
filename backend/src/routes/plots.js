import express from 'express';
import Plot from '../models/Plot.js';
import { analyzePlot } from '../services/analysisEngine.js';
import { getLatestCloudFreeImagery } from '../services/satelliteService.js';
import { generatePlotReport } from '../services/reportService.js';
import * as turf from '@turf/turf';

const router = express.Router();

/**
 * GET /api/plots
 * Get all plots with their latest analysis
 */
router.get('/', async (req, res) => {
    try {
        const plots = await Plot.find().sort({ 'latestAnalysis.finalRiskScore': -1 });

        res.json({
            success: true,
            count: plots.length,
            data: plots
        });
    } catch (error) {
        console.error('Error fetching plots:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plots',
            message: error.message
        });
    }
});

/**
 * GET /api/plots/:id
 * Get specific plot details
 */
router.get('/:id', async (req, res) => {
    try {
        const plot = await Plot.findById(req.params.id);

        if (!plot) {
            return res.status(404).json({
                success: false,
                error: 'Plot not found'
            });
        }

        res.json({
            success: true,
            data: plot
        });
    } catch (error) {
        console.error('Error fetching plot:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plot',
            message: error.message
        });
    }
});

/**
 * POST /api/plots/upload
 * Upload new plot boundary (GeoJSON)
 */
router.post('/upload', async (req, res) => {
    try {
        const { plotId, name, allotmentDate, geojson } = req.body;

        // Validate required fields
        if (!plotId || !name || !allotmentDate || !geojson) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: plotId, name, allotmentDate, geojson'
            });
        }

        // Validate GeoJSON
        if (!geojson.type || !geojson.coordinates) {
            return res.status(400).json({
                success: false,
                error: 'Invalid GeoJSON format'
            });
        }

        // Calculate approved area
        const polygon = turf.polygon(geojson.coordinates);
        const approvedArea = turf.area(polygon);

        // Check if plot already exists
        const existingPlot = await Plot.findOne({ plotId });
        if (existingPlot) {
            return res.status(409).json({
                success: false,
                error: 'Plot with this ID already exists'
            });
        }

        // Create new plot
        const plot = new Plot({
            plotId,
            name,
            allotmentDate: new Date(allotmentDate),
            boundary: geojson,
            approvedArea
        });

        await plot.save();

        res.status(201).json({
            success: true,
            message: 'Plot uploaded successfully',
            data: plot
        });
    } catch (error) {
        console.error('Error uploading plot:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload plot',
            message: error.message
        });
    }
});

/**
 * POST /api/plots/analyze-custom
 * Analyze a custom drawn area
 */
router.post('/analyze-custom', async (req, res) => {
    try {
        const { geometry } = req.body;

        if (!geometry || !geometry.coordinates) {
            return res.status(400).json({
                success: false,
                error: 'Invalid geometry'
            });
        }

        // Calculate area
        const polygon = turf.polygon(geometry.coordinates);
        const area = turf.area(polygon);

        // Fetch satellite imagery
        const satelliteData = await getLatestCloudFreeImagery(geometry);

        // Run analysis
        // For custom areas, we assume approved area = actual area (no deviation check against separate boundary)
        // Or we could simulate deviation if valid boundary input was provided, but for drawing, usually we just analyze usage.
        const analysisResult = await analyzePlot({
            boundary: geometry,
            approvedArea: area,
            simulatedBuiltUpPercentage: Math.floor(Math.random() * 40) + 20 // Random 20-60% for demo
        }, {
            satelliteImageUrl: satelliteData.imageUrl
        });

        // Construct a temporary plot object for the frontend to display
        const tempPlot = {
            _id: 'custom-' + Date.now(),
            plotId: 'CUSTOM-AREA',
            name: 'Custom Drawn Area',
            allotmentDate: new Date(),
            approvedArea: area,
            boundary: geometry,
            latestAnalysis: analysisResult
        };

        res.json({
            success: true,
            data: tempPlot
        });
    } catch (error) {
        console.error('Error analyzing custom area:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze custom area',
            message: error.message
        });
    }
});

/**
 * POST /api/plots/analyze-comparison
 * Compare drawn polygon with reference plot to identify overlap, encroachment, and unused areas
 */
router.post('/analyze-comparison', async (req, res) => {
    try {
        const { referencePlotId, drawnGeometry } = req.body;

        // Validate inputs
        if (!referencePlotId || !drawnGeometry) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: referencePlotId and drawnGeometry'
            });
        }

        if (!drawnGeometry.coordinates) {
            return res.status(400).json({
                success: false,
                error: 'Invalid drawnGeometry format'
            });
        }

        // Fetch reference plot from database
        const referencePlot = await Plot.findById(referencePlotId);
        if (!referencePlot) {
            return res.status(404).json({
                success: false,
                error: 'Reference plot not found'
            });
        }

        // Create Turf polygons
        const referencePolygon = turf.polygon(referencePlot.boundary.coordinates);
        const drawnPolygon = turf.polygon(drawnGeometry.coordinates);

        // Calculate spatial relationships
        const features = [];

        // 1. Overlap (Intersection) - Valid usage (Blue)
        try {
            const intersection = turf.intersect(turf.featureCollection([referencePolygon, drawnPolygon]));
            if (intersection) {
                const overlapArea = turf.area(intersection);
                features.push({
                    type: 'Feature',
                    properties: {
                        category: 'overlap',
                        color: '#3b82f6', // Blue
                        area: overlapArea,
                        areaHectares: (overlapArea / 10000).toFixed(4)
                    },
                    geometry: intersection.geometry
                });
            }
        } catch (err) {
            console.warn('No intersection found:', err.message);
        }

        // 2. Encroachment (Drawn area outside reference) - Red
        try {
            const encroachment = turf.difference(turf.featureCollection([drawnPolygon, referencePolygon]));
            if (encroachment) {
                const encroachmentArea = turf.area(encroachment);
                if (encroachmentArea > 0.1) { // Only include if area > 0.1 sq meters
                    features.push({
                        type: 'Feature',
                        properties: {
                            category: 'encroachment',
                            color: '#dc2626', // Red
                            area: encroachmentArea,
                            areaHectares: (encroachmentArea / 10000).toFixed(4)
                        },
                        geometry: encroachment.geometry
                    });
                }
            }
        } catch (err) {
            console.warn('No encroachment found:', err.message);
        }

        // 3. Unused (Reference area not covered by drawn) - Green
        try {
            const unused = turf.difference(turf.featureCollection([referencePolygon, drawnPolygon]));
            if (unused) {
                const unusedArea = turf.area(unused);
                if (unusedArea > 0.1) { // Only include if area > 0.1 sq meters
                    features.push({
                        type: 'Feature',
                        properties: {
                            category: 'unused',
                            color: '#16a34a', // Green
                            area: unusedArea,
                            areaHectares: (unusedArea / 10000).toFixed(4)
                        },
                        geometry: unused.geometry
                    });
                }
            }
        } catch (err) {
            console.warn('No unused area found:', err.message);
        }

        // Return GeoJSON FeatureCollection
        const result = {
            type: 'FeatureCollection',
            features: features
        };

        res.json({
            success: true,
            data: result,
            metadata: {
                referencePlotId: referencePlot._id,
                referencePlotName: referencePlot.name,
                totalFeatures: features.length
            }
        });
    } catch (error) {
        console.error('Error in analyze-comparison:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze comparison',
            message: error.message
        });
    }
});

/**
 * POST /api/plots/:id/analyze
 * Trigger analysis for a specific plot
 */
router.post('/:id/analyze', async (req, res) => {
    try {
        const plot = await Plot.findById(req.params.id);

        if (!plot) {
            return res.status(404).json({
                success: false,
                error: 'Plot not found'
            });
        }

        // Fetch satellite imagery
        const satelliteData = await getLatestCloudFreeImagery(plot.boundary);

        // Run analysis
        const analysisResult = await analyzePlot({
            boundary: plot.boundary,
            approvedArea: plot.approvedArea,
            simulatedBuiltUpPercentage: req.body.simulatedBuiltUpPercentage || 45
        }, {
            satelliteImageUrl: satelliteData.imageUrl,
            marketValuePerSqMeter: plot.marketValuePerSqMeter
        });

        // Update plot with analysis results
        plot.latestAnalysis = analysisResult;
        plot.analysisHistory.push(analysisResult);

        await plot.save();

        res.json({
            success: true,
            message: 'Analysis completed successfully',
            data: {
                plot,
                analysis: analysisResult
            }
        });
    } catch (error) {
        console.error('Error analyzing plot:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze plot',
            message: error.message
        });
    }
});

/**
 * GET /api/plots/:id/report
 * Generate PDF report for a plot
 */
router.get('/:id/report', async (req, res) => {
    try {
        const plot = await Plot.findById(req.params.id);

        if (!plot) {
            return res.status(404).json({
                success: false,
                error: 'Plot not found'
            });
        }

        if (!plot.latestAnalysis) {
            return res.status(400).json({
                success: false,
                error: 'No analysis available for this plot. Please run analysis first.'
            });
        }

        // Generate PDF report
        const report = await generatePlotReport(plot, plot.latestAnalysis);

        res.json({
            success: true,
            message: 'Report generated successfully',
            data: report
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate report',
            message: error.message
        });
    }
});

/**
 * GET /api/plots/stats/summary
 * Get summary statistics for dashboard
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const totalPlots = await Plot.countDocuments();

        const plots = await Plot.find({ 'latestAnalysis.finalRiskScore': { $exists: true } });

        const highRiskPlots = plots.filter(p => p.latestAnalysis.finalRiskScore >= 70).length;
        const mediumRiskPlots = plots.filter(p =>
            p.latestAnalysis.finalRiskScore >= 40 && p.latestAnalysis.finalRiskScore < 70
        ).length;
        const lowRiskPlots = plots.filter(p => p.latestAnalysis.finalRiskScore < 40).length;

        const violationsCount = plots.filter(p =>
            p.latestAnalysis.boundaryViolationScore > 50 ||
            p.latestAnalysis.unauthorizedConstructionScore > 50
        ).length;

        const vacantPlots = plots.filter(p => p.latestAnalysis.isVacant).length;

        res.json({
            success: true,
            data: {
                totalPlots,
                analyzedPlots: plots.length,
                highRiskPlots,
                mediumRiskPlots,
                lowRiskPlots,
                violationsCount,
                vacantPlots,
                financialStats: {
                    totalUnusedLandArea: plots.reduce((acc, p) => {
                        // Use stored value if available
                        if (p.latestAnalysis?.unusedLandArea) return acc + p.latestAnalysis.unusedLandArea;

                        // Fallback: Calculate from builtUpPercentage
                        const builtUpPct = p.latestAnalysis?.builtUpPercentage || 0;
                        const approvedArea = p.approvedArea || 0;
                        const unusedArea = approvedArea * (1 - (builtUpPct / 100));
                        return acc + unusedArea;
                    }, 0),

                    totalDailyLoss: plots.reduce((acc, p) => {
                        // Use stored value if available
                        if (p.latestAnalysis?.financialLoss?.dailyLoss) return acc + p.latestAnalysis.financialLoss.dailyLoss;

                        // Fallback: Calculate from unused area (derived)
                        const builtUpPct = p.latestAnalysis?.builtUpPercentage || 0;
                        const approvedArea = p.approvedArea || 0;
                        const unusedArea = approvedArea * (1 - (builtUpPct / 100));

                        const marketRate = p.marketValuePerSqMeter || 5000;
                        const totalValue = unusedArea * marketRate;
                        const dailyLoss = (totalValue * 0.10) / 365;

                        return acc + dailyLoss;
                    }, 0)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            message: error.message
        });
    }
});

/**
 * DELETE /api/plots/:id
 * Remove a plot from the system
 */
router.delete('/:id', async (req, res) => {
    try {
        const plot = await Plot.findById(req.params.id);

        if (!plot) {
            return res.status(404).json({
                success: false,
                error: 'Plot not found'
            });
        }

        await plot.deleteOne();

        res.json({
            success: true,
            message: 'Plot deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting plot:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete plot',
            message: error.message
        });
    }
});

export default router;
