import React, { useState } from 'react';
import { plotAPI } from '../services/api';
import './PlotDetails.css';

const PlotDetails = ({ plot, onClose, onAnalysisComplete }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [error, setError] = useState(null);

    if (!plot) return null;

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true);
            setError(null);
            await plotAPI.analyze(plot._id);
            onAnalysisComplete?.();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to analyze plot');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleGenerateReport = async () => {
        try {
            setGeneratingReport(true);
            setError(null);
            const response = await plotAPI.getReport(plot._id);
            alert(`Report generated: ${response.data.data.filename}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate report');
        } finally {
            setGeneratingReport(false);
        }
    };

    const getRiskLevel = (score) => {
        if (!score) return { label: 'Not Analyzed', class: 'risk-badge' };
        if (score >= 70) return { label: 'High Risk', class: 'risk-badge risk-high' };
        if (score >= 40) return { label: 'Medium Risk', class: 'risk-badge risk-medium' };
        return { label: 'Low Risk', class: 'risk-badge risk-low' };
    };

    const riskLevel = getRiskLevel(plot.latestAnalysis?.finalRiskScore);

    return (
        <div className="plot-details-overlay" onClick={onClose}>
            <div className="plot-details-panel" onClick={(e) => e.stopPropagation()}>
                <div className="plot-details-header">
                    <div>
                        <h2>{plot.name}</h2>
                        <p className="plot-id">Plot ID: {plot.plotId}</p>
                    </div>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        ❌ {error}
                    </div>
                )}

                <div className="plot-details-content">
                    {/* Basic Information */}
                    <section className="details-section">
                        <h3>Basic Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Allotment Date</span>
                                <span className="info-value">
                                    {new Date(plot.allotmentDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Approved Area</span>
                                <span className="info-value">
                                    {(plot.approvedArea / 10000).toFixed(2)} hectares
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Analysis Results */}
                    {plot.latestAnalysis ? (
                        <>
                            <section className="details-section">
                                <h3>Analysis Results</h3>
                                <div className="risk-score-display">
                                    <div className="risk-score-circle">
                                        <span className="risk-score-value">
                                            {plot.latestAnalysis.finalRiskScore}
                                        </span>
                                        <span className="risk-score-label">Risk Score</span>
                                    </div>
                                    <span className={riskLevel.class}>{riskLevel.label}</span>
                                </div>

                                <div className="scores-grid">
                                    <div className="score-card">
                                        <span className="score-label">Boundary Violation</span>
                                        <div className="score-bar">
                                            <div
                                                className="score-fill"
                                                style={{
                                                    width: `${plot.latestAnalysis.boundaryViolationScore}%`,
                                                    background: plot.latestAnalysis.boundaryViolationScore > 50 ? '#dc2626' : '#16a34a'
                                                }}
                                            ></div>
                                        </div>
                                        <span className="score-value">
                                            {plot.latestAnalysis.boundaryViolationScore}/100
                                        </span>
                                    </div>

                                    <div className="score-card">
                                        <span className="score-label">Unauthorized Construction</span>
                                        <div className="score-bar">
                                            <div
                                                className="score-fill"
                                                style={{
                                                    width: `${plot.latestAnalysis.unauthorizedConstructionScore}%`,
                                                    background: plot.latestAnalysis.unauthorizedConstructionScore > 50 ? '#dc2626' : '#16a34a'
                                                }}
                                            ></div>
                                        </div>
                                        <span className="score-value">
                                            {plot.latestAnalysis.unauthorizedConstructionScore}/100
                                        </span>
                                    </div>

                                    <div className="score-card">
                                        <span className="score-label">Utilization Score</span>
                                        <div className="score-bar">
                                            <div
                                                className="score-fill"
                                                style={{
                                                    width: `${plot.latestAnalysis.utilizationScore}%`,
                                                    background: plot.latestAnalysis.utilizationScore > 50 ? '#f59e0b' : '#16a34a'
                                                }}
                                            ></div>
                                        </div>
                                        <span className="score-value">
                                            {plot.latestAnalysis.utilizationScore}/100
                                        </span>
                                    </div>
                                </div>

                                <div className="info-grid" style={{ marginTop: '1rem' }}>
                                    <div className="info-item">
                                        <span className="info-label">Built-up Area</span>
                                        <span className="info-value">
                                            {(plot.latestAnalysis.builtUpArea / 10000).toFixed(2)} hectares
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Deviation</span>
                                        <span className="info-value">
                                            {plot.latestAnalysis.deviationPercentage.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Status</span>
                                        <span className="info-value">
                                            {plot.latestAnalysis.isVacant ? '🏗️ Vacant' : '✅ Utilized'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Last Analyzed</span>
                                        <span className="info-value">
                                            {new Date(plot.latestAnalysis.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Land Usage Classification */}
                            {plot.latestAnalysis.usageClassification && (
                                <section className="details-section">
                                    <h3>Land Usage Classification</h3>
                                    <div className="usage-grid">
                                        {plot.latestAnalysis.usageClassification.encroached.area > 0 && (
                                            <div className="usage-card">
                                                <div className="usage-header">
                                                    <span className="usage-color" style={{ background: '#dc2626' }}></span>
                                                    <span className="usage-label">Encroached Area</span>
                                                </div>
                                                <div className="usage-stats">
                                                    <span className="usage-area">
                                                        {(plot.latestAnalysis.usageClassification.encroached.area / 10000).toFixed(2)} ha
                                                    </span>
                                                    <span className="usage-percentage">
                                                        {plot.latestAnalysis.usageClassification.encroached.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {plot.latestAnalysis.usageClassification.partiallyConstructed.area > 0 && (
                                            <div className="usage-card">
                                                <div className="usage-header">
                                                    <span className="usage-color" style={{ background: '#16a34a' }}></span>
                                                    <span className="usage-label">Partially Constructed</span>
                                                </div>
                                                <div className="usage-stats">
                                                    <span className="usage-area">
                                                        {(plot.latestAnalysis.usageClassification.partiallyConstructed.area / 10000).toFixed(2)} ha
                                                    </span>
                                                    <span className="usage-percentage">
                                                        {plot.latestAnalysis.usageClassification.partiallyConstructed.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {plot.latestAnalysis.usageClassification.vacant.area > 0 && (
                                            <div className="usage-card">
                                                <div className="usage-header">
                                                    <span className="usage-color" style={{ background: '#f59e0b' }}></span>
                                                    <span className="usage-label">Vacant Area</span>
                                                </div>
                                                <div className="usage-stats">
                                                    <span className="usage-area">
                                                        {(plot.latestAnalysis.usageClassification.vacant.area / 10000).toFixed(2)} ha
                                                    </span>
                                                    <span className="usage-percentage">
                                                        {plot.latestAnalysis.usageClassification.vacant.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {plot.latestAnalysis.usageClassification.fullyConstructed.area > 0 && (
                                            <div className="usage-card">
                                                <div className="usage-header">
                                                    <span className="usage-color" style={{ background: '#3b82f6' }}></span>
                                                    <span className="usage-label">Fully Constructed</span>
                                                </div>
                                                <div className="usage-stats">
                                                    <span className="usage-area">
                                                        {(plot.latestAnalysis.usageClassification.fullyConstructed.area / 10000).toFixed(2)} ha
                                                    </span>
                                                    <span className="usage-percentage">
                                                        {plot.latestAnalysis.usageClassification.fullyConstructed.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        <section className="details-section">
                            <div className="no-analysis">
                                <p>📊 No analysis available for this plot</p>
                                <p className="no-analysis-hint">Click "Run Analysis" to start automated monitoring</p>
                            </div>
                        </section>
                    )}

                    {/* Overlap Analysis (Visible only for custom drawn areas) */}
                    {plot.latestAnalysis?.overlapAnalysis && (
                        <section className="details-section">
                            <h3>Overlap With Vacant Land</h3>
                            <div className="info-grid">
                                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="info-label">Detected Overlap with Vacant/High-Risk Plots</span>
                                    <div className="progress-bar-container" style={{ height: '24px', background: '#e2e8f0', borderRadius: '12px', marginTop: '8px', overflow: 'hidden' }}>
                                        <div 
                                            className="progress-fill" 
                                            style={{ 
                                                width: `${plot.latestAnalysis.overlapAnalysis.overlapPercentage}%`, 
                                                background: '#f59e0b',
                                                height: '100%',
                                                transition: 'width 0.5s ease-out'
                                            }}
                                        ></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.9rem' }}>
                                        <span>{(plot.latestAnalysis.overlapAnalysis.totalOverlappingVaantArea / 10000).toFixed(2)} hectares</span>
                                        <strong>{plot.latestAnalysis.overlapAnalysis.overlapPercentage.toFixed(1)}% Overlap</strong>
                                    </div>
                                </div>
                                
                                {plot.latestAnalysis.overlapAnalysis.overlappingPlots?.length > 0 && (
                                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                                        <span className="info-label">Affected Plots</span>
                                        <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '0.9rem', color: '#4b5563' }}>
                                            {plot.latestAnalysis.overlapAnalysis.overlappingPlots.map(p => (
                                                <li key={p.id}>
                                                    {p.name} ({p.plotId}) - {(p.overlapArea / 10000).toFixed(2)} ha
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Actions */}
                    <section className="details-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleAnalyze}
                            disabled={analyzing}
                        >
                            {analyzing ? '⏳ Analyzing...' : '🔍 Run Analysis'}
                        </button>

                        {plot.latestAnalysis && (
                            <button
                                className="btn btn-success"
                                onClick={handleGenerateReport}
                                disabled={generatingReport}
                            >
                                {generatingReport ? '⏳ Generating...' : '📄 Generate Report'}
                            </button>
                        )}

                        <div className="plot-details-danger-zone">
                            <button
                                className="btn btn-danger btn-full"
                                onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this plot?')) {
                                        try {
                                            await plotAPI.delete(plot._id);
                                            onClose();
                                            onAnalysisComplete();
                                        } catch (error) {
                                            alert('Failed to delete plot');
                                        }
                                    }
                                }}
                            >
                                🗑️ Delete Plot
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div >
    );
};
export default PlotDetails;
