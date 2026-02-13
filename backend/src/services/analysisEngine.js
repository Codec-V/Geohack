import * as turf from '@turf/turf';

/**
 * Analysis Engine for GeoCompliance
 * Performs automated boundary deviation, built-up detection, and violation scoring
 */

/**
 * Calculate boundary deviation
 * Compares built-up footprint against approved boundary
 */
export function calculateBoundaryDeviation(approvedBoundary, builtUpFootprint) {
    try {
        // Convert to turf polygons if needed
        const approvedPoly = turf.polygon(approvedBoundary.coordinates);
        const builtUpPoly = turf.polygon(builtUpFootprint.coordinates);

        // Calculate area outside boundary
        const difference = turf.difference(
            turf.featureCollection([builtUpPoly, approvedPoly])
        );

        const deviationArea = difference ? turf.area(difference) : 0;
        const approvedArea = turf.area(approvedPoly);
        const deviationPercentage = (deviationArea / approvedArea) * 100;

        return {
            deviationArea,
            deviationPercentage,
            hasDeviation: deviationPercentage > 5 // 5% threshold
        };
    } catch (error) {
        console.error('Boundary deviation calculation error:', error);
        return {
            deviationArea: 0,
            deviationPercentage: 0,
            hasDeviation: false
        };
    }
}

/**
 * Detect built-up areas using NDBI simulation
 * In a real implementation, this would use satellite band data
 * For MVP, we'll simulate based on polygon area
 */
export function detectBuiltUpAreas(plotBoundary, simulatedBuiltUpPercentage = 0) {
    try {
        const poly = turf.polygon(plotBoundary.coordinates);
        const totalArea = turf.area(poly);

        // Simulate built-up area (in real implementation, use NDBI from satellite)
        const builtUpArea = totalArea * (simulatedBuiltUpPercentage / 100);

        // Create a simulated built-up footprint (simplified)
        // In production, this would come from actual satellite analysis
        const builtUpFootprint = {
            type: 'Polygon',
            coordinates: plotBoundary.coordinates // Simplified for MVP
        };

        return {
            builtUpArea,
            builtUpPercentage: simulatedBuiltUpPercentage,
            builtUpFootprint
        };
    } catch (error) {
        console.error('Built-up detection error:', error);
        return {
            builtUpArea: 0,
            builtUpPercentage: 0,
            builtUpFootprint: null
        };
    }
}

/**
 * Check if plot is vacant/underutilized
 */
export function checkVacantStatus(builtUpPercentage, threshold = 10) {
    return builtUpPercentage < threshold;
}

/**
 * Classify land usage into different categories
 * Returns detailed breakdown of usage types with area statistics and GeoJSON zones
 */
export function classifyLandUsage(plotBoundary, builtUpPercentage, deviationArea, totalArea) {
    try {
        const poly = turf.polygon(plotBoundary.coordinates);
        const plotArea = totalArea || turf.area(poly);

        // Initialize usage classification
        const usage = {
            encroached: { area: 0, percentage: 0 },
            partiallyConstructed: { area: 0, percentage: 0 },
            vacant: { area: 0, percentage: 0 },
            fullyConstructed: { area: 0, percentage: 0 }
        };

        // Calculate encroached area (construction outside boundary)
        usage.encroached.area = deviationArea || 0;
        usage.encroached.percentage = (usage.encroached.area / plotArea) * 100;

        // Calculate built-up area within boundary
        const builtUpAreaWithinBoundary = (plotArea * builtUpPercentage / 100) - usage.encroached.area;

        // Classify based on built-up percentage
        if (builtUpPercentage < 10) {
            // Vacant: less than 10% built-up
            usage.vacant.area = plotArea - usage.encroached.area;
            usage.vacant.percentage = (usage.vacant.area / plotArea) * 100;
        } else if (builtUpPercentage >= 10 && builtUpPercentage <= 60) {
            // Partially constructed: 10-60% built-up
            usage.partiallyConstructed.area = builtUpAreaWithinBoundary;
            usage.partiallyConstructed.percentage = (usage.partiallyConstructed.area / plotArea) * 100;

            // Remaining is vacant
            usage.vacant.area = plotArea - builtUpAreaWithinBoundary - usage.encroached.area;
            usage.vacant.percentage = (usage.vacant.area / plotArea) * 100;
        } else {
            // Fully constructed: more than 60% built-up
            usage.fullyConstructed.area = builtUpAreaWithinBoundary;
            usage.fullyConstructed.percentage = (usage.fullyConstructed.area / plotArea) * 100;

            // Remaining is vacant
            usage.vacant.area = plotArea - builtUpAreaWithinBoundary - usage.encroached.area;
            usage.vacant.percentage = (usage.vacant.area / plotArea) * 100;
        }

        // Create GeoJSON zones for visualization
        // For MVP, we'll create simplified zones based on the plot boundary
        // In production, this would use actual satellite-derived polygons
        const usageZones = {
            type: 'FeatureCollection',
            features: []
        };

        // Add zone features for each usage type with area > 0
        if (usage.encroached.area > 0) {
            usageZones.features.push({
                type: 'Feature',
                properties: {
                    usageType: 'encroached',
                    area: usage.encroached.area,
                    percentage: usage.encroached.percentage
                },
                geometry: plotBoundary // Simplified - would be actual encroached polygon
            });
        }

        if (usage.partiallyConstructed.area > 0) {
            usageZones.features.push({
                type: 'Feature',
                properties: {
                    usageType: 'partiallyConstructed',
                    area: usage.partiallyConstructed.area,
                    percentage: usage.partiallyConstructed.percentage
                },
                geometry: plotBoundary // Simplified - would be actual partial construction polygon
            });
        }

        if (usage.vacant.area > 0) {
            usageZones.features.push({
                type: 'Feature',
                properties: {
                    usageType: 'vacant',
                    area: usage.vacant.area,
                    percentage: usage.vacant.percentage
                },
                geometry: plotBoundary // Simplified - would be actual vacant polygon
            });
        }

        if (usage.fullyConstructed.area > 0) {
            usageZones.features.push({
                type: 'Feature',
                properties: {
                    usageType: 'fullyConstructed',
                    area: usage.fullyConstructed.area,
                    percentage: usage.fullyConstructed.percentage
                },
                geometry: plotBoundary // Simplified - would be actual fully constructed polygon
            });
        }

        return {
            classification: usage,
            zones: usageZones
        };
    } catch (error) {
        console.error('Land usage classification error:', error);
        return {
            classification: {
                encroached: { area: 0, percentage: 0 },
                partiallyConstructed: { area: 0, percentage: 0 },
                vacant: { area: 0, percentage: 0 },
                fullyConstructed: { area: 0, percentage: 0 }
            },
            zones: { type: 'FeatureCollection', features: [] }
        };
    }
}

/**
 * Calculate violation scores
 * Returns scores from 0-100 for different violation types
 */
export function calculateViolationScores(analysisData) {
    const {
        deviationPercentage,
        builtUpPercentage,
        isVacant,
        hasUnauthorizedConstruction
    } = analysisData;

    // Boundary Violation Score (0-100)
    // Higher deviation = higher score
    const boundaryViolationScore = Math.min(deviationPercentage * 2, 100);

    // Unauthorized Construction Score (0-100)
    // Based on construction outside boundary
    const unauthorizedConstructionScore = hasUnauthorizedConstruction
        ? Math.min(deviationPercentage * 3, 100)
        : 0;

    // Utilization Score (0-100)
    // Lower utilization = higher score (inverted)
    const utilizationScore = isVacant ? 100 : Math.max(100 - builtUpPercentage, 0);

    // Final Risk Score (weighted average)
    const finalRiskScore = Math.round(
        (boundaryViolationScore * 0.4) +
        (unauthorizedConstructionScore * 0.4) +
        (utilizationScore * 0.2)
    );

    return {
        boundaryViolationScore: Math.round(boundaryViolationScore),
        unauthorizedConstructionScore: Math.round(unauthorizedConstructionScore),
        utilizationScore: Math.round(utilizationScore),
        finalRiskScore
    };
}

/**
 * Main analysis function
 * Orchestrates all analysis steps
 */
export async function analyzePlot(plotData, options = {}) {
    try {
        const {
            boundary,
            approvedArea,
            simulatedBuiltUpPercentage = 45 // For demo purposes
        } = plotData;

        // Step 1: Detect built-up areas
        const builtUpAnalysis = detectBuiltUpAreas(boundary, simulatedBuiltUpPercentage);

        // Step 2: Calculate boundary deviation
        const deviationAnalysis = calculateBoundaryDeviation(
            boundary,
            builtUpAnalysis.builtUpFootprint
        );

        // Step 3: Check vacant status
        const isVacant = checkVacantStatus(builtUpAnalysis.builtUpPercentage);

        // Step 4: Calculate violation scores
        const scores = calculateViolationScores({
            deviationPercentage: deviationAnalysis.deviationPercentage,
            builtUpPercentage: builtUpAnalysis.builtUpPercentage,
            isVacant,
            hasUnauthorizedConstruction: deviationAnalysis.hasDeviation
        });

        // Step 5: Classify land usage
        const poly = turf.polygon(boundary.coordinates);
        const totalArea = turf.area(poly);
        const usageAnalysis = classifyLandUsage(
            boundary,
            builtUpAnalysis.builtUpPercentage,
            deviationAnalysis.deviationArea,
            totalArea
        );

        // Step 6: Financial Impact Analysis
        // Unused land = Total Area - Built Up Area (excluding deviation)
        // OR simply derived from the vacancy percentage
        const unusedLandArea = usageAnalysis.classification.vacant.area;

        // Financial Loss Calculation
        // Formula: Unused Area * Market Value * Factor (e.g. 0.05% daily rental yield loss)
        // For government, this could be "Blocked Capital" or "Potential Lease Revenue Lost"
        const marketValueRate = options.marketValuePerSqMeter || 5000;
        const totalLandValue = totalArea * marketValueRate;
        const unusedLandValue = unusedLandArea * marketValueRate;

        // Estimated daily loss (assuming 10% annual return expectation on land value / 365)
        const estimatedDailyLoss = (unusedLandValue * 0.10) / 365;

        return {
            timestamp: new Date(),
            builtUpArea: builtUpAnalysis.builtUpArea,
            unusedLandArea,
            financialLoss: {
                totalValue: unusedLandValue,
                dailyLoss: estimatedDailyLoss,
                marketRate: marketValueRate
            },
            deviationArea: deviationAnalysis.deviationArea,
            deviationPercentage: deviationAnalysis.deviationPercentage,
            isVacant,
            ...scores,
            usageClassification: usageAnalysis.classification,
            usageZones: usageAnalysis.zones,
            satelliteImageUrl: options.satelliteImageUrl || null
        };
    } catch (error) {
        console.error('Plot analysis error:', error);
        throw error;
    }
}
