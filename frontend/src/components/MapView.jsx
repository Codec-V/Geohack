import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMapEvents, Polyline, Polygon, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { plotAPI } from '../services/api';

const MapView = ({ plots, onPlotClick, selectedPlot }) => {
    const mapRef = useRef(null);
    const [center] = useState([28.6139, 77.2090]); // Default: Delhi, India
    const [zoom] = useState(12);
    const [mapType, setMapType] = useState('standard'); // 'standard' or 'satellite'

    // Drawing state
    const [isDrawMode, setIsDrawMode] = useState(false);
    const [drawPoints, setDrawPoints] = useState([]);
    const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);

    // Draw mode effect to close popups
    useEffect(() => {
        if (isDrawMode && mapRef.current) {
            mapRef.current.closePopup();
        }
    }, [isDrawMode]);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const debounceTimeoutRef = useRef(null);

    // Fetch suggestions as user types
    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const data = await response.json();
                setSuggestions(data || []);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, 300);
    };

    const handleSelectSuggestion = (place) => {
        setSearchQuery(place.display_name);
        setSuggestions([]);
        
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        
        if (mapRef.current) {
            mapRef.current.flyTo([lat, lon], 14, {
                duration: 1.5
            });
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        // If we have suggestions, pick the first one
        if (suggestions.length > 0) {
            handleSelectSuggestion(suggestions[0]);
            return;
        }
        
        setIsSearching(true);
        setSearchError(null);
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                if (mapRef.current) {
                    mapRef.current.flyTo([lat, lon], 14, {
                        duration: 1.5
                    });
                }
            } else {
                setSearchError('Location not found');
                setTimeout(() => setSearchError(null), 3000);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setSearchError('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    // Map events component to handle clicks
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                if (isDrawMode && !isAnalyzingCustom) {
                    const { lat, lng } = e.latlng;
                    setDrawPoints(prev => [...prev, [lat, lng]]);
                }
            }
        });
        return null;
    };

    // Handle custom analysis
    const handleAnalyzeCustom = async () => {
        if (drawPoints.length < 3) {
            alert("Please draw a polygon with at least 3 points");
            return;
        }

        try {
            setIsAnalyzingCustom(true);

            // Close the polygon by adding the first point at the end
            const coordinates = [...drawPoints, drawPoints[0]];

            // Construct GeoJSON Polygon
            // Note: GeoJSON expects [lng, lat], but Leaflet uses [lat, lng]
            const geoJsonCoordinates = [coordinates.map(point => [point[1], point[0]])];

            const geometry = {
                type: 'Polygon',
                coordinates: geoJsonCoordinates
            };

            const response = await plotAPI.analyzeCustom(geometry);

            if (response.data.success) {
                // Pass the temp plot to the parent handler to show details
                onPlotClick(response.data.data);

                // Exit draw mode
                setIsDrawMode(false);
                setDrawPoints([]);
            }
        } catch (error) {
            console.error("Custom analysis error:", error);
            alert("Failed to analyze drawn area. Please try again.");
        } finally {
            setIsAnalyzingCustom(false);
        }
    };

    // Cancel drawing
    const handleCancelDraw = () => {
        setIsDrawMode(false);
        setDrawPoints([]);
    };

    // Get color based on usage type
    const getUsageColor = (usageType) => {
        switch (usageType) {
            case 'encroached':
                return '#dc2626'; // Red - Encroached areas
            case 'partiallyConstructed':
                return '#16a34a'; // Green - Partially constructed
            case 'vacant':
                return '#f59e0b'; // Yellow - Vacant
            case 'fullyConstructed':
                return '#3b82f6'; // Blue - Fully constructed
            default:
                return '#94a3b8'; // Gray - No analysis
        }
    };

    // Get color based on risk score (fallback for plots without usage data)
    const getRiskColor = (score) => {
        if (!score) return '#94a3b8'; // Gray for no analysis
        if (score >= 70) return '#dc2626'; // Red - High risk
        if (score >= 40) return '#f59e0b'; // Yellow - Medium risk
        return '#16a34a'; // Green - Low risk
    };

    // Style function for GeoJSON features
    const plotStyle = (feature) => {
        const plot = plots.find(p => p._id === feature.properties.id);

        // If this is a usage zone feature, use usage type color
        if (feature.properties.usageType) {
            return {
                fillColor: getUsageColor(feature.properties.usageType),
                fillOpacity: 0.6,
                color: getUsageColor(feature.properties.usageType),
                weight: 2,
                opacity: 0.8,
                interactive: !isDrawMode // Disable interaction in draw mode
            };
        }

        // Otherwise use risk-based color (for plots without usage zones)
        const riskScore = plot?.latestAnalysis?.finalRiskScore;

        return {
            fillColor: getRiskColor(riskScore),
            fillOpacity: selectedPlot?._id === feature.properties.id ? 0.7 : 0.5,
            color: getRiskColor(riskScore),
            weight: selectedPlot?._id === feature.properties.id ? 3 : 2,
            opacity: 1,
            interactive: !isDrawMode // Disable interaction in draw mode
        };
    };

    // Handle plot click
    const onEachFeature = (feature, layer) => {
        layer.on({
            click: () => {
                // Only handle clicks on main plot features, not usage zones
                // Also prevent clicks when drawing
                if (!isDrawMode && !feature.properties.usageType) {
                    const plot = plots.find(p => p._id === feature.properties.id);
                    if (plot && onPlotClick) {
                        onPlotClick(plot);
                    }
                }
            },
            mouseover: (e) => {
                if (!isDrawMode) {
                    e.target.setStyle({
                        fillOpacity: 0.8,
                        weight: 3
                    });
                }
            },
            mouseout: (e) => {
                if (!isDrawMode) {
                    const baseOpacity = feature.properties.usageType ? 0.6 :
                        (selectedPlot?._id === feature.properties.id ? 0.7 : 0.5);
                    const baseWeight = feature.properties.usageType ? 2 :
                        (selectedPlot?._id === feature.properties.id ? 3 : 2);

                    e.target.setStyle({
                        fillOpacity: baseOpacity,
                        weight: baseWeight
                    });
                }
            }
        });

        // Bind popup only if not in draw mode
        if (!isDrawMode) {
            if (feature.properties.usageType) {
                // Usage zone popup
                const usageLabels = {
                    encroached: 'Encroached Area',
                    partiallyConstructed: 'Partially Constructed',
                    vacant: 'Vacant Area',
                    fullyConstructed: 'Fully Constructed'
                };
                layer.bindPopup(`
                    <div style="min-width: 180px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">${usageLabels[feature.properties.usageType]}</h3>
                        <p style="margin: 4px 0; font-size: 12px;"><strong>Area:</strong> ${(feature.properties.area / 10000).toFixed(2)} hectares</p>
                        <p style="margin: 4px 0; font-size: 12px;"><strong>Percentage:</strong> ${feature.properties.percentage.toFixed(1)}%</p>
                    </div>
                `);
            } else {
                // Main plot popup
                const plot = plots.find(p => p._id === feature.properties.id);
                if (plot) {
                    const riskScore = plot.latestAnalysis?.finalRiskScore || 'Not analyzed';
                    layer.bindPopup(`
                        <div style="min-width: 200px;">
                            <h3 style="margin: 0 0 8px 0; font-size: 14px;">${plot.name}</h3>
                            <p style="margin: 4px 0; font-size: 12px;"><strong>Plot ID:</strong> ${plot.plotId}</p>
                            <p style="margin: 4px 0; font-size: 12px;"><strong>Risk Score:</strong> ${riskScore}</p>
                            ${plot.latestAnalysis ? `
                                <p style="margin: 4px 0; font-size: 12px;"><strong>Status:</strong> ${plot.latestAnalysis.isVacant ? 'Vacant' : 'Utilized'}</p>
                            ` : ''}
                        </div>
                    `);
                }
            }
        }
    };

    // Convert plots to GeoJSON features
    const plotsGeoJSON = {
        type: 'FeatureCollection',
        features: plots.map(plot => ({
            type: 'Feature',
            properties: {
                id: plot._id,
                name: plot.name,
                plotId: plot.plotId
            },
            geometry: plot.boundary
        }))
    };

    // Collect all usage zones from analyzed plots
    const allUsageZones = {
        type: 'FeatureCollection',
        features: []
    };

    plots.forEach(plot => {
        if (plot.latestAnalysis?.usageZones?.features) {
            // Add plot ID to each zone feature for identification
            const plotZones = plot.latestAnalysis.usageZones.features.map(feature => ({
                ...feature,
                properties: {
                    ...feature.properties,
                    plotId: plot._id,
                    plotName: plot.name
                }
            }));
            allUsageZones.features.push(...plotZones);
        }
    });

    return (
        <div className="map-container">
            {/* Draw Mode Instructions */}
            {isDrawMode && (
                <div className="map-instructions">
                    <span>✨ Click on map to add points. Draw a polygon to analyze. ({drawPoints.length} points)</span>
                    <button
                        className="toggle-btn"
                        style={{ padding: '2px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelDraw();
                        }}
                    >
                        ✕ Cancel
                    </button>
                    {drawPoints.length >= 3 && (
                        <button
                            className="toggle-btn active"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', background: '#3b82f6', color: 'white' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyzeCustom();
                            }}
                            disabled={isAnalyzingCustom}
                        >
                            {isAnalyzingCustom ? '⏳ Analyzing...' : '🔍 Analyze Area'}
                        </button>
                    )}
                </div>
            )}

            <div className="map-view-toggle">
                {/* Search Bar */}
                <div className="map-search-bar" onClick={e => e.stopPropagation()}>
                    <input 
                        type="text" 
                        placeholder="Search location..." 
                        value={searchQuery}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        onFocus={() => {
                            if (searchQuery.length >= 3 && suggestions.length === 0) {
                                // Trigger search if re-focusing with existing text
                                handleInputChange({ target: { value: searchQuery } });
                            }
                        }}
                    />
                    <button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? '...' : '🔍'}
                    </button>
                    
                    {/* Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                        <ul className="search-suggestions">
                            {suggestions.map((place) => (
                                <li 
                                    key={place.place_id} 
                                    onClick={() => handleSelectSuggestion(place)}
                                >
                                    {place.display_name}
                                </li>
                            ))}
                        </ul>
                    )}

                    {searchError && <span className="search-error-tooltip">{searchError}</span>}
                </div>

                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 8px' }}></div>

                {/* Draw Toggle */}
                <button
                    className={`toggle-btn ${isDrawMode ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isDrawMode) {
                            handleCancelDraw();
                        } else {
                            setIsDrawMode(true);
                            setDrawPoints([]);
                        }
                    }}
                >
                    ✏️ Draw
                </button>
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }}></div>
                <button
                    className={`toggle-btn ${mapType === 'standard' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setMapType('standard');
                    }}
                >
                    🗺️ Map
                </button>
                <button
                    className={`toggle-btn ${mapType === 'satellite' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setMapType('satellite');
                    }}
                >
                    🛰️ Satellite
                </button>
            </div>

            <MapContainer
                className={`leaflet-container ${isDrawMode ? 'draw-mode-active' : ''}`}
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', cursor: isDrawMode ? 'crosshair' : 'grab' }}
                ref={mapRef}
            >
                <MapEvents />

                {mapType === 'standard' ? (
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                ) : (
                    <>
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                        />
                    </>
                )}

                {/* Render main plot boundaries */}
                {plots.length > 0 && (
                    <GeoJSON
                        key={`${JSON.stringify(plotsGeoJSON)}-${isDrawMode}`}
                        data={plotsGeoJSON}
                        style={plotStyle}
                        onEachFeature={onEachFeature}
                    />
                )}

                {/* Render usage zones on top */}
                {allUsageZones.features.length > 0 && (
                    <GeoJSON
                        key={`usage-zones-${JSON.stringify(allUsageZones)}-${isDrawMode}`}
                        data={allUsageZones}
                        style={plotStyle}
                        onEachFeature={onEachFeature}
                    />
                )}

                {/* Drawn Polygon */}
                {drawPoints.length > 0 && (
                    <>
                        <Polyline positions={[...drawPoints, isDrawMode && drawPoints.length > 2 ? drawPoints[0] : drawPoints[drawPoints.length - 1]]} color="#3b82f6" dashArray="5, 5" />
                        {drawPoints.map((pos, i) => (
                            <CircleMarker
                                key={i}
                                center={pos}
                                radius={4}
                                color="white"
                                fillColor="#3b82f6"
                                fillOpacity={1}
                                weight={2}
                            />
                        ))}
                        {drawPoints.length >= 3 && (
                            <Polygon
                                positions={drawPoints}
                                color="#3b82f6"
                                fillColor="#3b82f6"
                                fillOpacity={0.2}
                                weight={1}
                            />
                        )}
                    </>
                )}
            </MapContainer>

            {/* Legend */}
            <div className="map-legend">
                <h4>Land Usage Types</h4>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#dc2626' }}></span>
                    <span>Encroached</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#16a34a' }}></span>
                    <span>Partially Constructed</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#f59e0b' }}></span>
                    <span>Vacant</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#3b82f6' }}></span>
                    <span>Fully Constructed</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#94a3b8' }}></span>
                    <span>Not Analyzed</span>
                </div>
            </div>
        </div>
    );
};

export default MapView;
