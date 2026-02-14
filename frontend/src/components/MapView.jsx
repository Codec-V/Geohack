import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMapEvents, Polyline, Polygon, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import './MapView.css';
import { plotAPI } from '../services/api';
import { calculatePolygonArea, calculatePolygonPerimeter } from '../utils/geometry';

const MapView = ({ plots, onPlotClick, selectedPlot }) => {
    const mapRef = useRef(null);
    const center = [21.23, 81.63];
    const zoom = 15;
    const [mapType, setMapType] = useState('standard'); // 'standard' or 'satellite'
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Drawing state
    const [isDrawMode, setIsDrawMode] = useState(false);
    const [drawPoints, setDrawPoints] = useState([]);
    const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
    const [showCoordinates, setShowCoordinates] = useState(true); // Auto-show by default

    // Analysis modal state
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [selectedReferencePlotId, setSelectedReferencePlotId] = useState('');
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isAnalyzingComparison, setIsAnalyzingComparison] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // Batch comparison state
    const [batchResults, setBatchResults] = useState(null);
    const [isAnalyzingBatch, setIsAnalyzingBatch] = useState(false);
    const [selectedBatchArea, setSelectedBatchArea] = useState('all');


    // Draggable state for instructions panel
    const [position, setPosition] = useState(null);
    const dragRef = useRef(null);
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        // Prevent drag if clicking on a button
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        
        e.stopPropagation();
        e.preventDefault();
        
        const element = dragRef.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const parent = element.offsetParent || document.body;
        const parentRect = parent.getBoundingClientRect();

        // Calculate click offset within the element
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        isDragging.current = true;

        // If this is the first drag, initialize position from current computed style
        if (!position) {
            setPosition({
                x: rect.left - parentRect.left,
                y: rect.top - parentRect.top
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging.current || !dragRef.current) return;
            
            const element = dragRef.current;
            const parent = element.offsetParent || document.body;
            const parentRect = parent.getBoundingClientRect();
            
            // Calculate new position relative to parent
            let newX = e.clientX - parentRect.left - dragOffset.current.x;
            let newY = e.clientY - parentRect.top - dragOffset.current.y;
            
            // Boundary checks
            const maxX = parentRect.width - element.offsetWidth;
            const maxY = parentRect.height - element.offsetHeight;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        if (isDrawMode) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDrawMode, position]);

 // Re-bind if mode changes

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const debounceTimeoutRef = useRef(null);

    // Auto-focus on selected plot
    useEffect(() => {
        if (selectedPlot && mapRef.current) {
            try {
                // Create a temporary Leaflet GeoJSON layer to calculate bounds
                const geoJsonLayer = L.geoJSON(selectedPlot.boundary);
                const bounds = geoJsonLayer.getBounds();

                if (bounds.isValid()) {
                    mapRef.current.fitBounds(bounds, {
                        padding: [50, 50],
                        maxZoom: 18,
                        animate: true,
                        duration: 1.5
                    });

                    // Force switch to satellite view for better context during analysis
                    setMapType('satellite');
                }
            } catch (error) {
                console.error("Error focusing on plot:", error);
            }
        }
    }, [selectedPlot]);

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
                    setDrawPoints(prev => {
                        const newPoints = [...prev, [lat, lng]];
                        // Auto-show coordinates when first point is added
                        if (newPoints.length === 1) {
                            setShowCoordinates(true);
                        }
                        return newPoints;
                    });
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
        setShowCoordinates(false);
    };

    // Handle opening analysis modal
    const handleOpenAnalysisModal = () => {
        if (drawPoints.length < 3) {
            alert("Please draw a polygon with at least 3 points");
            return;
        }
        setShowAnalysisModal(true);
    };

    // Handle comparison analysis
    const handleConfirmAnalysis = async () => {
        if (!selectedReferencePlotId) {
            alert("Please select a reference plot");
            return;
        }

        try {
            setIsAnalyzingComparison(true);

            // Close the polygon
            const coordinates = [...drawPoints, drawPoints[0]];
            const geoJsonCoordinates = [coordinates.map(point => [point[1], point[0]])];

            const drawnGeometry = {
                type: 'Polygon',
                coordinates: geoJsonCoordinates
            };

            const response = await plotAPI.analyzeComparison(selectedReferencePlotId, drawnGeometry);

            if (response.data.success) {
                setAnalysisResults(response.data.data);
                setShowAnalysisModal(false);
                // Keep draw mode active to show results
            }
        } catch (error) {
            console.error("Comparison analysis error:", error);
            alert("Failed to analyze comparison. Please try again.");
        } finally {
            setIsAnalyzingComparison(false);
        }
    };

    // Clear analysis results
    const handleClearAnalysis = () => {
        setAnalysisResults(null);
        setIsDrawMode(false);
        setDrawPoints([]);
        setShowCoordinates(false);
        setSelectedReferencePlotId('');
    };

    // Handle batch comparison
    const handleBatchAnalysis = async () => {
        try {
            setIsAnalyzingBatch(true);
            const response = await plotAPI.analyzeBatchComparison();
            if (response.data.success) {
                setBatchResults(response.data.data);
                // Zoom to the area
                if (mapRef.current) {
                    mapRef.current.flyTo([21.495, 81.808], 15, { duration: 1.5 });
                }
            }
        } catch (error) {
            console.error('Batch analysis error:', error);
            alert('Failed to perform batch analysis. Please try again.');
        } finally {
            setIsAnalyzingBatch(false);
        }
    };

    // Clear batch results
    const handleClearBatch = () => {
        setBatchResults(null);
        setSelectedBatchArea('all');
    };

    // Create GeoJSON from drawn points
    const createGeoJSON = () => {
        if (drawPoints.length < 3) return null;

        // Close the polygon
        const coordinates = [...drawPoints, drawPoints[0]];
        // Convert to GeoJSON format [lng, lat]
        const geoJsonCoordinates = [coordinates.map(point => [point[1], point[0]])];

        return {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                properties: {
                    name: "Custom Plot",
                    source: "GeoCompliance Drawing Tool"
                },
                geometry: {
                    type: "Polygon",
                    coordinates: geoJsonCoordinates
                }
            }]
        };
    };

    // Open in geojson.io
    const handleOpenInGeoJSONIO = () => {
        const geojson = createGeoJSON();
        if (!geojson) {
            alert("Please draw at least 3 points to create a polygon");
            return;
        }

        const url = "https://geojson.io/#data=data:application/json," +
            encodeURIComponent(JSON.stringify(geojson));
        window.open(url, "_blank");
    };

    // Copy coordinates to clipboard
    const handleCopyCoordinates = async () => {
        if (drawPoints.length === 0) {
            alert("No coordinates to copy");
            return;
        }

        const coordText = drawPoints.map((point, i) =>
            `Point ${i + 1}: [${point[0].toFixed(6)}, ${point[1].toFixed(6)}]`
        ).join('\n');

        try {
            await navigator.clipboard.writeText(coordText);
            alert("Coordinates copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy:", err);
            alert("Failed to copy coordinates");
        }
    };

    // Copy GeoJSON to clipboard
    const handleCopyGeoJSON = async () => {
        const geojson = createGeoJSON();
        if (!geojson) {
            alert("Please draw at least 3 points to create a polygon");
            return;
        }

        try {
            await navigator.clipboard.writeText(JSON.stringify(geojson, null, 2));
            alert("GeoJSON copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy:", err);
            alert("Failed to copy GeoJSON");
        }
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
        const riskScore = plot?.latestAnalysis?.finalRiskScore || 0;

        // HEATMAP MODE: Override everything
        if (showHeatmap) {
             if (riskScore > 70) {
                return { fillColor: '#ef4444', fillOpacity: 0.8, color: '#ef4444', weight: 0 }; // High Risk
            } else if (riskScore > 40) {
                return { fillColor: '#f97316', fillOpacity: 0.5, color: '#f97316', weight: 0 }; // Medium Risk
            } else {
                return { fillColor: '#94a3b8', fillOpacity: 0.1, color: 'transparent', weight: 0 }; // Low/No Risk
            }
        }

        // Standard Styling
        // If this is a usage zone feature, use usage type color
        if (feature.properties.usageType) {
            return {
                fillColor: getUsageColor(feature.properties.usageType),
                fillOpacity: 0.6,
                color: getUsageColor(feature.properties.usageType),
                weight: 2,
                opacity: 0.8
            };
        }

        return {
            fillColor: getRiskColor(riskScore),
            fillOpacity: selectedPlot?._id === feature.properties.id ? 0.7 : 0.5,
            color: getRiskColor(riskScore),
            weight: selectedPlot?._id === feature.properties.id ? 3 : 2,
            opacity: 1
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
                </div>
            )}

            {/* Draw Feature Panel (Right Side) */}
            {isDrawMode && (
                <div className="draw-panel animate-slide-left">
                    <div className="draw-panel-header">
                        <h3>📏 Custom Area Analysis</h3>
                        <button onClick={handleCancelDraw} className="close-btn">✕</button>
                    </div>
                    
                    <div className="draw-stats">
                        <div className="stat-item">
                            <span className="stat-label">Area</span>
                            <span className="stat-value">
                                {(calculatePolygonArea(drawPoints)).toLocaleString(undefined, {maximumFractionDigits: 0})} m²
                                <small>({(calculatePolygonArea(drawPoints) * 10.764).toLocaleString(undefined, {maximumFractionDigits: 0})} sqft)</small>
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Perimeter</span>
                            <span className="stat-value">
                                {(calculatePolygonPerimeter(drawPoints)).toLocaleString(undefined, {maximumFractionDigits: 1})} m
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Points</span>
                            <span className="stat-value">{drawPoints.length}</span>
                        </div>
                    </div>

                    <div className="draw-actions">
                        <button
                            className="action-btn primary"
                            disabled={drawPoints.length < 3}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAnalysisModal();
                            }}
                        >
                            🔍 Analyze with AI
                        </button>
                        <div className="action-row">
                            <button className="action-btn secondary" onClick={handleCopyCoordinates}>
                                📋 Copy Coords
                            </button>
                            <button className="action-btn secondary" onClick={handleCopyGeoJSON}>
                                🌐 Copy GeoJSON
                            </button>
                        </div>
                         <button
                            className="action-btn danger"
                            onClick={handleCancelDraw}
                        >
                            🗑️ Discard
                        </button>
                    </div>

                     {/* Collapsible Coordinates List */}
                     <div className="coords-list">
                        <h4>Coordinates</h4>
                         <div className="coords-scroll">
                            {drawPoints.length === 0 ? (
                                <p className="empty-text">Click map to add points...</p>
                            ) : (
                                drawPoints.map((point, i) => (
                                    <div key={i} className="coord-row">
                                        <span>P{i + 1}</span>
                                        <code>{point[0].toFixed(5)}, {point[1].toFixed(5)}</code>
                                    </div>
                                ))
                            )}
                        </div>
                     </div>
                </div>
            )}



            {/* Analysis Modal */}
            {showAnalysisModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}
                onClick={() => setShowAnalysisModal(false)}
                >
                    <div style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        minWidth: '400px',
                        maxWidth: '500px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#111827' }}>
                            Select Reference Plot
                        </h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: '#6b7280' }}>
                            Choose a government-allotted plot to compare with your drawn polygon
                        </p>
                        
                        <select
                            value={selectedReferencePlotId}
                            onChange={(e) => setSelectedReferencePlotId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '0.875rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                marginBottom: '20px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">-- Select a plot --</option>
                            {plots.map(plot => (
                                <option key={plot._id} value={plot._id}>
                                    {plot.plotId} - {plot.name}
                                </option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowAnalysisModal(false);
                                    setSelectedReferencePlotId('');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '0.875rem',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAnalysis}
                                disabled={!selectedReferencePlotId || isAnalyzingComparison}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '0.875rem',
                                    background: selectedReferencePlotId && !isAnalyzingComparison ? '#3b82f6' : '#93c5fd',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: selectedReferencePlotId && !isAnalyzingComparison ? 'pointer' : 'not-allowed',
                                    fontWeight: '500'
                                }}
                            >
                                {isAnalyzingComparison ? '⏳ Analyzing...' : '✓ Confirm Analyze'}
                            </button>
                        </div>
                    </div>
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
                        // If we were analyzing, clear it first
                        if (isAnalyzingCustom || showAnalysisModal) {
                            handleClearAnalysis();
                        }
                        setIsDrawMode(!isDrawMode);
                        // Reset points if starting new
                        if (!isDrawMode) {
                            setDrawPoints([]);
                            setShowCoordinates(false);
                        }
                    }}
                    title="Draw Custom Area"
                >
                    ✏️ {isDrawMode ? 'Cancel' : 'Draw'}
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

                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }}></div>
                <button
                    className={`toggle-btn ${batchResults ? 'active' : ''}`}
                    style={{ background: batchResults ? '#10b981' : 'white', color: batchResults ? 'white' : '#10b981', borderColor: '#10b981' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (batchResults) {
                            handleClearBatch();
                        } else {
                            handleBatchAnalysis();
                        }
                    }}
                    disabled={isAnalyzingBatch}
                >
                    {isAnalyzingBatch ? '⏳ Loading...' : ( '📊  Analysis')}
                </button>
            </div>

            <MapContainer
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
                {plots.length > 0 && !batchResults && (
                    <GeoJSON
                        key={JSON.stringify(plotsGeoJSON)}
                        data={plotsGeoJSON}
                        style={plotStyle}
                        onEachFeature={onEachFeature}
                    />
                )}

                {/* Render usage zones on top */}
                {allUsageZones.features.length > 0 && !batchResults && (
                    <GeoJSON
                        key={`usage-zones-${JSON.stringify(allUsageZones)}`}
                        data={allUsageZones}
                        style={plotStyle}
                        onEachFeature={onEachFeature}
                    />
                )}

                {/* Render analysis results (comparison) */}
                {analysisResults && analysisResults.features && analysisResults.features.length > 0 && (
                    <GeoJSON
                        key={`analysis-${JSON.stringify(analysisResults)}`}
                        data={analysisResults}
                        style={(feature) => ({
                            fillColor: feature.properties.color,
                            fillOpacity: 0.6,
                            color: feature.properties.color,
                            weight: 2,
                            opacity: 0.9
                        })}
                        onEachFeature={(feature, layer) => {
                            const categoryLabels = {
                                overlap: 'Valid Overlap',
                                encroachment: 'Encroachment',
                                unused: 'Unused Area'
                            };
                            
                            layer.bindPopup(`
                                <div style="min-width: 180px;">
                                    <h3 style="margin: 0 0 8px 0; font-size: 14px;">${categoryLabels[feature.properties.category]}</h3>
                                    <p style="margin: 4px 0; font-size: 12px;"><strong>Area:</strong> ${feature.properties.areaHectares} hectares</p>
                                    <p style="margin: 4px 0; font-size: 12px;"><strong>Category:</strong> ${feature.properties.category}</p>
                                </div>
                            `);
                            
                            layer.on({
                                mouseover: (e) => {
                                    e.target.setStyle({
                                        fillOpacity: 0.8,
                                        weight: 3
                                    });
                                },
                                mouseout: (e) => {
                                    e.target.setStyle({
                                        fillOpacity: 0.6,
                                        weight: 2
                                    });
                                }
                            });
                        }}
                    />
                )}

                {/* Render batch comparison results */}
                {batchResults && batchResults.comparisons && (() => {
                    const allBatchFeatures = [];
                    batchResults.comparisons.forEach(comp => {
                        comp.features.features.forEach(feature => {
                            allBatchFeatures.push({
                                ...feature,
                                properties: {
                                    ...feature.properties,
                                    areaName: comp.areaName
                                }
                            });
                        });
                    });
                    
                    if (allBatchFeatures.length === 0) return null;
                    
                    return (
                        <GeoJSON
                            key={`batch-${JSON.stringify(batchResults)}`}
                            data={{
                                type: 'FeatureCollection',
                                features: allBatchFeatures
                            }}
                            style={(feature) => ({
                                fillColor: feature.properties.color,
                                fillOpacity: 0.5,
                                color: feature.properties.color,
                                weight: 2,
                                opacity: 0.9
                            })}
                            onEachFeature={(feature, layer) => {
                                const categoryLabels = {
                                    overlap: '🔵 Valid Overlap',
                                    encroachment: '🔴 Encroachment',
                                    unused: '🟢 Unused Area'
                                };
                                
                                layer.bindPopup(`
                                    <div style="min-width: 200px; font-family: system-ui, sans-serif;">
                                        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: ${feature.properties.color};">
                                            ${categoryLabels[feature.properties.category]}
                                        </h3>
                                        <p style="margin: 4px 0; font-size: 12px;"><strong>Area:</strong> ${feature.properties.areaName}</p>
                                        <p style="margin: 4px 0; font-size: 12px;"><strong>Size:</strong> ${feature.properties.areaSqFt} sq ft</p>
                                        <p style="margin: 4px 0; font-size: 12px;"><strong>Hectares:</strong> ${feature.properties.areaHectares} ha</p>
                                    </div>
                                `);
                                
                                layer.on({
                                    mouseover: (e) => {
                                        e.target.setStyle({
                                            fillOpacity: 0.8,
                                            weight: 3
                                        });
                                    },
                                    mouseout: (e) => {
                                        e.target.setStyle({
                                            fillOpacity: 0.5,
                                            weight: 2
                                        });
                                    }
                                });
                            }}
                        />
                    );
                })()}

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


            {/* Re-adding Legend at Bottom Left for cleaner look */}
            <div className="map-legend" style={{ bottom: '30px', left: '20px', top: 'auto' }}>
                <h4 style={{ fontSize: '0.75rem', marginBottom: '8px' }}>GIS LAYER GUIDE</h4>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#dc2626' }}></span>
                    <span>Encroached</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#3b82f6' }}></span>
                    <span>Valid Usage</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#16a34a' }}></span>
                    <span>Unused Land</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ background: '#fbbf24' }}></span>
                    <span>Vacant (High Risk)</span>
                </div>
            </div>
        </div>
    );
};

export default MapView;