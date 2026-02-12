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
            satelliteImageUrl: satelliteData.imageUrl
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
                vacantPlots
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

export default router;
