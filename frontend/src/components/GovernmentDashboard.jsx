import React, { useState, useEffect } from 'react';
import { plotAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import './Dashboard.css';
import FinanceSection from './DashboardSections/FinanceSection';
import LandUsageSection from './DashboardSections/LandUsageSection';
import DevelopmentSection from './DashboardSections/DevelopmentSection';

import GISComparisonPanel from './GISComparisonPanel';

// Register ChartJS components globally for all sections
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const GovernmentDashboard = ({ onRefresh, lang = 'en', t = (s) => s, darkMode = false }) => {
    const [stats, setStats] = useState(null);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showGISPanel, setShowGISPanel] = useState(false);

    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    useEffect(() => {
        fetchData();
    }, []);

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
                <div style={{display: 'flex', gap: '12px'}}>
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

                {/* Section 5: Re-allotment Recommendations */}
                <div className="animate-fade-in dashboard-section-3" style={{marginTop: '32px'}}>
                   <div className="table-section" style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                        <div className="table-header" style={{background: '#f0fdf4', borderBottom: '1px solid #bbf7d0'}}>
                            <h2 style={{color: '#166534', fontSize: '1.25rem'}}>♻️ {t('reallotment')}</h2>
                            <span className="total-area" style={{color: '#15803d'}}>{t('vacant_lands')}</span>
                        </div>
                        <div className="data-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('plot_no')}</th>
                                        <th>{t('area_size')}</th>
                                        <th>{t('reason_reallotment')}</th>
                                        <th>{t('est_value')}</th>
                                        <th>{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vacantPlots.slice(0, 5).map((plot, index) => (
                                        <tr key={plot._id || index}>
                                            <td style={{fontWeight: 500}}>{plot.plotId}</td>
                                            <td>{plot.approvedArea?.toLocaleString()} sqft</td>
                                            <td>
                                                {plot.status === 'vacant' ? t('hist_vacant') : t('high_violation_risk')}
                                            </td>
                                            <td style={{fontWeight: '600', color: '#1e293b'}}>
                                                ₹{(plot.approvedArea * (plot.marketValuePerSqMeter || 5000)).toLocaleString()}
                                            </td>
                                            <td>
                                                <span style={{
                                                    background: '#166534',
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {t('ready_issue')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {vacantPlots.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{textAlign: 'center', padding: '24px'}}>{t('no_plots_reallotment')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
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

