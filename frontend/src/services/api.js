import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Plot APIs
export const plotAPI = {
    // Get all plots
    getAll: () => api.get('/plots'),

    // Get specific plot
    getById: (id) => api.get(`/plots/${id}`),

    // Upload new plot
    upload: (plotData) => api.post('/plots/upload', plotData),

    // Analyze plot
    analyze: (id, options = {}) => api.post(`/plots/${id}/analyze`, options),

    // Analyze custom area
    analyzeCustom: (geometry) => api.post('/plots/analyze-custom', { geometry }),

    // Analyze comparison between drawn polygon and reference plot
    analyzeComparison: (referencePlotId, drawnGeometry) =>
        api.post('/plots/analyze-comparison', { referencePlotId, drawnGeometry }),

    // Batch analyze all areas from registered-land vs occupied-land
    analyzeBatchComparison: (location = 'tilda') => api.post('/plots/analyze-batch-comparison', { location }),

    // Get report
    getReport: (id) => api.get(`/plots/${id}/report`),

    // Delete plot
    delete: (id) => api.delete(`/plots/${id}`),

    // Get statistics
    getStats: () => api.get('/plots/stats/summary'),

    // Get available locations
    getLocations: () => api.get('/plots/locations')
};

// Error interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;
