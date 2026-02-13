import React, { useState, useEffect } from 'react';
import GovernmentDashboard from './components/GovernmentDashboard';
import PublicDashboard from './components/PublicDashboard';
import MapView from './components/MapView';
import PlotUpload from './components/PlotUpload';
import PlotDetails from './components/PlotDetails';
import { plotAPI } from './services/api';
import { translations } from './utils/translations';
import './App.css';

const DataIsland = () => {
    const [stats, setStats] = useState({ systems: 'Online', alerts: 0, drones: 2 });

    return (
        <div className="data-island hidden md:flex" style={{
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, background: '#0f172a', padding: '8px 24px', borderRadius: '50px',
            color: 'white', alignItems: 'center', gap: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            border: '1px solid #334155'
        }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e'}}></div>
                <span style={{fontSize: '0.85rem', fontWeight: '600'}}>Systems Normal</span>
            </div>
            <div style={{width: '1px', height: '16px', background: '#334155'}}></div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '1rem'}}>🚁</span>
                <span style={{fontSize: '0.85rem', fontWeight: '600'}}>2 Active</span>
            </div>
            <div style={{width: '1px', height: '16px', background: '#334155'}}></div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '1rem'}}>🛡️</span>
                <span style={{fontSize: '0.85rem', fontWeight: '600'}}>Secured</span>
            </div>
        </div>
    );
};

function App() {
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('govt'); // 'govt' or 'public'
  const [lang, setLang] = useState('en'); // 'en' or 'hi'
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle theme handler
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  };

  const t = (key) => translations[lang][key] || key;

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

  const handleAnalysisComplete = async () => {
    await fetchPlots();
    if (selectedPlot) {
      const updatedPlot = plots.find(p => p._id === selectedPlot._id);
      setSelectedPlot(updatedPlot);
    }
  };

   const handleUploadSuccess = () => {
    fetchPlots();
    setShowUpload(false);
  };


  const handleDeletePlot = async (e, plotId) => {
    e.stopPropagation();
    if (window.confirm(t('delete_confirm'))) {
      try {
        await plotAPI.delete(plotId);
        await fetchPlots();
        if (selectedPlot?._id === plotId) {
          setSelectedPlot(null);
        }
      } catch (error) {
        console.error('Error deleting plot:', error);
        alert('Failed to delete plot');
      }
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">
                {userRole === 'govt' ? '🛰️' : '🏙️'}
              </span>
              <div>
                <h1>{t(userRole === 'govt' ? 'appTitle' : 'appTitle')}</h1>
                <p className="tagline">
                    {t(userRole === 'govt' ? 'govt_tagline' : 'public_tagline')}
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    style={{
                        padding: '6px 10px',
                        border: '1px solid #cbd5e1',
                        background: darkMode ? '#1e293b' : 'white',
                        color: darkMode ? '#fbbf24' : '#64748b',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {darkMode ? '☀️' : '🌒'}
                </button>
                {/* Language Toggle */}
                <button
                    onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                    style={{
                        padding: '6px 12px',
                        border: '1px solid #cbd5e1',
                        background: 'white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    {t('toggle_lang')}
                </button>

                {/* Role Switcher */}
                <div className="role-switcher" style={{background: '#f1f5f9', padding: '4px', borderRadius: '8px', display: 'flex'}}>
                    <button 
                        onClick={() => setUserRole('govt')}
                        style={{
                            padding: '6px 12px',
                            border: 'none',
                            background: userRole === 'govt' ? '#334155' : 'transparent',
                            color: userRole === 'govt' ? 'white' : '#64748b',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.9rem'
                        }}
                    >
                        {t('switchRole_govt')}
                    </button>
                    <button 
                         onClick={() => setUserRole('public')}
                         style={{
                            padding: '6px 12px',
                            border: 'none',
                            background: userRole === 'public' ? '#3b82f6' : 'transparent',
                            color: userRole === 'public' ? 'white' : '#64748b',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.9rem'
                        }}
                    >
                        {t('switchRole_public')}
                    </button>
                </div>

                {userRole === 'govt' && (
                    <button
                    className="btn btn-success"
                    onClick={() => setShowUpload(!showUpload)}
                    >
                    {showUpload ? t('close_btn') : t('upload_btn')}
                    </button>
                )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          
          {/* Public View: Dedicated Dashboard */}
          {userRole === 'public' ? (
              <PublicDashboard lang={lang} t={t} darkMode={darkMode} />
          ) : (
            /* Government View: Full Functionality */
            <>
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
                    {t('tabs_dashboard')}
                    </button>
                    <button
                    className={`tab ${activeTab === 'map' ? 'active' : ''}`}
                    onClick={() => setActiveTab('map')}
                    >
                    {t('tabs_map')}
                    </button>
                </div>

                {/* Tab Content */}
                {loading ? (
                    <div className="loading-container">
                    <div className="spinner"></div>
                    <p>{t('loading')}</p>
                    </div>
                ) : (
                    <>
                    {activeTab === 'dashboard' && (
                        <GovernmentDashboard onRefresh={fetchPlots} lang={lang} t={t} darkMode={darkMode} />
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
                            <p>{t('no_plots')}</p>
                            <p className="empty-hint">{t('upload_hint')}</p>
                            </div>
                        )}
                        </div>
                    )}
                    </>
                )}

                {/* Plots List - Only on Map View for easy access */}
                {!loading && activeTab === 'map' && plots.length > 0 && (
                    <div className="plots-list-section">
                    <h2>{t('all_plots')} ({plots.length})</h2>
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
                                <div className="plot-card-actions">
                                {riskScore !== undefined && (
                                    <span className={`risk-badge ${getRiskClass(riskScore)}`}>
                                    {riskScore >= 70 ? t('high') : riskScore >= 40 ? t('medium') : t('low')}
                                    </span>
                                )}
                                <button
                                    className="btn-delete-icon"
                                    onClick={(e) => handleDeletePlot(e, plot._id)}
                                    title={t('delete_title')}
                                >
                                    🗑️
                                </button>
                                </div>
                            </div>
                            <p className="plot-card-id">ID: {plot.plotId}</p>
                            <div className="plot-card-stats">
                                <div className="stat">
                                <span className="stat-label">{t('area')}</span>
                                <span className="stat-value">
                                    {(plot.approvedArea / 10000).toFixed(2)} ha
                                </span>
                                </div>
                                {riskScore !== undefined && (
                                <div className="stat">
                                    <span className="stat-label">{t('risk')}</span>
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
            </>
          )}

        </div>
      </main>

      {/* Plot Details Modal - Only for Govt */}
      {selectedPlot && userRole === 'govt' && (
        <PlotDetails
          plot={selectedPlot}
          onClose={() => setSelectedPlot(null)}
          onAnalysisComplete={handleAnalysisComplete}
          lang={lang}
          t={t}
          darkMode={darkMode}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>{t('footer_text')}</p>
          <p className="footer-hint">{t('footer_hint')}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
