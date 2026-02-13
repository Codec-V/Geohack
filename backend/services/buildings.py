import osmnx as ox
import geopandas as gpd
from shapely.geometry import Polygon, box
import json
import os

def extract_buildings(aoi_data):
    """
    Extracts building footprints from OpenStreetMap for a given Area of Interest (AOI).

    Args:
        aoi_data (dict): Dictionary containing AOI definition.
                         Can be {'type': 'bbox', 'north': ..., 'south': ..., 'east': ..., 'west': ...}
                         OR {'type': 'polygon', 'geometry': {...}}
    
    Returns:
        dict: GeoJSON FeatureCollection of building footprints.
    """
    try:
        # Define tags to filter for buildings
        tags = {"building": True}
        
        gdf = None

        if aoi_data.get("type") == "bbox":
            north = aoi_data["north"]
            south = aoi_data["south"]
            east = aoi_data["east"]
            west = aoi_data["west"]
            
            # Fetch features from BBOX
            gdf = ox.features.features_from_bbox(bbox=(north, south, east, west), tags=tags)
            
        elif aoi_data.get("type") == "polygon":
            # Handle GeoJSON Polygon
            geom = aoi_data["geometry"]
            polygon = Polygon(geom["coordinates"][0])
            
            # Fetch features from Polygon
            gdf = ox.features.features_from_polygon(polygon, tags=tags)
            
        else:
            raise ValueError("Invalid AOI type. Must be 'bbox' or 'polygon'.")

        if gdf is None or gdf.empty:
            return {"type": "FeatureCollection", "features": []}

        # Ensure CRS is EPSG:4326 for GeoJSON output
        if gdf.crs != "EPSG:4326":
            gdf = gdf.to_crs("EPSG:4326")

        # Select relevant columns if available, to keep output clean
        columns_to_keep = ['geometry', 'building']
        available_columns = [col for col in columns_to_keep if col in gdf.columns]
        gdf = gdf[available_columns]

        # Convert to GeoJSON
        geojson_str = gdf.to_json()
        geojson_data = json.loads(geojson_str)

        # Save to file (optional, based on requirements)
        output_file = os.path.join(os.path.dirname(__file__), "..", "buildings.geojson")
        gdf.to_file(output_file, driver='GeoJSON')
        
        return geojson_data

    except Exception as e:
        print(f"Error extracting buildings: {str(e)}")
        # Return empty collection on error or re-raise
        raise e
