import React, { useState, useEffect } from 'react';
import { plotAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import './Dashboard.css';
import FinanceSection from './DashboardSections/FinanceSection';
import LandUsageSection from './DashboardSections/LandUsageSection';
import DevelopmentSection from './DashboardSections/DevelopmentSection';
import ReAllotmentSection from './DashboardSections/ReAllotmentSection';

import GISComparisonPanel from './GISComparisonPanel';

// Register ChartJS components globally for all sections
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const GovernmentDashboard = ({ onRefresh, lang = 'en', t = (s) => s, darkMode = false }) => {
    const [stats, setStats] = useState(null);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showGISPanel, setShowGISPanel] = useState(false);
    
    // New states for location and batch analysis
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('tilda');
    const [batchResults, setBatchResults] = useState(null);
    const [analyzingBatch, setAnalyzingBatch] = useState(false);

    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    useEffect(() => {
        fetchData();
        fetchLocations();
    }, []);

    useEffect(() => {
        handleBatchAnalysis();
    }, [selectedLocation]);

    const fetchLocations = async () => {
        try {
            const res = await plotAPI.getLocations();
            setLocations(res.data.data);
        } catch (err) {
            console.error('Error fetching locations:', err);
        }
    };

    const handleBatchAnalysis = async () => {
        try {
            setAnalyzingBatch(true);
            const res = await plotAPI.analyzeBatchComparison(selectedLocation);
            setBatchResults(res.data.data);
        } catch (err) {
            console.error('Error analyzing batch:', err);
        } finally {
            setAnalyzingBatch(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, plotsRes] = await Promise.all([
                plotAPI.getStats(),
                plotAPI.getAll()
            ]);
            setStats(statsRes.data.data);
            setPlots(plotsRes.data.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotice = (plotId) => {
        // Mock API call for demo
        alert(`🚨 OFFICAL NOTICE DISPATCHED!\n\nNotice generated for Plot #${plotId}.\nType: Violation Warning\nSent to: Plot Owner`);
    };

    if (loading) return (
        <div className="dashboard-loading">
            <div className="spinner"></div>
            <p style={{marginTop: '12px', color: '#64748b'}}>Loading Government Dashboard...</p>
        </div>
    );
    
    if (error) return <div className="dashboard-error">{error}</div>;

    const vacantPlots = plots.filter(p => (p.latestAnalysis?.finalRiskScore || 0) > 50);

    return (
        <div className="dashboard">
            {showGISPanel && <GISComparisonPanel onClose={() => setShowGISPanel(false)} t={t} />}
            
            <header className="dashboard-header" style={{ borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
                <div>
                    <h1>{t('appTitle')}</h1>
                    <p className="subtitle">{t('govt_portal')} • {currentDate}</p>
                </div>
                <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                    {/* Location Selector "Dialog Box" Style */}
                    <div className="location-selector-box" style={{
                        display: 'flex', 
                        flexDirection: 'column',
                        background: darkMode ? '#1e293b' : 'white',
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: `2px solid #6366f1`,
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        minWidth: '200px'
                    }}>
                        <span style={{fontSize: '0.7rem', fontWeight: 'bold', color: '#6366f1', marginBottom: '2px'}}>🛰️ JURISDICTION SELECT</span>
                        {locations.length > 0 ? (
                            <select 
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    color: darkMode ? '#f8fafc' : '#1e293b',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    padding: '0'
                                }}
                            >
                                {locations.map(loc => (
                                    <option key={loc} value={loc} style={{background: darkMode ? '#1e293b' : 'white'}}>{loc.toUpperCase()}</option>
                                ))}
                            </select>
                        ) : (
                            <span style={{fontSize: '0.9rem', color: '#94a3b8'}}>Scanning folders...</span>
                        )}
                    </div>

                     <button className="btn" onClick={() => setShowGISPanel(!showGISPanel)} style={{
                        padding: '8px 16px', 
                        background: showGISPanel ? '#4f46e5' : (darkMode ? '#1e293b' : 'white'), 
                        color: showGISPanel ? 'white' : (darkMode ? '#e2e8f0' : '#475569'), 
                        border: showGISPanel ? 'none' : `1px solid ${darkMode ? '#334155' : '#cbd5e1'}`, 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                    }}>
                        <span>🛰️</span> GIS Sync
                    </button>
                    <button className="btn-print" onClick={() => window.print()} style={{
                        padding: '8px 16px', 
                        background: darkMode ? '#334155' : '#334155', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <span>🖨️</span> {t('print_report')}
                    </button>
                    <div className="logo-badge">🛡️</div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Section 1: Financial Impact */}
                <div className="animate-fade-in dashboard-section-1">
                    <FinanceSection stats={stats} t={t} darkMode={darkMode} />
                </div>

                {/* Section 2: Land Usage Analysis */}
                <div className="animate-fade-in dashboard-section-2">
                    <LandUsageSection plots={plots} stats={stats} t={t} darkMode={darkMode} />
                </div>

                {/* Section 3: Development Growth */}
                <div className="animate-fade-in dashboard-section-3">
                    <DevelopmentSection plots={plots} t={t} darkMode={darkMode} />
                </div>

                {/* Section: Real-time Area Analysis Results */}
                <div className="animate-fade-in dashboard-section-4" style={{marginTop: '32px'}}>
                    <div className="table-section" style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                        <div className="table-header" style={{background: darkMode ? '#111827' : '#f8fafc', borderBottom: `1px solid ${darkMode ? '#374151' : '#e2e8f0'}`}}>
                            <h2 style={{color: darkMode ? '#f9fafb' : '#1e293b', fontSize: '1.25rem'}}>
                                📊 Real-time Jurisdictional Audit - {selectedLocation.toUpperCase()}
                            </h2>
                            {analyzingBatch && <span style={{fontSize: '0.8rem', color: '#6366f1'}}>Recalculating...</span>}
                        </div>
                        <div className="data-table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Area ID</th>
                                        <th>Registered (Ref)</th>
                                        <th>Occupied (Actual)</th>
                                        <th>Overlap (Valid)</th>
                                        <th>Encroachment</th>
                                        <th>Unused Land</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Show Total at the start as requested */}
                                    {batchResults && batchResults.totals ? (
                                        <tr style={{background: darkMode ? '#1f2937' : '#f1f5f9', fontWeight: 'bold', borderBottom: '2px solid #cbd5e1'}}>
                                            <td style={{color: '#6366f1'}}>TOTAL SUMMARY</td>
                                            <td>{(batchResults.totals.totalOverlapArea + batchResults.totals.totalUnusedArea).toFixed(2)} m²</td>
                                            <td>{(batchResults.totals.totalOverlapArea + batchResults.totals.totalEncroachmentArea).toFixed(2)} m²</td>
                                            <td style={{color: '#3b82f6'}}>{batchResults.totals.totalOverlapArea.toFixed(2)} m²</td>
                                            <td style={{color: '#dc2626'}}>{batchResults.totals.totalEncroachmentArea.toFixed(2)} m²</td>
                                            <td style={{color: '#16a34a'}}>{batchResults.totals.totalUnusedArea.toFixed(2)} m²</td>
                                        </tr>
                                    ) : null}
                                    
                                    {/* Detailed Area Comparison */}
                                    {batchResults && batchResults.comparisons && batchResults.comparisons.length > 0 ? (
                                        batchResults.comparisons.map((area, idx) => (
                                            <tr key={idx}>
                                                <td style={{fontWeight: '600'}}>{area.areaName.toUpperCase()}</td>
                                                <td>{area.statistics.totalRegisteredArea.toFixed(2)} m²</td>
                                                <td>{area.statistics.totalOccupiedArea.toFixed(2)} m²</td>
                                                <td style={{color: '#3b82f6'}}>{area.statistics.overlapArea.toFixed(2)} m²</td>
                                                <td style={{color: '#dc2626'}}>{area.statistics.encroachmentArea.toFixed(2)} m²</td>
                                                <td style={{color: '#16a34a'}}>{area.statistics.unusedArea.toFixed(2)} m²</td>
                                            </tr>
                                        ))
                                    ) : (
                                        !batchResults && (
                                            <tr>
                                                <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                                                    {analyzingBatch ? '⌛ Recalculating Area Statistics...' : 'No historical data for this jurisdiction'}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Section 4: Critical Alerts & Action */}
                <div className="animate-fade-in dashboard-section-3" style={{marginTop: '32px'}}>
                       <div className="table-section" style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                        <div className="table-header" style={{background: '#fee2e2', borderBottom: '1px solid #fca5a5'}}>
                            <h2 style={{color: '#991b1b', fontSize: '1.25rem'}}>{t('critical_action')}</h2>
                            <span className="total-area" style={{color: '#b91c1c'}}>{t('send_notice')}</span>
                        </div>
                        <div className="data-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('plot_no')}</th>
                                        <th>{t('industry_name')}</th>
                                        <th>{t('risk_score')}</th>
                                        <th>{t('status')}</th>
                                        <th>{t('action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plots
                                        .filter(p => (p.latestAnalysis?.finalRiskScore || 0) > 70)
                                        .slice(0, 5)
                                        .map((plot, index) => (
                                        <tr key={plot._id || index}>
                                            <td style={{fontWeight: 500}}>{plot.plotId}</td>
                                            <td>{plot.name || 'Unknown'}</td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 'bold', 
                                                    color: (plot.latestAnalysis?.finalRiskScore || 0) > 70 ? '#dc2626' : '#d97706'
                                                }}>
                                                    {plot.latestAnalysis?.finalRiskScore || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="status-badge status-closed">
                                                    {t('critical_risk')}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    onClick={() => handleSendNotice(plot.plotId)}
                                                    style={{
                                                        background: '#dc2626',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <span>📢</span> {t('send_notice')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {plots.filter(p => (p.latestAnalysis?.finalRiskScore || 0) > 70).length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{textAlign: 'center', padding: '24px'}}>{t('no_critical_plots')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="animate-fade-in dashboard-section-4" style={{marginTop: '32px'}}>
                   <ReAllotmentSection plots={plots} t={t} darkMode={darkMode} />
                </div>

            </div>

            <footer className="app-footer" style={{marginTop: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem'}}>
                <div className="container">
                   <p>{t('footer_govt_text')}</p>
                </div>
            </footer>
        </div>
    );
};

export default GovernmentDashboard;

