import React, { useState, useEffect } from 'react';
import { plotAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

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
    
    // Chart Data
    const chartData = {
        labels: ['Running', 'Closed'],
        datasets: [
            {
                data: [runningPlots, closedPlots],
                backgroundColor: ['#a5b4fc', '#6366f1'], // Light blue, Primary Blue
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'right',
                labels: { usePointStyle: true, boxWidth: 8 }
            }
        },
        cutout: '60%',
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
                    <h1>Site Visit on {currentDate}</h1>
                </div>
                <div className="logo-badge">🛡️</div>
            </header>

            <div className="dashboard-top-grid">
                {/* 1. Key Insights */}
                <div className="dashboard-card">
                    <h3>Key Insights</h3>
                    <ul className="insights-list">
                        <li>
                            Running plots constitute approximately {Math.round((runningPlots / totalPlots) * 100)}% of the total, highlighting active utilization.
                        </li>
                        <li>
                            Closed plots make up only about {Math.round((closedPlots / totalPlots) * 100)}%, suggesting high occupancy rates.
                        </li>
                        <li>
                            {stats?.highRiskPlots || 0} plots identified as high risk requiring immediate attention.
                        </li>
                    </ul>
                </div>

                {/* 2. Distribution Pie Chart */}
                <div className="dashboard-card">
                    <h3>Distribution of Plot Status</h3>
                    <div className="chart-container">
                        <Doughnut data={chartData} options={chartOptions} />
                    </div>
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

                {/* 4. Map Placeholder */}
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

