import React, { useState, useEffect } from 'react';
import { plotAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = ({ onRefresh }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await plotAPI.getStats();
            setStats(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <p>{error}</p>
                <button onClick={fetchStats} className="btn btn-primary">Retry</button>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>GeoCompliance Dashboard</h1>
                    <p className="subtitle">Automated Industrial Land Monitoring System</p>
                </div>
                <button onClick={() => { fetchStats(); onRefresh?.(); }} className="btn btn-primary">
                    🔄 Refresh
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dbeafe' }}>
                        📍
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.totalPlots || 0}</h3>
                        <p>Total Plots</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fee2e2' }}>
                        ⚠️
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.highRiskPlots || 0}</h3>
                        <p>High Risk Plots</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef3c7' }}>
                        ⚡
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.violationsCount || 0}</h3>
                        <p>Violations Detected</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e0e7ff' }}>
                        📊
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.analyzedPlots || 0}</h3>
                        <p>Analyzed Plots</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fce7f3' }}>
                        🏗️
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.vacantPlots || 0}</h3>
                        <p>Vacant Plots</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7' }}>
                        ✅
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.lowRiskPlots || 0}</h3>
                        <p>Compliant Plots</p>
                    </div>
                </div>
            </div>

            <div className="risk-distribution">
                <h2>Risk Distribution</h2>
                <div className="risk-bars">
                    <div className="risk-bar-item">
                        <div className="risk-bar-label">
                            <span>Low Risk</span>
                            <span className="risk-count">{stats?.lowRiskPlots || 0}</span>
                        </div>
                        <div className="risk-bar-track">
                            <div
                                className="risk-bar-fill risk-low"
                                style={{
                                    width: stats?.analyzedPlots > 0
                                        ? `${(stats.lowRiskPlots / stats.analyzedPlots) * 100}%`
                                        : '0%'
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="risk-bar-item">
                        <div className="risk-bar-label">
                            <span>Medium Risk</span>
                            <span className="risk-count">{stats?.mediumRiskPlots || 0}</span>
                        </div>
                        <div className="risk-bar-track">
                            <div
                                className="risk-bar-fill risk-medium"
                                style={{
                                    width: stats?.analyzedPlots > 0
                                        ? `${(stats.mediumRiskPlots / stats.analyzedPlots) * 100}%`
                                        : '0%'
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="risk-bar-item">
                        <div className="risk-bar-label">
                            <span>High Risk</span>
                            <span className="risk-count">{stats?.highRiskPlots || 0}</span>
                        </div>
                        <div className="risk-bar-track">
                            <div
                                className="risk-bar-fill risk-high"
                                style={{
                                    width: stats?.analyzedPlots > 0
                                        ? `${(stats.highRiskPlots / stats.analyzedPlots) * 100}%`
                                        : '0%'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
