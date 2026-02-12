import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate PDF report for a plot analysis
 */
export async function generatePlotReport(plotData, analysisData) {
    try {
        // Create reports directory if it doesn't exist
        const reportsDir = path.join(__dirname, '../../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `plot-${plotData.plotId}-${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24)
            .fillColor('#1a1a1a')
            .text('GeoCompliance Report', { align: 'center' });

        doc.moveDown();
        doc.fontSize(12)
            .fillColor('#666')
            .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

        doc.moveDown(2);

        // Plot Details Section
        doc.fontSize(16)
            .fillColor('#1a1a1a')
            .text('Plot Details', { underline: true });

        doc.moveDown(0.5);
        doc.fontSize(11)
            .fillColor('#333');

        doc.text(`Plot ID: ${plotData.plotId}`);
        doc.text(`Name: ${plotData.name}`);
        doc.text(`Allotment Date: ${new Date(plotData.allotmentDate).toLocaleDateString()}`);
        doc.text(`Approved Area: ${(plotData.approvedArea / 10000).toFixed(2)} hectares`);

        doc.moveDown(2);

        // Analysis Results Section
        doc.fontSize(16)
            .fillColor('#1a1a1a')
            .text('Analysis Results', { underline: true });

        doc.moveDown(0.5);
        doc.fontSize(11);

        // Risk Score with color coding
        const riskColor = getRiskColor(analysisData.finalRiskScore);
        doc.fillColor(riskColor)
            .fontSize(14)
            .text(`Final Risk Score: ${analysisData.finalRiskScore}/100`, { bold: true });

        doc.moveDown(0.5);
        doc.fillColor('#333')
            .fontSize(11);

        // Violation Scores
        doc.text(`Boundary Violation Score: ${analysisData.boundaryViolationScore}/100`);
        doc.text(`Unauthorized Construction Score: ${analysisData.unauthorizedConstructionScore}/100`);
        doc.text(`Utilization Score: ${analysisData.utilizationScore}/100`);

        doc.moveDown(1);

        // Detailed Metrics
        doc.text(`Built-up Area: ${(analysisData.builtUpArea / 10000).toFixed(2)} hectares`);
        doc.text(`Deviation Area: ${(analysisData.deviationArea / 10000).toFixed(4)} hectares`);
        doc.text(`Deviation Percentage: ${analysisData.deviationPercentage.toFixed(2)}%`);
        doc.text(`Vacant Status: ${analysisData.isVacant ? 'Yes (Underutilized)' : 'No'}`);

        doc.moveDown(2);

        // Land Usage Classification Section
        if (analysisData.usageClassification) {
            doc.fontSize(16)
                .fillColor('#1a1a1a')
                .text('Land Usage Classification', { underline: true });

            doc.moveDown(0.5);
            doc.fontSize(11)
                .fillColor('#333');

            const { encroached, partiallyConstructed, vacant, fullyConstructed } = analysisData.usageClassification;

            if (encroached && encroached.area > 0) {
                doc.fillColor('#dc2626') // Red
                    .text(`Encroached Area: ${(encroached.area / 10000).toFixed(4)} ha (${encroached.percentage.toFixed(2)}%)`);
            }

            if (partiallyConstructed && partiallyConstructed.area > 0) {
                doc.fillColor('#16a34a') // Green
                    .text(`Partially Constructed: ${(partiallyConstructed.area / 10000).toFixed(4)} ha (${partiallyConstructed.percentage.toFixed(2)}%)`);
            }

            if (vacant && vacant.area > 0) {
                doc.fillColor('#f59e0b') // Yellow
                    .text(`Vacant Area: ${(vacant.area / 10000).toFixed(4)} ha (${vacant.percentage.toFixed(2)}%)`);
            }

            if (fullyConstructed && fullyConstructed.area > 0) {
                doc.fillColor('#3b82f6') // Blue
                    .text(`Fully Constructed: ${(fullyConstructed.area / 10000).toFixed(4)} ha (${fullyConstructed.percentage.toFixed(2)}%)`);
            }

            doc.moveDown(2);
        }

        // Recommended Actions
        doc.fontSize(16)
            .fillColor('#1a1a1a')
            .text('Recommended Actions', { underline: true });

        doc.moveDown(0.5);
        doc.fontSize(11)
            .fillColor('#333');

        const actions = getRecommendedActions(analysisData);
        actions.forEach((action, index) => {
            doc.text(`${index + 1}. ${action}`);
            doc.moveDown(0.3);
        });

        // Footer
        doc.moveDown(3);
        doc.fontSize(9)
            .fillColor('#999')
            .text('This report was generated automatically by GeoCompliance System', { align: 'center' });
        doc.text('For official use by CSIDC only', { align: 'center' });

        // Finalize PDF
        doc.end();

        // Wait for file to be written
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        return {
            filename,
            filepath,
            url: `/api/reports/${filename}`
        };
    } catch (error) {
        console.error('Report generation error:', error);
        throw error;
    }
}

/**
 * Get color based on risk score
 */
function getRiskColor(score) {
    if (score >= 70) return '#dc2626'; // Red - High risk
    if (score >= 40) return '#f59e0b'; // Yellow - Medium risk
    return '#16a34a'; // Green - Low risk
}

/**
 * Get recommended actions based on analysis
 */
function getRecommendedActions(analysisData) {
    const actions = [];

    if (analysisData.finalRiskScore >= 70) {
        actions.push('URGENT: Schedule immediate site inspection');
        actions.push('Issue violation notice to plot owner');
    }

    if (analysisData.boundaryViolationScore > 50) {
        actions.push('Verify boundary markers on ground');
        actions.push('Compare with approved building plan');
    }

    if (analysisData.unauthorizedConstructionScore > 50) {
        actions.push('Check for building permits and approvals');
        actions.push('Assess unauthorized construction for demolition');
    }

    if (analysisData.isVacant) {
        actions.push('Review lease agreement terms');
        actions.push('Send utilization reminder to plot owner');
        actions.push('Consider penalty for non-utilization');
    }

    if (actions.length === 0) {
        actions.push('Continue regular monitoring');
        actions.push('No immediate action required');
    }

    return actions;
}

export default {
    generatePlotReport
};
