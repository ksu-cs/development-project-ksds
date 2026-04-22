from pathlib import Path
from os.path import join
import json
import logging
import pandas as pd

def setup_logger(log_dir: str) -> logging.Logger:
    """
    Configure and return a logger that logs to both console and file.
    """
    
    Path(log_dir).mkdir(exist_ok=True)
    
    logger = logging.getLogger("population_pipeline")
    logger.setLevel(logging.INFO)
    
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    
    file_handler = logging.FileHandler(join(log_dir, "pipeline.log"))
    file_handler.setFormatter(formatter)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

def normalize(value: float, min_val: float, max_val: float) -> float:
    """
    Normalize a value between 0 and 1
    """
    if min_val == max_val:
        return 0.0
    
    return (value - min_val) / (max_val - min_val)

def get_max(data: dict[str, dict[int, int]], year: int) -> int:
    """
    Get the maximum population for a given year across all counties.
    """
    return max(
        county[year]
        for county in data.values()
        if year in county
    )

def get_min(data: dict[str, dict[int, int]],  year: int) -> int:
    """
    Get the minimum population for a given year across all counties.
    """
    return min(
        county[year]
        for county in data.values()
        if year in county
    )

def main():
    """
    Pipeline:
    1. Read .xlsx files to build county population dictionary
    2. Read .geojson files and update with population data corresponding to their year
    3. Write updated .geojson files to output directory
    """
    INPUT_DIR = "input"
    OUTPUT_DIR = "output"
    LOG_DIR = "logs"
    
    logger = setup_logger(LOG_DIR)
    
    input_dir = Path(INPUT_DIR)
    Path(OUTPUT_DIR).mkdir(exist_ok=True)
    
    logger.info("Starting")
    
    # Mapping filename to population column
    pop_cols = {
        '1860 Population Data By County.xlsx': 'AG3001',
        '1870 Population Data By County.xlsx': 'AJR001',
        '1880 Population Data By County.xlsx': 'AOT001',
        '1890 Population Data By County.xlsx': 'AUM001',
        '1900 Population Data By County.xlsx': 'AYM001',
        '1910 Population Data By County.xlsx': 'A3Y002',
        '1920 Population Data By County.xlsx': 'A7L001',
        '1930 Population Data By County.xlsx': 'BDC001',
        '1940 Population Data By County.xlsx': 'BVU001',
        '1950 Population Data By County.xlsx': 'B1N001',
        '1960 Population Data By County.xlsx': 'B47001',
        '1970 Population Data By County.xlsx': 'CY7001',
        '1980 Population Data By County.xlsx': 'DTQ001',
        '1990 Population Data By County.xlsx': 'E8V001',
        '2000 Population Data By County.xlsx': 'FKJ003',
        '2020 Population Data By County.xlsx': 'VCG209',
    }
    
    # Step 1: Load .xlsx data
    county_data: dict[str, dict[int, int]] = {}
    
    for file in input_dir.glob("*.xlsx"):
        logger.info(f"Processing Excel file: {file.name}")
        
        try:
            df = pd.read_excel(file)
        except Exception as e:
            logger.error(f"Failed to read {file.name}: {e}")
            continue
        
        pop_col = pop_cols.get(file.name)
        if not pop_col:
            logger.warning(f"No population column mapping for {file.name}")
            continue
        
        for _, row in df.iterrows():
            try:
                if file.name == '2020 Population Data By County.xlsx':
                    county_key = row["AREAWATR"]
                    year = row["GISJOIN"]
                else:
                    county_key = row["COUNTY"]
                    year = row["YEAR"]
                
                county = county_data.setdefault(county_key, {})
                county[year] = row[pop_col]
            except KeyError as e:
                logger.warning(f"Missing column in {file.name}: {e}")
            except Exception as e:
                logger.warning(f"Error processing row in {file.name}: {e}")
    
    logger.info(f"Loaded population data for {len(county_data)} unique counties")
    
    
    
    # Step 2: Update .geojson files
    for file in input_dir.glob("*.geojson"):
        logger.info(f"Processing GeoJSON file: {file.name}")
        
        try:
            df = pd.read_json(file)
        except Exception as e:
            logger.error(f"Failed to read {file.name}: {e}")
            continue
        
        year = int(file.name[9:13])
        
        try:
            year_max = get_max(county_data, year)
            year_min = get_min(county_data, year)
        except ValueError:
            logger.warning(f"No population data available for year {year}")
            year_max, year_min = None, None
        
        for _, row in df.iterrows():
            try:
                county_name = row["features"]["properties"]["NHGISNAM"]
                year_data = county_data.get(county_name)
                
                if not year_data or year not in year_data:
                    row["features"]["properties"]["pop-data"] = {
                        "valid": False,
                    }
                    continue
                
                population = year_data[year]
                
                row["features"]["properties"]["pop-data"] = {
                    "valid": True,
                    "pop": population,
                    "max": year_max,
                    "min": year_min,
                    "norm": normalize(population, year_min, year_max),
                }
            except Exception as e:
                logger.error(f"Error processing feature in {file.name}: {e}")
    
    
    
        # Step 3: Write .geojson files to output
        # But first we have to reconstruct their format because I can't be bothered to
        # figure out how pandas is supposed to read in a geojson file instead of a json file
        logger.info("Reconstructing GeoJSON format")
        geojson = {
            "type": "FeatureCollection",
            "features": [
                feature["features"]
                for feature in df.to_dict(orient="records")
            ],
        }

        output_path = join(OUTPUT_DIR, file.name)

        try:
            with open(output_path, "w") as f:
                json.dump(geojson, f, indent=2)
            logger.info(f"Wrote output file: {output_path}")
        except Exception as e:
            logger.error(f"Failed to write {output_path}: {e}")
    
    logger.info("Finished")

if __name__ == "__main__":
    main()