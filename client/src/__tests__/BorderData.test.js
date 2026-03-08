// BorderData.test.js
// Unit tests for the BorderData component

// Testing imports
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { mockPolygons } from './mock-data/mockGeoJSON';

// External imports
import { ref } from 'vue';
import * as d3 from 'd3';

// Component imports
import BorderData from '@/components/BorderData.vue';

// Utility imports
import { registerKey } from '@/utility/RegisterKey';

// Enum imports
import { HookType } from '@/enums/HookType';
import { MapZoomLevel } from '@/enums/MapZoomLevel';

const svgNS = 'http://www.w3.org/2000/svg';

/**
 * Mocks the BaseMap.vue's HookObject, does nothing when a hook is called
 * @returns An object that mocks a HookObject
 */
function mockRegister() {
	const mockHooks = {};

	Object.keys(HookType).forEach((hook) => {
		mockHooks[hook] = () => {
			return;
		};
	});

	return mockHooks;
}

describe('BorderData.vue', () => {
	// Mock fetches to return mock data
	beforeEach(() => {
		global.fetch = vi.fn(() => {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockPolygons),
			});
		});
	});

	// Restore fetches after tests complete
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('Populates element with paths', async () => {
		const svg = document.createElementNS(svgNS, 'svg');
		const gEl = document.createElementNS(svgNS, 'g');
		document.body.appendChild(svg);
		svg.appendChild(gEl);
		const gTag = d3.select(gEl);

		const wrapper = mount(BorderData, {
			props: {
				properties: {
					inputValue: ref(null),
					zoomState: ref(MapZoomLevel.STATE),
					projection: d3
						.geoAlbers()
						.scale(14000)
						.translate([1150, 375]),
					bbox: { x: 0, y: 0, width: 1600, height: 800 },
					path: `/kansas/`,
				},
			},
			global: {
				provide: {
					[registerKey]: mockRegister,
				},
			},
		});
		wrapper.vm.gTag = gTag;

		// Wait for paths to render to DOM
		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();

		// Expect paths to match snapshot
		expect(gEl.outerHTML).toMatchSnapshot();
	});
});
