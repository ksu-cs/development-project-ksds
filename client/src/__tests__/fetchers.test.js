// Testing imports
import { test, expect } from 'vitest';

// Composable imports
import { fetchJson, fetchGeojson } from '@/utility/fetchers';

const server = 'http://localhost';
const port = '3000';

test('fetchGeojson', async () => {
	const sim_pop = 10;
	let result_array = [];
	let error_array = [];
	let data_array = [];

	for (let i = 0; i < sim_pop; i++) {
		result_array.push(
			fetchGeojson(
				`${server}:${port}/kansas/geojson/KSCounty_1860_GeoJSON.geojson`
			)
		);
	}

	for (let i = 0; i < sim_pop; i++) {
		await result_array[i].promise;
		let e = result_array[i].result.error.value;

		if (e == null) {
			data_array.push(1);
		} else {
			data_array.push(0);
			error_array.push(e);
		}
	}

	for (const e of error_array) {
		console.log(e);
	}

	const successes = data_array.reduce((partialSum, x) => partialSum + x, 0);

	let mean = successes / sim_pop;
	let sigma =
		data_array.reduce(
			(partialSum, x) => partialSum + Math.pow(x - mean, 2)
		) / sim_pop;
	let deviation = Math.sqrt(sigma);

	console.log(`Successes: ${successes} / ${sim_pop}`);
	console.log(`Mean: ${mean}`);
	console.log(`Standard Deviation: ${deviation}`);

	expect(successes).equal(10);
});

test('fetchJson', async () => {
	const sim_pop = 10;
	let result_array = [];
	let error_array = [];
	let data_array = [];

	for (let i = 0; i < sim_pop; i++) {
		result_array.push(
			fetchJson(
				`${server}:${port}/kansas/json/KSPopulation1970-2020ByCity.json`
			)
		);
	}

	for (let i = 0; i < sim_pop; i++) {
		await result_array[i].promise;
		let e = result_array[i].result.error.value;

		if (e == null) {
			data_array.push(1);
		} else {
			data_array.push(0);
			error_array.push(e);
		}
	}

	for (const e of error_array) {
		console.log(e);
	}

	const successes = data_array.reduce((partialSum, x) => partialSum + x, 0);

	let mean = successes / sim_pop;
	let sigma =
		data_array.reduce(
			(partialSum, x) => partialSum + Math.pow(x - mean, 2)
		) / sim_pop;
	let deviation = Math.sqrt(sigma);

	console.log(`Successes: ${successes} / ${sim_pop}`);
	console.log(`Mean: ${mean}`);
	console.log(`Standard Deviation: ${deviation}`);

	expect(successes).equal(10);
});
