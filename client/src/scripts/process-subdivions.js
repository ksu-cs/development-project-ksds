import fs from 'fs';

const FILE_PATH = '/workspaces/development-project-ksds/server/public/kansas/geojson/KS_Cty_Sub_With_Pop.geojson';

const decadeKeys = [
    "AV0AA1970", 
    "AV0AA1980", 
    "AV0AA1990", 
    "AV0AA2000", 
    "AV0AA2010", 
    "AV0AA2020"
];

function processGeoJSON() {
    console.log("Reading GeoJSON.");
    if (!fs.existsSync(FILE_PATH)) {
        console.error("Error: File not found at", FILE_PATH);
        return;
    }

    const geojson = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

    const globalStats = {};
    decadeKeys.forEach(key => {
        globalStats[key] = { min: Infinity, max: -Infinity };
    });

    geojson.features.forEach(f => {
        decadeKeys.forEach(key => {
            const val = f.properties[key];
            if (val !== undefined && val !== null) {
                if (val < globalStats[key].min) globalStats[key].min = val;
                if (val > globalStats[key].max) globalStats[key].max = val;
            }
        });
    });

    // Cleanup Infinity values
    decadeKeys.forEach(key => {
        if (globalStats[key].min === Infinity) globalStats[key].min = 0;
        if (globalStats[key].max === -Infinity) globalStats[key].max = 0;
    });

    console.log("Global Stats Calculated:", globalStats);

    geojson.features.forEach(f => {
        if (f.geometry && f.geometry.type === "Polygon") {
            f.geometry.coordinates.forEach(ring => ring.reverse());
        } else if (f.geometry && f.geometry.type === "MultiPolygon") {
            f.geometry.coordinates.forEach(polygon => {
                polygon.forEach(ring => ring.reverse());
            });
        }

        // Inject the stats into properties
        f.properties['decade-stats'] = globalStats;
    });

    console.log("Saving updated GeoJSON.");
    fs.writeFileSync(FILE_PATH, JSON.stringify(geojson));
}

processGeoJSON();