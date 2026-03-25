import fs from 'fs';
import path from 'path';

const geojsonDir = '/workspaces/development-project-ksds/server/public/kansas/geojson';

function mergeHealthcareData() {
	const datasets = [
		{ name: 'EMSStations.geojson', type: 'EMS' },
		{ name: 'HospitalData.geojson', type: 'Hospital' },
		{ name: 'LabsData.geojson', type: 'Laboratory' },
		{ name: 'PharmacyData.geojson', type: 'Pharmacy' },
		{ name: 'PubHealthDpts.geojson', type: 'Public Health' },
		{ name: 'UrgentCareData.geojson', type: 'Urgent Care' },
		{ name: 'VeteranHealthFacilities.geojson', type: 'VA Facility' }
	];

	let combinedFeatures = [];

	datasets.forEach((source) => {
		const fullPath = path.join(geojsonDir, source.name);
		
		try {
			if (!fs.existsSync(fullPath)) {
				console.warn(`Skipping ${source.name}: File not found.`);
				return;
			}

			const rawData = fs.readFileSync(fullPath, 'utf8');
			const data = JSON.parse(rawData);

			const taggedFeatures = data.features.map((feature) => {
				const props = feature.properties;

				let lon = props.LONGITUDE ?? props.LONG ?? props.X;
				let lat = props.LATITUDE ?? props.LAT ?? props.Y;

				lon = parseFloat(lon);
				lat = parseFloat(lat);

				return {
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [lon, lat]
					},
					properties: {
						...props,
						healthcare_type: source.type,
						// Standardize name for hover/labels
						standard_name: props.NAME ?? props.Name ?? 'Unknown Facility'
					}
				};
			});

			const validFeatures = taggedFeatures.filter(
				(f) => !isNaN(f.geometry.coordinates[0]) && !isNaN(f.geometry.coordinates[1])
			);

			combinedFeatures = combinedFeatures.concat(validFeatures);
		} catch (err) {
			console.error(`Error processing ${source.name}:`, err.message);
		}
	});

	const mergedGeoJSON = {
		type: 'FeatureCollection',
		features: combinedFeatures
	};

	const outputPath = path.join(geojsonDir, 'combined_healthcare.geojson');
	
	try {
		fs.writeFileSync(outputPath, JSON.stringify(mergedGeoJSON, null, 2));
	} catch (err) {
		console.error(`Failed to write output file:`, err.message);
	}
}

mergeHealthcareData();