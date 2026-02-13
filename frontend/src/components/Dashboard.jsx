import React, { useState, useEffect } from 'react';
import { plotAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Dashboard = ({ onRefresh }) => {
    const [stats, setStats] = useState(null);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;
    if (error) return <div className="dashboard-error">{error}</div>;

    // Derived Data
    const totalPlots = stats?.totalPlots || 0;
    const closedPlots = stats?.vacantPlots || 0; // Assuming vacant = closed for now
    const runningPlots = totalPlots - closedPlots;
    
    // Risk Analysis Data
    const highRiskPlots = plots.filter(p => (p.latestAnalysis?.finalRiskScore || 0) >= 70).length;
    const mediumRiskPlots = plots.filter(p => {
        const score = p.latestAnalysis?.finalRiskScore || 0;
        return score >= 40 && score < 70;
    }).length;
    const lowRiskPlots = plots.filter(p => (p.latestAnalysis?.finalRiskScore || 0) < 40).length;

    // Chart Data
    const chartData = {
        labels: ['Running (Compliant)', 'Closed / Vacant'],
        datasets: [
            {
                data: [runningPlots, closedPlots],
                backgroundColor: ['#22c55e', '#ef4444'], // Green, Red
                borderWidth: 0,
            },
        ],
    };

    const riskChartData = {
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [
            {
                label: 'Number of Plots',
                data: [lowRiskPlots, mediumRiskPlots, highRiskPlots],
                backgroundColor: ['#22c55e', '#f59e0b', '#dc2626'],
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'right',
                labels: { usePointStyle: true, boxWidth: 8 }
            }
        },
        cutout: '70%',
        maintainAspectRatio: false
    };

    const barOptions = {
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: { beginAtZero: true, grid: { display: false } },
            x: { grid: { display: false } }
        },
        maintainAspectRatio: false
    };

    // Sort plots by area (largest first) and take top 5
    const largestPlots = [...plots]
        .sort((a, b) => (b.approvedArea || 0) - (a.approvedArea || 0))
        .slice(0, 5);

    const totalArea = plots.reduce((acc, curr) => acc + (curr.approvedArea || 0), 0);

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>CSIDC Land Monitoring Dashboard</h1>
                    <p className="subtitle">Official Site Visit Report • {currentDate}</p>
                </div>
                <div style={{display: 'flex', gap: '12px'}}>
                    <button className="btn-print" onClick={() => window.print()} style={{
                        padding: '8px 16px', 
                        background: '#334155', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>🖨️</span> Print Report
                    </button>
                    <div className="logo-badge">🛡️</div>
                </div>
            </header>



                {/* 1. Key Insights */}
                <div className="dashboard-card">
                    <h3>Executive Summary & Insights</h3>
                    <ul className="insights-list">
                        <li>
                            <strong>Utilization Rate:</strong> {Math.round((runningPlots / (totalPlots || 1)) * 100)}% of allocated plots are currently operational.
                        </li>
                        <li>
                            <strong>Vacancy Alert:</strong> {closedPlots} plots are currently closed or vacant, representing immediate opportunity for reallocation.
                        </li>
                        <li>
                            <strong>Critical Risk:</strong> {highRiskPlots} plots have been flagged with High Violation Scores (Risk &gt; 70).
                        </li>
                        <li>
                            <strong>Fiscal Impact:</strong> Estimated daily revenue loss of ₹{Math.round(stats?.financialStats?.totalDailyLoss || 0).toLocaleString()} due to non-operational land assets.
                        </li>
                    </ul>
                </div>

                {/* 3. KPI Cards */}
                <div className="kpi-column">
                    <div className="kpi-card total-plots">
                        <div className="kpi-icon">🏭</div>
                        <span className="kpi-value">{totalPlots}</span>
                        <span className="kpi-label">Total Plots</span>
                    </div>
                    <div className="kpi-card running-plots">
                        <div className="kpi-icon">⚡</div>
                        <span className="kpi-value">{runningPlots}</span>
                        <span className="kpi-label">Running</span>
                    </div>
                    <div className="kpi-card closed-plots">
                        <div className="kpi-icon">🚫</div>
                        <span className="kpi-value">{closedPlots}</span>
                        <span className="kpi-label">Closed</span>
                    </div>
                </div>

                {/* 2. Charts & Financial Grid */}
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px'}}>
                    
                    {/* Compliance Charts */}
                    <div className="dashboard-card" style={{marginBottom: 0}}>
                        <h3>Compliance Overview</h3>
                        <div style={{display: 'flex', height: '100%', gap: '16px'}}>
                            <div className="chart-container" style={{flex: 1}}>
                                <Doughnut data={chartData} options={chartOptions} />
                                <div style={{textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#64748b'}}>Operational Status</div>
                            </div>
                            <div className="chart-container" style={{flex: 1}}>
                                <Bar data={riskChartData} options={barOptions} />
                                <div style={{textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#64748b'}}>Risk Distribution</div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Impact Analysis */}
                    <div className="dashboard-card" style={{marginBottom: 0}}>
                         <h3>Financial Impact Analysis</h3>
                         <div className="financial-stats">
                            <div className="fin-stat-row">
                                <span className="fin-label">Unused / Encroached Area</span>
                                <span className="fin-value">
                                    {Math.round((stats?.financialStats?.totalUnusedLandArea || 0) / 10.764).toLocaleString()} sq m
                                </span>
                            </div>
                            <div className="fin-stat-row">
                                <span className="fin-label">Daily Opportunity Cost</span>
                                <span className="fin-value loss">
                                    ₹{Math.round(stats?.financialStats?.totalDailyLoss || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="fin-note">
                                *Estimated revenue loss based on current market value and potential lease yield of stagnant assets.
                            </div>
                         </div>
                    </div>
                </div>

                {/* 3. KPI Cards Row */}
                <div className="dashboard-card" style={{marginBottom: '24px', display: 'flex', justifyContent: 'space-around', gap: '20px'}}>
                    <div className="kpi-card total-plots" style={{flex: 1, border: 'none', background: '#f8fafc'}}>
                        <div className="kpi-icon">🏭</div>
                        <span className="kpi-value">{totalPlots}</span>
                        <span className="kpi-label">Total Plots</span>
                    </div>
                    <div className="kpi-card running-plots" style={{flex: 1, border: 'none', background: '#f8fafc'}}>
                        <div className="kpi-icon">⚡</div>
                        <span className="kpi-value">{runningPlots}</span>
                        <span className="kpi-label">Running</span>
                    </div>
                    <div className="kpi-card closed-plots" style={{flex: 1, border: 'none', background: '#f8fafc'}}>
                        <div className="kpi-icon">🚫</div>
                        <span className="kpi-value">{closedPlots}</span>
                        <span className="kpi-label">Closed</span>
                    </div>
                </div>

                {/* 5. Map Placeholder */}
                <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="map-preview">
                       {/* Placeholder for map image or mini-map component */}
                       <div style={{
                           width: '100%', 
                           height: '100%', 
                           background: '#e0e7ff', 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center',
                           flexDirection: 'column'
                       }}>
                           <span style={{fontSize: '40px'}}>🗺️</span>
                           <span style={{color: '#6366f1', fontWeight: 'bold'}}>Area Map</span>
                       </div>
                    </div>
                </div>


            {/* NEW: Land Use Comparison Section */}
            <div className="comparison-section" style={{marginTop: '24px', marginBottom: '24px'}}>
                <div className="dashboard-card">
                    <h3>Land Use Efficiency Report: Allocation vs. Utilization</h3>
                    <div className="comparison-bar-container">
                        <div className="comparison-row">
                             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                                <span className="comp-label">Total Allocated Area (CSIDC Record)</span>
                                <span className="comp-value-text">{totalArea.toLocaleString()} sq ft</span>
                             </div>
                             <div className="comp-bar-wrapper">
                                 <div className="comp-bar approved" style={{width: '100%'}}></div>
                             </div>
                        </div>
                        <div className="comparison-row">
                             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                                <span className="comp-label">Effective Utilized Area</span>
                                <span className="comp-value-text">{(totalArea - (stats?.financialStats?.totalUnusedLandArea * 10.764 || 0)).toLocaleString(undefined, {maximumFractionDigits: 0})} sq ft</span>
                             </div>
                             <div className="comp-bar-wrapper">
                                 <div className="comp-bar utilized" style={{width: `${(totalArea > 0 && stats?.analyzedPlots > 0 ? ((totalArea - (stats?.financialStats?.totalUnusedLandArea * 10.764 || 0)) / totalArea) * 100 : 0)}%`}}></div>
                             </div>
                        </div>
                        <div className="comparison-row">
                             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                                <span className="comp-label">Disputed / Unused Area</span>
                                <span className="comp-value-text">{(stats?.financialStats?.totalUnusedLandArea * 10.764 || 0).toLocaleString(undefined, {maximumFractionDigits: 0})} sq ft</span>
                             </div>
                             <div className="comp-bar-wrapper">
                                 <div className="comp-bar unused" style={{width: `${(totalArea > 0 && stats?.analyzedPlots > 0 ? ((stats?.financialStats?.totalUnusedLandArea * 10.764 || 0) / totalArea) * 100 : 0)}%`}}></div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>



            {/* 5. Largest Plots Table */}
            <div className="table-section">
                <div className="table-header">
                    <h2>Largest Plots</h2>
                    <span className="total-area">Total Area – {totalArea.toLocaleString()} sqft</span>
                </div>
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Industry Name</th>
                                <th>Plot ID</th>
                                <th>Area (Sq Ft)</th>
                                <th>Status</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {largestPlots.map((plot, index) => (
                                <tr key={plot._id || index}>
                                    <td>
                                        <div style={{fontWeight: 600}}>{plot.name || 'Unknown Industry'}</div>
                                    </td>
                                    <td style={{color: '#6b7280'}}>
                                        {plot.plotId}
                                    </td>
                                    <td>
                                        {plot.approvedArea?.toLocaleString() || '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${plot.status === 'vacant' ? 'status-closed' : 'status-running'}`}>
                                            {plot.status === 'vacant' ? 'Closed' : 'Running'}
                                        </span>
                                    </td>
                                    <td>
                                        {plot.latestAnalysis?.finalRiskScore > 50 ? 
                                            <span style={{color: '#dc2626', fontWeight: 500}}>REQUIRES REVIEW</span> : 
                                            <span style={{color: '#16a34a'}}>Normal</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                            {largestPlots.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{textAlign: 'center', padding: '24px'}}>No plots found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. Closed / Critical Review Section */}
            <div className="table-section" style={{marginTop: '32px'}}>
                <div className="table-header" style={{background: '#fee2e2', borderBottom: '1px solid #fca5a5'}}>
                    <h2 style={{color: '#991b1b'}}>Key Outcome: Closed / Critical Industries</h2>
                    <span className="total-area" style={{color: '#b91c1c'}}>Action Required</span>
                </div>
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Plot No.</th>
                                <th>Industry Name</th>
                                <th>Risk Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plots
                                .filter(p => p.status === 'vacant' || (p.latestAnalysis?.finalRiskScore || 0) > 70)
                                .slice(0, 8) // Show top 8 critical ones
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
                                            {plot.status === 'vacant' ? 'Closed' : 'Critical Risk'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {plots.filter(p => p.status === 'vacant' || (p.latestAnalysis?.finalRiskScore || 0) > 70).length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{textAlign: 'center', padding: '24px'}}>No critical plots found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;

