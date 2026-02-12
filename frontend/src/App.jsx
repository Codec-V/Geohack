import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import PlotUpload from './components/PlotUpload';
import PlotDetails from './components/PlotDetails';
import { plotAPI } from './services/api';
import './App.css';

function App() {
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      setLoading(true);
      const response = await plotAPI.getAll();
      setPlots(response.data.data);
    } catch (error) {
      console.error('Error fetching plots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlotClick = (plot) => {
    setSelectedPlot(plot);
  };

  const handleUploadSuccess = () => {
    fetchPlots();
    setShowUpload(false);
  };

  const handleAnalysisComplete = async () => {
    await fetchPlots();
    if (selectedPlot) {
      const updatedPlot = plots.find(p => p._id === selectedPlot._id);
      setSelectedPlot(updatedPlot);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">🛰️</span>
              <div>
                <h1>GeoCompliance</h1>
                <p className="tagline">Satellite-Powered Land Monitoring</p>
              </div>
            </div>
            <button
              className="btn btn-success"
              onClick={() => setShowUpload(!showUpload)}
            >
              {showUpload ? '✕ Close' : '➕ Upload Plot'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          {/* Upload Section */}
          {showUpload && (
            <div style={{ marginBottom: '2rem' }}>
              <PlotUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`tab ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              🗺️ Map View
            </button>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading GeoCompliance...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard onRefresh={fetchPlots} />
              )}

              {activeTab === 'map' && (
                <div className="map-section">
                  <MapView
                    plots={plots}
                    onPlotClick={handlePlotClick}
                    selectedPlot={selectedPlot}
                  />

                  {plots.length === 0 && (
                    <div className="empty-state">
                      <p>📍 No plots uploaded yet</p>
                      <p className="empty-hint">Upload a plot boundary to get started</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Plots List */}
          {!loading && plots.length > 0 && (
            <div className="plots-list-section">
              <h2>All Plots ({plots.length})</h2>
              <div className="plots-grid">
                {plots.map(plot => {
                  const riskScore = plot.latestAnalysis?.finalRiskScore;
                  const getRiskClass = (score) => {
                    if (!score) return '';
                    if (score >= 70) return 'risk-high';
                    if (score >= 40) return 'risk-medium';
                    return 'risk-low';
                  };

                  return (
                    <div
                      key={plot._id}
                      className={`plot-card ${getRiskClass(riskScore)}`}
                      onClick={() => handlePlotClick(plot)}
                    >
                      <div className="plot-card-header">
                        <h3>{plot.name}</h3>
                        {riskScore !== undefined && (
                          <span className={`risk-badge ${getRiskClass(riskScore)}`}>
                            {riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low'}
                          </span>
                        )}
                      </div>
                      <p className="plot-card-id">ID: {plot.plotId}</p>
                      <div className="plot-card-stats">
                        <div className="stat">
                          <span className="stat-label">Area</span>
                          <span className="stat-value">
                            {(plot.approvedArea / 10000).toFixed(2)} ha
                          </span>
                        </div>
                        {riskScore !== undefined && (
                          <div className="stat">
                            <span className="stat-label">Risk Score</span>
                            <span className="stat-value">{riskScore}/100</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Plot Details Modal */}
      {selectedPlot && (
        <PlotDetails
          plot={selectedPlot}
          onClose={() => setSelectedPlot(null)}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>© 2026 GeoCompliance - Automated Industrial Land Monitoring System</p>
          <p className="footer-hint">Powered by Sentinel-2 Satellite Imagery</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
