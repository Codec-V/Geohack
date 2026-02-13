import mongoose from 'mongoose';

const plotSchema = new mongoose.Schema({
  plotId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  allotmentDate: {
    type: Date,
    required: true
  },
  // GeoJSON boundary geometry
  boundary: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: Array,
      required: true
    }
  },
  // Area in square meters
  approvedArea: {
    type: Number,
    required: true
  },
  // Market value for financial calculations
  marketValuePerSqMeter: {
    type: Number,
    default: 5000 // Default value if not specified
  },
  // Latest analysis results
  latestAnalysis: {
    timestamp: Date,
    boundaryViolationScore: Number,
    unauthorizedConstructionScore: Number,
    utilizationScore: Number,
    finalRiskScore: Number,
    builtUpArea: Number,
    deviationArea: Number,
    deviationPercentage: Number,
    isVacant: Boolean,
    satelliteImageUrl: String,
    // Land usage classification
    usageClassification: {
      encroached: { area: Number, percentage: Number },
      partiallyConstructed: { area: Number, percentage: Number },
      vacant: { area: Number, percentage: Number },
      fullyConstructed: { area: Number, percentage: Number }
    },
    usageZones: Object // GeoJSON FeatureCollection
  },
  // Historical analysis records
  analysisHistory: [{
    timestamp: Date,
    boundaryViolationScore: Number,
    unauthorizedConstructionScore: Number,
    utilizationScore: Number,
    finalRiskScore: Number,
    builtUpArea: Number,
    deviationArea: Number,
    deviationPercentage: Number,
    isVacant: Boolean,
    usageClassification: {
      encroached: { area: Number, percentage: Number },
      partiallyConstructed: { area: Number, percentage: Number },
      vacant: { area: Number, percentage: Number },
      fullyConstructed: { area: Number, percentage: Number }
    }
  }]
}, {
  timestamps: true
});

// Add geospatial index for efficient queries
plotSchema.index({ boundary: '2dsphere' });

const Plot = mongoose.model('Plot', plotSchema);

export default Plot;
