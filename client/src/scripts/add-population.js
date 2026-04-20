import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const geojsonDir = '/workspaces/development-project-ksds/server/public/kansas/geojson';
const csvDir = '/workspaces/development-project-ksds/server/public/kansas/csv';

// Construct the full absolute file paths
const geojsonPath = path.join(geojsonDir, 'KS_Cty_Sub.geojson');
const csvPath = path.join(csvDir, 'KS Population and Rural_Urban Status 1970-2020 By City - Sheet1.csv');
const outputPath = path.join(geojsonDir, 'KS_Cty_Sub_With_Pop.geojson');

const popColumns = [
    'AV0AA1970', 'AV0AA1980', 'AV0AA1990', 
    'AV0AA2000', 'AV0AA2010', 'AV0AA2020'
];

const popMapping = {};

console.log("Reading CSV data from: " + csvPath);

// 1. Read the CSV and map CTY_SUBA -> Population Data
fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
        let cty_suba = row['CTY_SUBA'];
        
        if (cty_suba) {
            cty_suba = cty_suba.trim();
            const popData = {};
            
            // Extract population data for the specified columns
            popColumns.forEach(col => {
                const val = row[col] ? row[col].trim() : '';
                // Convert to integer if it's a valid number, otherwise set to null
                const parsedVal = parseInt(val, 10);
                popData[col] = isNaN(parsedVal) ? null : parsedVal;
            });
            
            popMapping[cty_suba] = popData;
        }
    })
    .on('end', () => {
        console.log(`Successfully mapped ${Object.keys(popMapping).length} population rows.`);
        processGeoJSON();
    })
    .on('error', (err) => {
        console.error("Error reading the CSV file:", err.message);
    });

// 2. Load and Update the GeoJSON file
function processGeoJSON() {
    console.log("Loading GeoJSON from: " + geojsonPath);
    
    fs.readFile(geojsonPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error: Could not read '${geojsonPath}'.`, err.message);
            return;
        }

        let geojsonData;
        try {
            geojsonData = JSON.parse(data);
        } catch (e) {
            console.error("Error parsing GeoJSON data. Ensure it is a valid JSON.", e.message);
            return;
        }

        console.log("Updating GeoJSON features...");
        let matchedCount = 0;
        let missingCount = 0;

        // Loop through features
        if (geojsonData.features) {
            geojsonData.features.forEach(feature => {
                const props = feature.properties || {};
                const cousubfp = props['COUSUBFP'] ? String(props['COUSUBFP']).trim() : '';

                if (popMapping[cousubfp]) {
                    // Update the feature's properties with the respective populations
                    Object.assign(props, popMapping[cousubfp]);
                    matchedCount++;
                } else {
                    missingCount++;
                }
            });
        }

        // 3. Save the updated GeoJSON to a new file
        console.log("Saving updated GeoJSON to: " + outputPath);
        
        // JSON.stringify(data, null, 0) keeps it on a single line (compact)
        fs.writeFile(outputPath, JSON.stringify(geojsonData), 'utf8', (err) => {
            if (err) {
                console.error("Error writing output file:", err.message);
                return;
            }
            console.log("--- Done ---");
            console.log(`Successfully added population data to ${matchedCount} subdivisions.`);
            if (missingCount > 0) {
                console.log(`Could not find matching CSV data for ${missingCount} subdivisions.`);
            }
            console.log(`File saved as: ${outputPath}`);
        });
    });
}