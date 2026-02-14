import React, { useState, useEffect } from 'react';
import { plotAPI } from '../services/api';
import { Line } from 'react-chartjs-2';
import Skeleton from './common/Skeleton';
import './PlotDetails.css';

const PlotDetails = ({ plot, onClose, onAnalysisComplete, lang = 'en', t = (s) => s }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [error, setError] = useState(null);
    const [sliderValue, setSliderValue] = useState(50);
    const [isLoading, setIsLoading] = useState(true);
    const [showBlockchainModal, setShowBlockchainModal] = useState(false);

    // Simulate initial load for Skeleton demonstration
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, [plot?._id]);

    if (!plot) return null;

    if (isLoading) {
        return (
            <div className="plot-details-overlay" onClick={onClose}>
                <div className="plot-details-panel glass" onClick={(e) => e.stopPropagation()}>
                    <div className="plot-details-header glass" style={{ borderBottom: 'none' }}>
                        <div style={{ width: '100%' }}>
                            <Skeleton width="40%" height="32px" borderRadius="8px" className="mb-2" />
                            <Skeleton width="20%" height="16px" />
                        </div>
                    </div>
                    <div className="plot-details-content">
                        <Skeleton height="150px" borderRadius="12px" className="mb-4" />
                        <Skeleton height="100px" borderRadius="12px" className="mb-4" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <Skeleton height="80px" borderRadius="12px" />
                            <Skeleton height="80px" borderRadius="12px" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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


    // Simulated Blockchain Data
    const blockchainData = {
        contractAddress: "0x71C...9A23",
        tokenId: plot.plotId.replace(/\D/g, '').substring(0, 6) || "102938",
        transactions: [
            { id: 1, type: "Minting", date: "2023-01-15", hash: "0x8f...3a1b", status: "Confirmed" },
            { id: 2, type: "Verification", date: "2024-06-20", hash: "0x2c...9d4e", status: "Verified" },
            { id: 3, type: "Audit", date: "2025-12-05", hash: "0x5b...1f8a", status: "Verified" }
        ]
    };

    return (
        <div className="plot-details-overlay" onClick={onClose}>
            <div className="plot-details-panel glass" onClick={(e) => e.stopPropagation()}>
                <div className="plot-details-header glass">
                    <div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <h2>{plot.name}</h2>
                            <span 
                                onClick={() => setShowBlockchainModal(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    boxShadow: '0 2px 5px rgba(79, 70, 229, 0.3)'
                                }}
                                title="Click to view Blockchain History"
                            >
                                🛡️ Verified on Chain
                            </span>
                        </div>
                        <p className="plot-id">{t('plot_no')}: {plot.plotId}</p>
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
                        <h3>{t('basic_info')}</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">{t('allotment_date')}</span>
                                <span className="info-value">
                                    {new Date(plot.allotmentDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">{t('approved_area')}</span>
                                <span className="info-value">
                                    {(plot.approvedArea / 10000).toFixed(2)} {t('hectares')}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Analysis Results */}
                    {plot.latestAnalysis ? (
                        <>
                            <section className="details-section">
                                <h3>{t('analysis_results')}</h3>
                                <div className="risk-score-display">
                                    <div className="risk-score-circle">
                                        <span className="risk-score-value">
                                            {plot.latestAnalysis.finalRiskScore}
                                        </span>
                                        <span className="risk-score-label">{t('risk_score')}</span>
                                    </div>
                                    <span className={riskLevel.class}>{riskLevel.label}</span>
                                </div>

                                <div className="scores-grid">
                                    <div className="score-card">
                                        <span className="score-label">{t('boundary_violation')}</span>
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
                                        <span className="score-label">{t('unauth_construction')}</span>
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
                                        <span className="score-label">{t('utilization_score')}</span>
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
                                        <span className="info-label">{t('built_up_area')}</span>
                                        <span className="info-value">
                                            {(plot.latestAnalysis.builtUpArea / 10000).toFixed(2)} {t('hectares')}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">{t('deviation')}</span>
                                        <span className="info-value">
                                            {plot.latestAnalysis.deviationPercentage.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">{t('status')}</span>
                                        <span className="info-value">
                                            {plot.latestAnalysis.isVacant ? `🏗️ ${t('vacant')}` : `✅ ${t('utilized')}`}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">{t('last_analyzed')}</span>
                                        <span className="info-value">
                                            {new Date(plot.latestAnalysis.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Land Usage Classification */}
                            {plot.latestAnalysis.usageClassification && (
                                <section className="details-section">
                                    <h3>{t('land_usage_class')}</h3>
                                    <div className="usage-grid">
                                        {plot.latestAnalysis.usageClassification.encroached.area > 0 && (
                                            <div className="usage-card">
                                                <div className="usage-header">
                                                    <span className="usage-color" style={{ background: '#dc2626' }}></span>
                                                    <span className="usage-label">{t('encroached_area')}</span>
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
                                                    <span className="usage-label">{t('partially_constructed')}</span>
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
                                                    <span className="usage-label">{t('vacant_area')}</span>
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
                                                    <span className="usage-label">{t('fully_constructed')}</span>
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
                                <p>{t('no_analysis')}</p>
                                <p className="no-analysis-hint">{t('run_analysis_hint')}</p>
                            </div>
                        </section>
                    )}

                    {/* AI Risk Forecasting */}
                    {plot.latestAnalysis && (
                        <section className="details-section">
                            <h3>🔮 {t('ai_forecasting')}</h3>
                            <div style={{height: '200px', marginTop: '16px'}}>
                                <Line 
                                    data={{
                                        labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar (Proj)', 'Apr (Proj)'],
                                        datasets: [{
                                            label: t('risk_score_trend'),
                                            data: [
                                                Math.max(0, (plot.latestAnalysis.finalRiskScore || 0) - (Math.random() * 20)),
                                                Math.max(0, (plot.latestAnalysis.finalRiskScore || 0) - (Math.random() * 10)),
                                                Math.max(0, (plot.latestAnalysis.finalRiskScore || 0) - 5),
                                                plot.latestAnalysis.finalRiskScore,
                                                Math.min(100, (plot.latestAnalysis.finalRiskScore || 0) + 5),
                                                Math.min(100, (plot.latestAnalysis.finalRiskScore || 0) + 12),
                                                Math.min(100, (plot.latestAnalysis.finalRiskScore || 0) + 20)
                                            ],
                                            borderColor: (plot.latestAnalysis.finalRiskScore || 0) > 50 ? '#dc2626' : '#16a34a',
                                            tension: 0.4,
                                            fill: true,
                                            backgroundColor: (plot.latestAnalysis.finalRiskScore || 0) > 50 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.1)'
                                        }]
                                    }} 
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: { y: { beginAtZero: true, max: 100 } }
                                    }} 
                                />
                            </div>
                            <p style={{fontSize: '0.9rem', color: '#64748b', marginTop: '12px'}}>
                                {t('ai_prediction_label')} {t('ai_prediction_desc')} <strong style={{color: (plot.latestAnalysis.finalRiskScore || 0) > 50 ? '#dc2626' : '#16a34a'}}>{(plot.latestAnalysis.finalRiskScore || 0) > 50 ? t('increase') : t('stabilize')}</strong> {t('prediction_context')}
                            </p>
                        </section>
                    )}

                    {/* Satellite Time-Travel */}
                    <section className="details-section">
                        <h3>🛰️ {t('sat_timetravel')}</h3>
                        <p style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '12px'}}>{t('compare_dates_hint')}</p>
                        
                        <div className="time-travel-container" style={{
                            position: 'relative', 
                            height: '220px', 
                            borderRadius: '12px', 
                            overflow: 'hidden', 
                            border: '1px solid #e2e8f0',
                            userSelect: 'none'
                        }}>
                            {/* Layer 2: 2024 (Background/Past) */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                background: 'linear-gradient(45deg, #fce7f3 25%, #fbcfe8 25%, #fbcfe8 50%, #fce7f3 50%, #fce7f3 75%, #fbcfe8 75%, #fbcfe8 100%)',
                                backgroundSize: '40px 40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{background: 'rgba(255,255,255,0.8)', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', color: '#be185d'}}>
                                    {t('past_state')}
                                </div>
                            </div>

                            {/* Layer 1: 2026 (Foreground/Current) - Clipped */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, 
                                width: `${sliderValue}%`, 
                                height: '100%', 
                                background: 'linear-gradient(45deg, #dcfce7 25%, #bbf7d0 25%, #bbf7d0 50%, #dcfce7 50%, #dcfce7 75%, #bbf7d0 75%, #bbf7d0 100%)',
                                backgroundSize: '40px 40px',
                                overflow: 'hidden', 
                                borderRight: '4px solid white',
                                boxShadow: '2px 0 10px rgba(0,0,0,0.2)'
                            }}>
                                <div style={{
                                    width: '100vw', maxWidth: '560px', height: '100%', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{background: 'rgba(255,255,255,0.8)', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', color: '#15803d'}}>
                                        {t('current_state')}
                                    </div>
                                </div>
                            </div>

                            {/* Slider Control */}
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={sliderValue} 
                                onChange={(e) => setSliderValue(e.target.value)}
                                style={{
                                    position: 'absolute', 
                                    bottom: '10px', 
                                    left: '50%', 
                                    transform: 'translateX(-50%)',
                                    width: '80%', 
                                    zIndex: 10,
                                    cursor: 'ew-resize'
                                }}
                            />
                        </div>
                    </section>

                    {/* Overlap Analysis (Visible only for custom drawn areas) */}
                    {plot.latestAnalysis?.overlapAnalysis && (
                        <section className="details-section">
                            <h3>{t('overlap_vacant')}</h3>
                            <div className="info-grid">
                                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="info-label">{t('detected_overlap')}</span>
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
                                        <span className="info-label">{t('affected_plots')}</span>
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
                            {analyzing ? '⏳ ' + t('analyzing') : '🔍 ' + t('run_analysis')}
                        </button>

                        {plot.latestAnalysis && (
                            <button
                                className="btn btn-success"
                                onClick={handleGenerateReport}
                                disabled={generatingReport}
                            >
                                {generatingReport ? '⏳ ' + t('generating') : '📄 ' + t('gen_report')}
                            </button>
                        )}

                        <div className="plot-details-danger-zone">
                            <button
                                className="btn btn-danger btn-full"
                                onClick={async () => {
                                    if (window.confirm(t('confirm_delete'))) {
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
                                {t('delete_plot')}
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* Blockchain History Modal */}
            {showBlockchainModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowBlockchainModal(false)}>
                    <div style={{
                        background: 'white', padding: '0', borderRadius: '16px',
                        width: '500px', maxWidth: '90%', overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                    }} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                            padding: '24px', color: 'white'
                        }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                                <h2 style={{margin: 0, fontSize: '1.5rem'}}>🔗 Immutable Ledger</h2>
                                <button onClick={() => setShowBlockchainModal(false)} style={{background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer'}}>✕</button>
                            </div>
                            <div style={{fontSize: '0.9rem', opacity: 0.9}}>Contract: {blockchainData.contractAddress}</div>
                            <div style={{fontSize: '0.9rem', opacity: 0.9}}>Token ID: #{blockchainData.tokenId}</div>
                        </div>

                        {/* Timeline */}
                        <div style={{padding: '24px', maxHeight: '400px', overflowY: 'auto'}}>
                            <div style={{position: 'relative', borderLeft: '2px solid #e5e7eb', marginLeft: '12px', paddingLeft: '24px'}}>
                                {blockchainData.transactions.map((tx, i) => (
                                    <div key={tx.id} style={{marginBottom: '24px', position: 'relative'}}>
                                        <div style={{
                                            position: 'absolute', left: '-31px', top: '0',
                                            width: '16px', height: '16px', borderRadius: '50%',
                                            background: i === 0 ? '#10b981' : '#4f46e5',
                                            border: '4px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}></div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                                            <h4 style={{margin: 0, fontSize: '1rem', color: '#1f2937'}}>{tx.type}</h4>
                                            <span style={{fontSize: '0.8rem', color: '#6b7280'}}>{tx.date}</span>
                                        </div>
                                        <div style={{fontSize: '0.85rem', color: '#4b5563', fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', display: 'inline-block'}}>
                                            Hash: {tx.hash}
                                        </div>
                                        <div style={{marginTop: '4px'}}>
                                            <span style={{
                                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                background: '#dcfce7', color: '#15803d', fontWeight: '600'
                                            }}>
                                                ✓ {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{textAlign: 'center', marginTop: '16px', color: '#6b7280', fontSize: '0.85rem'}}>
                                🔒 All records are cryptographically secured on CSIDC-Chain
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
export default PlotDetails;

