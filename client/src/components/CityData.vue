<script setup>
	/**
	 * components/CityData.vue
	 * Responsible for all changes to the cities in BaseMap.vue
	 */

	// External imports
	import { defineProps, onMounted, useTemplateRef, watch, inject } from 'vue';
	import * as d3 from 'd3';

	// Utility imports
	import { fetchGeojson, fetchJson } from '../utility/fetchers';
	import { fadeIn, fadeOut } from '@/d3/transitions/fadeSelection';
	import { createTransition } from '@/d3/transitions/createTransition';
	import { registerKey } from '../utility/RegisterKey';

	// Enum imports
	import { MapZoomLevel } from '@/enums/MapZoomLevel';
	import { GroupType } from '@/enums/GroupType';

	// Define props, template refs, and emits
	const props = defineProps(['properties']);
	const gRef = useTemplateRef('g');

	// Define reactive variables

	// Define non-reactive variables
	const pathGen = d3.geoPath(props.properties.projection);
	const defaultYear = 1860;
	const label = 'cities';

	// Register this component
	const hooks = inject(registerKey)(label, {
		filter: {
			legibleLabel: 'Cities',
			defaultStatus: true,
			visibleStates: new Set([MapZoomLevel.STATE, MapZoomLevel.COUNTY]),
			groups: [GroupType.OTHER],
			onChecked: onChecked,
			onUnchecked: onUnchecked,
		},
	});

	// Points that represent each city
	let selectionPoints = null;
	// A 'hit-box' that is used to check if the user has hovered over a city
	let selectionBoxes = null;
	// The name of each city
	let selectionText = null;
	// The population count of each city
	let selectionPop = null;
	// Dictionary containing the population of each city
	let cityPops = null;
	let gTag = null;
	let hoverActive = true;
	let paths = {
		geojson: `${props.properties.path}/geojson`,
		json: `${props.properties.path}/json`,
		csv: `${props.properties.path}/csv`,
	};

	onMounted(() => {
		gTag = d3.select(gRef.value);
		const { result, promise } = fetchGeojson(
			`${paths.geojson}/KSPlace1900.geojson`
		);
		promise.then(() => {
			const pop_result = fetchJson(`${paths.json}/city-pops.json`);
			validatePopData(pop_result.result);
		});
		renderToSVG(result);
	});

	hooks.onZoomChange((newValue) => {
		switch (newValue) {
			case MapZoomLevel.STATE:
				createTransition(selectionPoints).attr(
					'd',
					pathGen.pointRadius(2)
				);
				selectionText
					.attr('font-size', '100%')
					.each((d, i, n) => centerText(d, i, n, 15))
					.attr('opacity', '0%');
				selectionPop
					.attr('font-size', '100%')
					.each((d, i, n) => centerText(d, i, n, 5))
					.attr('opacity', '0%');
				// Display town names on hover
				hoverActive = true;
				break;
			case MapZoomLevel.COUNTY:
				createTransition(selectionPoints).attr(
					'd',
					pathGen.pointRadius(1)
				);
				selectionText
					.attr('font-size', '30%')
					.each((d, i, n) => centerText(d, i, n, 3));
				selectionPop
					.attr('font-size', '30%')
					.each((d, i, n) => centerText(d, i, n, -5));

				fadeIn(selectionText);
				fadeIn(selectionPop);
				// Don't display town names on hover
				hoverActive = false;
				break;
		}
	});

	hooks.onYearChange((newValue) => {
		let fileName;
		if (newValue <= 1900) {
			fileName = `${paths.geojson}/KSPlace1900.geojson`;
		} else if (newValue >= 2010) {
			fileName = `${paths.geojson}/KSPlace2010.geojson`;
		} else {
			fileName = `${paths.geojson}/KSPlace${newValue}.geojson`;
		}

		const { result, promise } = fetchGeojson(fileName);
		promise.then(() => getTownPopByYear(newValue));
		renderToSVG(result);
	});

	hooks.onYearChange((newValue) => {
		// We only have town population data starting in 1970 until 2020
		if (newValue < 1970) {
			return;
		}

		selectionPop.each((d, i, n) => {
			let node = n[i];
			let city_name = d.name;
			let city_place = d.place;

			let key = null;

			if (Object.hasOwn(cityPops, city_name)) {
				key = city_name;
			} else if (Object.hasOwn(cityPops, city_place)) {
				key = city_place;
			} else {
				console.warn(
					`'${city_name}' or '${city_place}' has no corresponding record`
				);
			}

			if (key != null) {
				let pop = cityPops[key][newValue];
				if (pop == null) {
					console.warn(
						`'${key}' has a record but no population for '${newValue}'`
					);
				} else {
					node.textContent = String(pop);
				}
			}
		});
	});

	/**
	 * Waits for the fetched data to load. If the fetch failed,
	 * prints the error received. Populates selection by binding
	 * the data to path elements.
	 * @param result The object that holds the data, loading, and error properties
	 */
	function renderToSVG(result) {
		let d = result.data.value;
		let l = result.loading.value;
		let e = result.error.value;

		if (l) {
			// If data is still loading
			const unwatch = watch(
				() => result.loading.value,
				() => {
					renderToSVG(result);
					unwatch();
				}
			);
			return;
		} else if (e) {
			// If there was an error
			console.error(e);
			return;
		}
		selectionPoints = gTag
			.select('.points')
			.selectAll('.point')
			.data(d.features, (d) => d.properties.NAME)
			.join(
				(enter) =>
					enter
						.append('path')
						.attr('opacity', '0%')
						.classed('point', true),
				(update) => update,
				(exit) => fadeOut(exit).remove()
			);

		selectionBoxes = gTag
			.select('.points')
			.selectAll('.hitbox')
			.data(d.features, (d) => d.properties.NAME)
			.join(
				(enter) => {
					return enter
						.append('path')
						.attr('d', pathGen.pointRadius(5))
						.classed('hitbox', true);
				},
				(update) => update,
				(exit) => exit.remove()
			);

		// Project every city's (lon, lat) pair
		// pathGen does this for us, however,
		// we can't use pathGen here
		const projectedFeatures = d.features.map((feature) => {
			return {
				coordinates: props.properties.projection(
					feature.geometry.coordinates
				),
				name: feature.properties.NAME,
				place: feature.properties.PLACE,
			};
		});

		let textDict = {};
		let popDict = {};

		selectionText = gTag
			.select('.text')
			.selectAll('.name')
			.data(projectedFeatures, (d) => d.name)
			.join(
				(enter) => {
					return enter
						.append('text')
						.attr('x', (d) => d.coordinates[0])
						.attr('y', (d) => d.coordinates[1])
						.attr('font', 'italic 13px sans-serif')
						.attr('opacity', '0%')
						.property('textContent', (d) => d.name)
						.classed('name', true);
				},
				(update) => update,
				(exit) => fadeOut(exit).remove()
			)
			.each((d, i, n) => (textDict[d.name] = n[i])); // For quick access when setting up hover events.

		selectionPop = gTag
			.select('.text')
			.selectAll('.pop')
			.data(projectedFeatures, (d) => d.name)
			.join(
				(enter) => {
					return enter
						.append('text')
						.attr('x', (d) => d.coordinates[0])
						.attr('y', (d) => d.coordinates[1])
						.attr('font', 'italic 13px sans-serif')
						.attr('opacity', '0%')
						.property('textContent', '---')
						.classed('pop', true);
				},
				(update) => update,
				(exit) => fadeOut(exit).remove()
			)
			.each((d, i, n) => (popDict[d.name] = n[i]));

		// Setup events to display town name on hover
		selectionBoxes
			.on('mouseenter', (event, d) => {
				if (hoverActive) {
					fadeIn(d3.select(textDict[d.properties.NAME]));
					fadeIn(d3.select(popDict[d.properties.NAME]));
				}
			})
			.on('mouseleave', (event, d) => {
				if (hoverActive) {
					fadeOut(d3.select(textDict[d.properties.NAME]));
					fadeOut(d3.select(popDict[d.properties.NAME]));
				}
			});

		switch (props.properties.zoomState.value) {
			case 'state':
				selectionPoints.attr('d', pathGen.pointRadius(2));
				selectionText
					.attr('font-size', '100%')
					.each((d, i, n) => centerText(d, i, n, 16));
				selectionPop
					.attr('font-size', '100%')
					.each((d, i, n) => centerText(d, i, n, 5));
				fadeIn(selectionPoints);
				break;
			case 'county':
				selectionPoints.attr('d', pathGen.pointRadius(1));
				selectionText
					.attr('font-size', '30%')
					.each((d, i, n) => centerText(d, i, n, 3));
				selectionPop
					.attr('font-size', '30%')
					.each((d, i, n) => centerText(d, i, n, -5));
				fadeIn(selectionPoints);
				fadeIn(selectionText);
				fadeIn(selectionPop);
				break;
		}
	}

	/**
	 * Centers every text element horizontally at its x position and
	 * offsets it vertically by the given amount from its y position
	 * @param d The data for the current node
	 * @param i The index of the current node in the list of nodes
	 * @param n The list of all nodes
	 * @param dy The vertical offset (positive moves upward)
	 */
	function centerText(d, i, n, dy) {
		console.log(
			'here!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
		);
		console.log(n[i]);
		const bbox = n[i].getBBox();
		const originX = d.coordinates[0];
		const originY = d.coordinates[1];
		const centeredX = originX - bbox.width / 2;

		d3.select(n[i])
			.attr('x', String(centeredX))
			.attr('y', originY - dy);
	}

	function validatePopData(result) {
		let d = result.data.value;
		let l = result.loading.value;
		let e = result.error.value;

		if (l) {
			const unwatch = watch(
				() => result.loading.value,
				() => {
					validatePopData(result);
					unwatch();
				}
			);
		} else if (e) {
			console.warn(e);
		} else {
			cityPops = d;
			getTownPopByYear(defaultYear);
		}
	}

	/**
	 * Load in and create a dictionary with the county, city name, and city population
	 * by the given year. Delete the old dictionary??
	 * @param newValue The year selected
	 */
	//can also have the old value as an parameter if you want, otherwise just ignore
	function getTownPopByYear(newYear) {
		// We only have town population data starting in 1970 until 2020
		if (newYear < 1970) {
			return;
		}

		selectionPop.each((d, i, n) => {
			let node = n[i];
			let city_name = d.name;
			let city_place = d.place;

			let key = null;

			if (Object.hasOwn(cityPops, city_name)) {
				key = city_name;
			} else if (Object.hasOwn(cityPops, city_place)) {
				key = city_place;
			} else {
				console.warn(
					`'${city_name}' or '${city_place}' has no corresponding record`
				);
			}

			if (key != null) {
				let pop = cityPops[key][newYear];
				if (pop == null) {
					console.warn(
						`'${key}' has a record but no population for '${newYear}'`
					);
				} else {
					node.textContent = String(pop);
				}
			}
		});
	}

	function onChecked() {
		switch (props.properties.zoomState.value) {
			case MapZoomLevel.STATE:
				hoverActive = true;
				selectionPoints.attr('d', pathGen.pointRadius(2));
				selectionText
					.attr('font-size', '100%')
					.each((d, i, n) => centerText(d, i, n, 15))
					.attr('opacity', '0%');
				selectionPop
					.attr('font-size', '100%')
					.each((d, i, n) => centerText(d, i, n, 5))
					.attr('opacity', '0%');
				break;
			case MapZoomLevel.COUNTY:
				hoverActive = false;
				selectionPoints.attr('d', pathGen.pointRadius(1));
				selectionText
					.attr('font-size', '30%')
					.each((d, i, n) => centerText(d, i, n, 3));
				selectionPop
					.attr('font-size', '30%')
					.each((d, i, n) => centerText(d, i, n, -5));
				fadeIn(selectionText);
				fadeIn(selectionPop);
				break;
		}
		fadeIn(selectionPoints);
	}

	function onUnchecked() {
		hoverActive = false;
		fadeOut(selectionPoints);
		switch (props.properties.zoomState.value) {
			case MapZoomLevel.STATE:
				// Do nothing
				break;
			case MapZoomLevel.COUNTY:
				fadeOut(selectionText);
				fadeOut(selectionPop);
				break;
		}
	}
</script>

<template>
	<g class="cities" ref="g">
		<g class="points"></g>
		<g class="text"></g>
	</g>
</template>

<style scoped>
	:global(.point) {
		fill: red;
		pointer-events: none;
	}

	:global(.name) {
		fill: blue;
		pointer-events: none;
	}

	:global(.pop) {
		fill: blue;
		pointer-events: none;
	}

	:global(.hitbox) {
		fill: black;
		opacity: 0%;
		pointer-events: visible;
	}
</style>
