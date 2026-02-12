import mongoose from 'mongoose';
import { classifyLandUsage } from '../src/services/analysisEngine.js';
import { generatePlotReport } from '../src/services/reportService.js';
import path from 'path';
import fs from 'fs';

// Mock data
const mockPlot = {
    plotId: 'TEST-001',
    name: 'Test Industrial Plot',
    allotmentDate: new Date(),
    approvedArea: 10000, // 1 hectare
    boundary: {
        type: 'Polygon',
        coordinates: [[
            [77.1025, 28.7041],
            [77.1025, 28.7050], // approx 100m
            [77.1035, 28.7050], // approx 100m
            [77.1035, 28.7041],
            [77.1025, 28.7041]
        ]]
    }
};

async function testClassificationAndReport() {
    console.log('🧪 Starting Verification Test...');

    // 1. Test Usage Classification
    console.log('\n--- Testing Classification Logic ---');

    // Scenario 1: Mixed usage
    const totalArea = 10000;
    const builtUpPercentage = 45; // 45% built-up
    const deviationArea = 500; // 500 sq m encroached (5%)

    const result = classifyLandUsage(
        mockPlot.boundary,
        builtUpPercentage,
        deviationArea,
        totalArea
    );

    console.log('Classification Result:', JSON.stringify(result.classification, null, 2));

    // Verify calculations
    const expectedEncroached = 500;
    const expectedPartially = (10000 * 0.45) - 500; // 4500 - 500 = 4000
    const expectedVacant = 10000 - 4000 - 500; // 5500

    if (Math.abs(result.classification.encroached.area - expectedEncroached) < 1) {
        console.log('✅ Encroached area calculation correct');
    } else {
        console.error('❌ Encroached area calculation failed');
    }

    if (Math.abs(result.classification.partiallyConstructed.area - expectedPartially) < 1) {
        console.log('✅ Partially constructed area calculation correct');
    } else {
        console.error('❌ Partially constructed area calculation failed');
    }

    // 2. Test Report Generation
    console.log('\n--- Testing Report Generation ---');

    const analysisData = {
        finalRiskScore: 65,
        boundaryViolationScore: 10,
        unauthorizedConstructionScore: 20,
        utilizationScore: 55,
        builtUpArea: 4500,
        deviationArea: 500,
        deviationPercentage: 5,
        isVacant: false,
        usageClassification: result.classification,
        usageZones: result.zones
    };

    try {
        const report = await generatePlotReport(mockPlot, analysisData);
        console.log(`✅ Report generated successfully: ${report.filepath}`);

        if (fs.existsSync(report.filepath)) {
            console.log('✅ Report file exists on disk');
        } else {
            console.error('❌ Report file not found');
        }
    } catch (error) {
        console.error('❌ Report generation failed:', error);
    }
}

testClassificationAndReport().catch(console.error);
