import React, { useState } from 'react';

const GISComparisonPanel = ({ onClose, t = (s) => s }) => {
    const [activeTab, setActiveTab] = useState('satellite'); // 'satellite' or 'coordinates'
    const [step, setStep] = useState('initial'); // initial, syncing, synced, analyzing, analyzed
    const [violations, setViolations] = useState([]);

    // Coordinate States
    const [userCoords, setUserCoords] = useState({ lat: '', lng: '' });
    const [officialCoords] = useState({ lat: 28.5355, lng: 77.3910 }); // Mock Official Coords
    const [deviation, setDeviation] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const handleSync = () => {
        setStep('syncing');
        setTimeout(() => {
            setStep('synced');
        }, 2000);
    };

    const handleAnalyze = () => {
        setStep('analyzing');
        setTimeout(() => {
            setStep('analyzed');
            setViolations([
                { id: 1, type: 'Encroachment', area: '120 sqft', severity: 'High', location: 'North Boundary' },
                { id: 2, type: 'Illegal Construction', area: '450 sqft', severity: 'Critical', location: 'East Flank' }
            ]);
        }, 2500);
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            setVerifying(true);
            // Simulate delay for realism
            setTimeout(() => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserCoords({
                            lat: position.coords.latitude.toFixed(6),
                            lng: position.coords.longitude.toFixed(6)
                        });
                        setVerifying(false);
                        calculateDeviation(position.coords.latitude, position.coords.longitude);
                    },
                    (error) => {
                        console.error("Error getting location", error);
                        // Fallback to mock "near" location if permission denied or error
                        const mockLat = officialCoords.lat + 0.00015; // Slightly off
                        const mockLng = officialCoords.lng + 0.00010;
                        setUserCoords({ lat: mockLat.toFixed(6), lng: mockLng.toFixed(6) });
                        setVerifying(false);
                        calculateDeviation(mockLat, mockLng);
                    }
                );
            }, 1000);
        }
    };

    const calculateDeviation = (lat, lng) => {
        // Haversine formula approximation for short distances
        const R = 6371e3; // metres
        const φ1 = lat * Math.PI/180;
        const φ2 = officialCoords.lat * Math.PI/180;
        const Δφ = (officialCoords.lat - lat) * Math.PI/180;
        const Δλ = (officialCoords.lng - lng) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; // in metres

        setDeviation(d.toFixed(2));
    };

    return (
        <div className="glass-panel animate-fade-in" style={{
            position: 'fixed', top: '80px', right: '20px', width: '400px',
            borderRadius: '16px', zIndex: 1000, overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px', background: 'linear-gradient(to right, #0f172a, #1e293b)',
                color: 'white'
            }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{fontSize: '1.25rem'}}>🛰️</span>
                        <h3 style={{margin: 0, fontSize: '1rem', fontWeight: '600', fontFamily: 'var(--font-heading)'}}>GIS Data Sync</h3>
                    </div>
                    <button onClick={onClose} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem'}}>×</button>
                </div>
                
                {/* Tabs */}
                <div style={{display: 'flex', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '8px'}}>
                    <button 
                        onClick={() => setActiveTab('satellite')}
                        style={{
                            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: activeTab === 'satellite' ? 'white' : 'transparent',
                            color: activeTab === 'satellite' ? '#0f172a' : '#cbd5e1',
                            fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s'
                        }}
                    >
                        Satellite View
                    </button>
                    <button 
                        onClick={() => setActiveTab('coordinates')}
                        style={{
                            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: activeTab === 'coordinates' ? 'white' : 'transparent',
                            color: activeTab === 'coordinates' ? '#0f172a' : '#cbd5e1',
                            fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s'
                        }}
                    >
                        Field Verification
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.95)', minHeight: '300px'}}>
                
                {/* --- SATELLITE TAB --- */}
                {activeTab === 'satellite' && (
                    <>
                        {step === 'initial' && (
                            <div style={{textAlign: 'center', padding: '20px 0'}}>
                                <div style={{fontSize: '3rem', marginBottom: '16px', opacity: 0.5}}>📡</div>
                                <h4 style={{color: '#334155', marginBottom: '8px'}}>Connect to CSIDC Server</h4>
                                <p style={{color: '#64748b', fontSize: '0.9rem', marginBottom: '24px'}}>
                                    Fetch latest official plot boundaries (GeoJSON) to compare with current satellite imagery.
                                </p>
                                <button 
                                    onClick={handleSync}
                                    className="btn-primary"
                                    style={{width: '100%', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}
                                >
                                    Sync Now
                                </button>
                            </div>
                        )}

                        {step === 'syncing' && (
                            <div style={{textAlign: 'center', padding: '30px 0'}}>
                                <div className="spinner" style={{margin: '0 auto 16px'}}></div>
                                <p style={{color: '#0d9488', fontWeight: '500'}}>Fetching GeoJSON Data...</p>
                                <p style={{fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px'}}>Connecting to csidc.gov.in/api/v2/geo...</p>
                            </div>
                        )}

                        {(step === 'synced' || step === 'analyzing' || step === 'analyzed') && (
                            <div>
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#10b981'}}></div>
                                        <span style={{fontSize: '0.9rem', fontWeight: '600', color: '#059669'}}>Data Synced</span>
                                    </div>
                                    <span style={{fontSize: '0.75rem', color: '#64748b'}}>Last update: Just now</span>
                                </div>

                                {/* Visualization Mock */}
                                <div style={{height: '180px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '16px', position: 'relative', overflow: 'hidden'}}>
                                    {/* Satellite Layer */}
                                    <img src="https://images.unsplash.com/photo-1599423300746-b62507ac97f5?w=400&h=200&fit=crop" style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.3)'}} alt="Sat View" />
                                    
                                    {/* Vector Overlay */}
                                    <div style={{
                                        position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%', 
                                        border: '2px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <span style={{color: '#2563eb', fontWeight: 'bold', fontSize: '0.8rem', textShadow: '0 0 4px white'}}>Official Boundary</span>
                                    </div>

                                    {/* Encroachment Highlight (Only show when analyzed) */}
                                    {step === 'analyzed' && (
                                        <div className="animate-pulse" style={{
                                            position: 'absolute', top: '15%', left: '75%', width: '15%', height: '30%', 
                                            background: 'rgba(239, 68, 68, 0.6)', border: '2px solid #ef4444',
                                            borderRadius: '4px'
                                        }}></div>
                                    )}
                                </div>

                                {step === 'synced' && (
                                    <button 
                                        onClick={handleAnalyze}
                                        className="btn-primary"
                                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: '#4f46e5'}}
                                    >
                                        ✨ Run AI Analysis
                                    </button>
                                )}

                                {step === 'analyzing' && (
                                    <div style={{textAlign: 'center'}}>
                                        <p style={{color: '#4f46e5', fontWeight: '600'}}>Analyzing satellite imagery...</p>
                                        <div style={{width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '8px', overflow: 'hidden'}}>
                                            <div style={{width: '60%', height: '100%', background: '#4f46e5', animation: 'indeterminate 1.5s infinite linear'}}></div>
                                        </div>
                                    </div>
                                )}

                                {step === 'analyzed' && (
                                    <div className="animate-slide-up">
                                        <div style={{background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '16px'}}>
                                            <h5 style={{margin: '0 0 8px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                                ⚠️ Alert: Discrepancies Found
                                            </h5>
                                            {violations.map(v => (
                                                <div key={v.id} style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', borderBottom: '1px dashed #fecaca', paddingBottom: '4px'}}>
                                                    <span style={{color: '#7f1d1d'}}>{v.type} ({v.location})</span>
                                                    <span style={{fontWeight: 'bold', color: '#dc2626'}}>{v.area}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{display: 'flex', gap: '12px'}}>
                                            <button className="btn" style={{flex: 1, background: '#cbd5e1', color: '#334155'}}>Ignore</button>
                                            <button className="btn-primary" style={{flex: 1, background: '#ef4444'}}>Issue Notice</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* --- COORDINATES TAB --- */}
                {activeTab === 'coordinates' && (
                    <div className="animate-slide-up">
                        <div style={{background: '#f1f5f9', padding: '12px', borderRadius: '8px', marginBottom: '16px'}}>
                            <h5 style={{margin: '0 0 8px 0', color: '#475569', fontSize: '0.9rem'}}>Official Record (Marker A)</h5>
                            <div style={{display: 'flex', gap: '12px', fontFamily: 'monospace', color: '#1e293b'}}>
                                <div>Lat: <strong>{officialCoords.lat}</strong></div>
                                <div>Lng: <strong>{officialCoords.lng}</strong></div>
                            </div>
                        </div>

                        <div style={{marginBottom: '20px'}}>
                            <h5 style={{margin: '0 0 8px 0', color: '#475569', fontSize: '0.9rem'}}>Your Location (Marker B)</h5>
                            <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
                                <input 
                                    type="text" 
                                    placeholder="Latitude" 
                                    value={userCoords.lat}
                                    onChange={(e) => setUserCoords({...userCoords, lat: e.target.value})}
                                    style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Longitude" 
                                    value={userCoords.lng}
                                    onChange={(e) => setUserCoords({...userCoords, lng: e.target.value})}
                                    style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                                />
                            </div>
                            <button 
                                onClick={handleGetLocation}
                                className="btn"
                                style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd'}}
                                disabled={verifying}
                            >
                                {verifying ? 'Acquiring Signal...' : '📍 Use Current GPS Location'}
                            </button>
                        </div>

                        {deviation !== null && (
                             <div className="animate-pulse" style={{
                                textAlign: 'center', padding: '20px', 
                                background: Number(deviation) > 5 ? '#fef2f2' : '#f0fdf4',
                                border: `2px solid ${Number(deviation) > 5 ? '#fee2e2' : '#bbf7d0'}`,
                                borderRadius: '12px'
                            }}>
                                <p style={{color: '#64748b', fontSize: '0.9rem', marginBottom: '4px'}}>Boundary Deviation</p>
                                <h2 style={{
                                    fontSize: '2rem', fontWeight: '800', margin: '4px 0',
                                    color: Number(deviation) > 5 ? '#dc2626' : '#16a34a'
                                }}>
                                    {deviation}m
                                </h2>
                                <p style={{
                                    fontSize: '0.85rem', fontWeight: '600',
                                    color: Number(deviation) > 5 ? '#b91c1c' : '#15803d'
                                }}>
                                    {Number(deviation) > 5 ? '⚠️ Major Discrepancy Detected' : '✅ Within Tolerance'}
                                </p>
                            </div>
                        )}

                        {!deviation && !verifying && userCoords.lat && (
                            <button 
                                onClick={() => calculateDeviation(userCoords.lat, userCoords.lng)}
                                className="btn-primary"
                                style={{width: '100%', marginTop: '12px'}}
                            >
                                Verify Coords
                            </button>
                        )}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes indeterminate {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default GISComparisonPanel;
