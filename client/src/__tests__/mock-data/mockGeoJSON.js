// mockGeoJSON.js
// Mock data for testing purposes

export const mockPoints = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: {
				name: 'point 1',
				place: 'place 1',
			},
			geometry: {
				type: 'Point',
				coordinates: [102.0, 0.5],
			},
		},
		{
			type: 'Feature',
			properties: {
				name: 'point 2',
				place: 'place 2',
			},
			geometry: {
				type: 'Point',
				coordinates: [103.0, 1.0],
			},
		},
		{
			type: 'Feature',
			properties: {
				name: 'point 3',
				place: 'place 3',
			},
			geometry: {
				type: 'Point',
				coordinates: [104.0, 0.0],
			},
		},
	],
};

export const mockMultiPoints = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiPoint',
				coordinates: [
					[102.0, 0.0],
					[103.0, 1.0],
					[104.0, 0.0],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiPoint',
				coordinates: [
					[100.0, 0.0],
					[101.0, 1.0],
					[102.0, 2.0],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiPoint',
				coordinates: [
					[105.0, 1.0],
					[106.0, 2.0],
					[107.0, 3.0],
				],
			},
		},
	],
};

export const mockLineStrings = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: [
					[100.0, 0.0],
					[101.0, 1.0],
					[102.0, 2.0],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: [
					[103.0, 0.0],
					[104.0, 1.0],
					[105.0, 2.0],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: [
					[106.0, 0.0],
					[107.0, 1.0],
					[108.0, 2.0],
				],
			},
		},
	],
};

export const mockMultiLineStrings = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiLineString',
				coordinates: [
					[
						[100.0, 0.0],
						[101.0, 1.0],
					],
					[
						[102.0, 2.0],
						[103.0, 3.0],
					],
					[
						[104.0, 4.0],
						[105.0, 5.0],
					],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiLineString',
				coordinates: [
					[
						[106.0, 0.0],
						[107.0, 1.0],
					],
					[
						[108.0, 2.0],
						[109.0, 3.0],
					],
					[
						[110.0, 4.0],
						[111.0, 5.0],
					],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiLineString',
				coordinates: [
					[
						[112.0, 0.0],
						[113.0, 1.0],
					],
					[
						[114.0, 2.0],
						[115.0, 3.0],
					],
					[
						[116.0, 4.0],
						[117.0, 5.0],
					],
				],
			},
		},
	],
};

export const mockPolygons = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[100.0, 0.0],
						[101.0, 0.0],
						[101.0, 1.0],
						[100.0, 1.0],
						[100.0, 0.0],
					],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[102.0, 0.0],
						[103.0, 0.0],
						[103.0, 1.0],
						[102.0, 1.0],
						[102.0, 0.0],
					],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[104.0, 0.0],
						[105.0, 0.0],
						[105.0, 1.0],
						[104.0, 1.0],
						[104.0, 0.0],
					],
				],
			},
		},
	],
};

export const mockMultiPolygons = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiPolygon',
				coordinates: [
					[
						[
							[100.0, 0.0],
							[101.0, 0.0],
							[101.0, 1.0],
							[100.0, 1.0],
							[100.0, 0.0],
						],
					],
					[
						[
							[102.0, 0.0],
							[103.0, 0.0],
							[103.0, 1.0],
							[102.0, 1.0],
							[102.0, 0.0],
						],
					],
					[
						[
							[104.0, 0.0],
							[105.0, 0.0],
							[105.0, 1.0],
							[104.0, 1.0],
							[104.0, 0.0],
						],
					],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiPolygon',
				coordinates: [
					[
						[
							[106.0, 0.0],
							[107.0, 0.0],
							[107.0, 1.0],
							[106.0, 1.0],
							[106.0, 0.0],
						],
					],
					[
						[
							[108.0, 0.0],
							[109.0, 0.0],
							[109.0, 1.0],
							[108.0, 1.0],
							[108.0, 0.0],
						],
					],
					[
						[
							[110.0, 0.0],
							[111.0, 0.0],
							[111.0, 1.0],
							[110.0, 1.0],
							[110.0, 0.0],
						],
					],
				],
			},
		},
		{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiPolygon',
				coordinates: [
					[
						[
							[112.0, 0.0],
							[113.0, 0.0],
							[113.0, 1.0],
							[112.0, 1.0],
							[112.0, 0.0],
						],
					],
					[
						[
							[114.0, 0.0],
							[115.0, 0.0],
							[115.0, 1.0],
							[114.0, 1.0],
							[114.0, 0.0],
						],
					],
					[
						[
							[116.0, 0.0],
							[117.0, 0.0],
							[117.0, 1.0],
							[116.0, 1.0],
							[116.0, 0.0],
						],
					],
				],
			},
		},
	],
};
