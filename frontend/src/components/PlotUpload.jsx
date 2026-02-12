import React, { useState } from 'react';
import { plotAPI } from '../services/api';
import './PlotUpload.css';

const PlotUpload = ({ onUploadSuccess }) => {
    const [formData, setFormData] = useState({
        plotId: '',
        name: '',
        allotmentDate: ''
    });
    const [geojsonFile, setGeojsonFile] = useState(null);
    const [geojsonData, setGeojsonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGeojsonFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    // Extract geometry if it's a Feature or FeatureCollection
                    let geometry = json;
                    if (json.type === 'Feature') {
                        geometry = json.geometry;
                    } else if (json.type === 'FeatureCollection' && json.features.length > 0) {
                        geometry = json.features[0].geometry;
                    }
                    setGeojsonData(geometry);
                    setError(null);
                } catch (err) {
                    setError('Invalid GeoJSON file');
                    setGeojsonData(null);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.geojson')) {
            const fakeEvent = { target: { files: [file] } };
            handleFileChange(fakeEvent);
        } else {
            setError('Please drop a .geojson file');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.plotId || !formData.name || !formData.allotmentDate || !geojsonData) {
            setError('Please fill all fields and upload a GeoJSON file');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const uploadData = {
                plotId: formData.plotId,
                name: formData.name,
                allotmentDate: formData.allotmentDate,
                geojson: geojsonData
            };

            await plotAPI.upload(uploadData);

            setSuccess(true);
            setFormData({ plotId: '', name: '', allotmentDate: '' });
            setGeojsonFile(null);
            setGeojsonData(null);

            setTimeout(() => {
                setSuccess(false);
                onUploadSuccess?.();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload plot');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="plot-upload">
            <h2>Upload New Plot</h2>

            {success && (
                <div className="alert alert-success">
                    ✅ Plot uploaded successfully!
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    ❌ {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="plotId">Plot ID *</label>
                    <input
                        type="text"
                        id="plotId"
                        name="plotId"
                        value={formData.plotId}
                        onChange={handleInputChange}
                        placeholder="e.g., PLOT-001"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="name">Plot Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Industrial Plot A"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="allotmentDate">Allotment Date *</label>
                    <input
                        type="date"
                        id="allotmentDate"
                        name="allotmentDate"
                        value={formData.allotmentDate}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>GeoJSON Boundary *</label>
                    <div
                        className={`file-dropzone ${geojsonData ? 'has-file' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        {geojsonData ? (
                            <div className="file-info">
                                <span className="file-icon">📄</span>
                                <span className="file-name">{geojsonFile?.name || 'GeoJSON loaded'}</span>
                                <button
                                    type="button"
                                    className="btn-remove"
                                    onClick={() => {
                                        setGeojsonFile(null);
                                        setGeojsonData(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="upload-icon">📁</span>
                                <p>Drag and drop GeoJSON file here</p>
                                <p className="upload-hint">or</p>
                                <label htmlFor="file-input" className="btn btn-primary">
                                    Browse Files
                                </label>
                                <input
                                    type="file"
                                    id="file-input"
                                    accept=".geojson,.json"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading || !geojsonData}
                    style={{ width: '100%', marginTop: '1rem' }}
                >
                    {loading ? 'Uploading...' : '📤 Upload Plot'}
                </button>
            </form>
        </div>
    );
};

export default PlotUpload;
