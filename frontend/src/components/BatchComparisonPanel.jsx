import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { plotAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';

const BatchComparisonPanel = ({ onClose, t = (s) => s }) => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [selectedArea, setSelectedArea] = useState('all');

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await plotAPI.analyzeBatchComparison();
            setResults(response.data.data);
        } catch (err) {
            console.error('Batch comparison error:', err);
            setError(err.response?.data?.message || 'Failed to perform batch comparison');
        } finally {
            setLoading(false);
        }
    };

    const MapBounds = ({ geojson }) => {
        const map = useMap();
        React.useEffect(() => {
            if (geojson && geojson.features && geojson.features.length > 0) {
                const bounds = [];
                geojson.features.forEach(feature => {
                    if (feature.geometry.type === 'Polygon') {
                        feature.geometry.coordinates[0].forEach(coord => {
                            bounds.push([coord[1], coord[0]]);
                        });
                    }
                });
                if (bounds.length > 0) {
                    map.fitBounds(bounds);
                }
            }
        }, [geojson, map]);
        return null;
    };

    const getFeatureStyle = (feature) => {
        return {
            fillColor: feature.properties.color,
            fillOpacity: 0.5,
            color: feature.properties.color,
            weight: 2
        };
    };

    const getDisplayData = () => {
        if (!results) return null;
        if (selectedArea === 'all') {
            // Combine all features from all areas
            const allFeatures = [];
            results.comparisons.forEach(comp => {
                comp.features.features.forEach(feature => {
                    allFeatures.push({
                        ...feature,
                        properties: {
                            ...feature.properties,
                            areaName: comp.areaName
                        }
                    });
                });
            });
            return {
                type: 'FeatureCollection',
                features: allFeatures
            };
        } else {
            const areaData = results.comparisons.find(c => c.areaName === selectedArea);
            return areaData ? areaData.features : null;
        }
    };

    const displayData = getDisplayData();

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                width: '95%',
                maxWidth: '1400px',
                height: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
                            📊 Batch Land Comparison Analysis
                        </h2>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                            Compare registered land vs occupied land (Area 1-10)
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: '4px 8px'
                    }}>×</button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left Panel - Controls & Stats */}
                    <div style={{
                        width: '350px',
                        borderRight: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'auto'
                    }}>
                        <div style={{ padding: '20px' }}>
                            {!results && (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '12px 20px',
                                        background: loading ? '#94a3b8' : '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner" style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid white',
                                                borderTopColor: 'transparent',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></span>
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <span>🔍</span>
                                            Start Batch Analysis
                                        </>
                                    )}
                                </button>
                            )}

                            {error && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            {results && (
                                <>
                                    {/* Area Selector */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '600',
                                            color: '#1e293b',
                                            fontSize: '0.875rem'
                                        }}>
                                            Select Area
                                        </label>
                                        <select
                                            value={selectedArea}
                                            onChange={(e) => setSelectedArea(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <option value="all">All Areas Combined</option>
                                            {results.comparisons.map(comp => (
                                                <option key={comp.areaName} value={comp.areaName}>
                                                    {comp.areaName.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Legend */}
                                    <div style={{
                                        marginBottom: '20px',
                                        padding: '12px',
                                        background: '#f8fafc',
                                        borderRadius: '8px'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#475569' }}>
                                            Color Legend
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    background: '#3b82f6',
                                                    borderRadius: '4px'
                                                }}></div>
                                                <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                                                    Overlap (Valid Usage)
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    background: '#dc2626',
                                                    borderRadius: '4px'
                                                }}></div>
                                                <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                                                    Encroachment (Violation)
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    background: '#16a34a',
                                                    borderRadius: '4px'
                                                }}></div>
                                                <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                                                    Unused (Available)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statistics */}
                                    <div style={{
                                        padding: '16px',
                                        background: '#f1f5f9',
                                        borderRadius: '8px'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#475569' }}>
                                            {selectedArea === 'all' ? 'Total Statistics' : `${selectedArea.toUpperCase()} Statistics`}
                                        </h4>
                                        {selectedArea === 'all' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Overlap</div>
                                                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#3b82f6' }}>
                                                        {results.totals.totalOverlapAreaSqFt} sq ft
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Encroachment</div>
                                                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626' }}>
                                                        {results.totals.totalEncroachmentAreaSqFt} sq ft
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Unused</div>
                                                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#16a34a' }}>
                                                        {results.totals.totalUnusedAreaSqFt} sq ft
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            (() => {
                                                const areaStats = results.comparisons.find(c => c.areaName === selectedArea)?.statistics;
                                                return areaStats ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Overlap</div>
                                                            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#3b82f6' }}>
                                                                {areaStats.overlapAreaSqFt} sq ft
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Encroachment</div>
                                                            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626' }}>
                                                                {areaStats.encroachmentAreaSqFt} sq ft
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Unused</div>
                                                            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#16a34a' }}>
                                                                {areaStats.unusedAreaSqFt} sq ft
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()
                                        )}
                                    </div>

                                    <button
                                        onClick={handleAnalyze}
                                        style={{
                                            width: '100%',
                                            marginTop: '16px',
                                            padding: '10px',
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🔄 Refresh Analysis
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Map */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        {!results && !loading && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                                color: '#94a3b8'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🗺️</div>
                                <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                    Click "Start Batch Analysis" to begin
                                </p>
                            </div>
                        )}

                        {displayData && displayData.features.length > 0 && (
                            <MapContainer
                                center={[21.495, 81.808]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                                <GeoJSON
                                    data={displayData}
                                    style={getFeatureStyle}
                                    onEachFeature={(feature, layer) => {
                                        const props = feature.properties;
                                        layer.bindPopup(`
                                            <div style="font-family: system-ui, sans-serif;">
                                                <strong style="color: ${props.color}; font-size: 1rem;">
                                                    ${props.category.toUpperCase()}
                                                </strong>
                                                ${props.areaName ? `<br/><strong>Area:</strong> ${props.areaName}` : ''}
                                                <br/><strong>Size:</strong> ${props.areaSqFt} sq ft
                                                <br/><strong>Hectares:</strong> ${props.areaHectares} ha
                                            </div>
                                        `);
                                    }}
                                />
                                <MapBounds geojson={displayData} />
                            </MapContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchComparisonPanel;
