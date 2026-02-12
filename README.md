# GeoCompliance 🛰️

**Satellite-Powered Compliance Intelligence Platform**

Automated industrial land monitoring system that reduces drone dependency by automating violation detection using Sentinel-2 satellite imagery and GIS analysis.

## 🎯 Problem Statement

CSIDC currently relies on:
- Expensive drone surveys (infrequent)
- Manual map overlays
- Manual violation detection
- Weeks to take action

**Result**: Delayed detection, financial loss, inefficient monitoring

## 💡 Solution

GeoCompliance automates land monitoring using:
- Satellite imagery (Sentinel-2)
- GIS boundary analysis
- Automated violation scoring
- Real-time dashboard

## ✨ Features

### Core Functionality
- ✅ **Plot Boundary Management** - Upload and store GeoJSON boundaries
- ✅ **Satellite Integration** - Fetch latest Sentinel-2 imagery
- ✅ **Automated Analysis Engine**
  - Boundary deviation detection
  - Built-up area detection (NDBI)
  - Vacant plot detection
  - Violation scoring (0-100)
- ✅ **Interactive Dashboard** - Real-time statistics and risk distribution
- ✅ **Map Visualization** - Color-coded plots (green/yellow/red)
- ✅ **PDF Report Generation** - Detailed violation reports

## 🏗️ Architecture

```
GeoCompliance/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── server.js    # Express server
│   └── package.json
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── services/    # API client
│   │   └── App.jsx      # Main app
│   └── package.json
└── demo-data/           # Sample GeoJSON files
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or cloud)
- npm or yarn

### Installation

1. **Clone and navigate to project**
```bash
cd Geohack
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**
```bash
cd ../backend
# Copy .env.example to .env
# Update MongoDB URI if needed (default: mongodb://localhost:27017/geocompliance)
```

5. **Start MongoDB** (if running locally)
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

## 📖 Usage Guide

### 1. Upload a Plot
- Click "➕ Upload Plot" button
- Fill in plot details (ID, name, allotment date)
- Drag and drop a GeoJSON file or browse
- Click "Upload Plot"

Sample GeoJSON files are available in `demo-data/` folder.

### 2. View Dashboard
- See total plots, violations, and risk distribution
- Monitor high-risk plots
- Track vacant plots

### 3. Analyze a Plot
- Click on any plot card or map marker
- Click "🔍 Run Analysis" button
- View violation scores and metrics
- Generate PDF report

### 4. Map View
- Switch to "🗺️ Map View" tab
- Color-coded plots:
  - 🟢 Green: Low risk (0-39)
  - 🟡 Yellow: Medium risk (40-69)
  - 🔴 Red: High risk (70-100)
  - ⚪ Gray: Not analyzed

## 🔧 API Endpoints

### Plots
- `GET /api/plots` - Get all plots
- `GET /api/plots/:id` - Get specific plot
- `POST /api/plots/upload` - Upload new plot
- `POST /api/plots/:id/analyze` - Analyze plot
- `GET /api/plots/:id/report` - Generate PDF report
- `GET /api/plots/stats/summary` - Get dashboard statistics

### Health Check
- `GET /api/health` - API health status

## 📊 Analysis Metrics

### Violation Scores (0-100)
1. **Boundary Violation Score** - Deviation from approved boundary
2. **Unauthorized Construction Score** - Construction outside boundary
3. **Utilization Score** - Plot usage efficiency
4. **Final Risk Score** - Weighted average of all scores

### Calculations
- **Boundary Deviation**: Polygon intersection analysis
- **Built-up Detection**: NDBI (Normalized Difference Built-up Index)
- **Vacant Detection**: Built-up area < 10% threshold

## 🎨 Technology Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Turf.js (geospatial calculations)
- PDFKit (report generation)

### Frontend
- React + Vite
- Leaflet.js (map rendering)
- Chart.js (visualizations)
- Axios (API client)

## 📈 Impact

- ✅ **50%+ reduction** in drone dependency
- ✅ **Near real-time** violation detection
- ✅ **Automated** analysis and reporting
- ✅ **Scalable** across multiple regions

## 🔮 Future Enhancements

- Historical timeline change detection
- Automated email/SMS alerts
- Integration with lease payment database
- AI-based encroachment prediction
- Multi-region support
- Mobile app

## 👥 Team

Built for CSIDC Hackathon 2026

## 📄 License

MIT License

---

**GeoCompliance** - Reducing drone dependency through satellite-powered intelligence 🛰️
