from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from services.buildings import extract_buildings
import uvicorn
import os

app = FastAPI(
    title="Building Extraction API",
    description="API to extract building footprints from OpenStreetMap using OSMnx",
    version="1.0.0"
)

# Request Models
class BboxInput(BaseModel):
    north: float
    south: float
    east: float
    west: float

class PolygonInput(BaseModel):
    type: str = "Polygon"
    coordinates: list

class ExtractionRequest(BaseModel):
    type: str # 'bbox' or 'polygon'
    # Optional fields based on type
    north: Optional[float] = None
    south: Optional[float] = None
    east: Optional[float] = None
    west: Optional[float] = None
    geometry: Optional[Dict[str, Any]] = None

@app.get("/")
def read_root():
    return {"message": "Building Extraction Service is running"}

@app.post("/extract-buildings")
def extract_buildings_endpoint(request: ExtractionRequest):
    try:
        data = request.dict()
        
        # Validation
        if request.type == 'bbox':
            if None in [request.north, request.south, request.east, request.west]:
                 raise HTTPException(status_code=400, detail="Missing bbox coordinates")
        elif request.type == 'polygon':
            if not request.geometry:
                raise HTTPException(status_code=400, detail="Missing polygon geometry")
        else:
            raise HTTPException(status_code=400, detail="Invalid extraction type")

        result = extract_buildings(data)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
