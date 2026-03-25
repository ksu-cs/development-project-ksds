<script setup>
/**
 * components/HealthcareData.vue
 * Renders combined healthcare facilities using symbols.
 */
import { defineProps, onMounted, useTemplateRef, watch, inject, defineEmits } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from '@/utility/fetchers';
import { fadeOut, fadeIn } from '@/d3/transitions/fadeSelection';
import { registerKey } from '@/utility/RegisterKey';
import { MapZoomLevel } from '@/enums/MapZoomLevel';
import { GroupType } from '@/enums/GroupType';

const props = defineProps(['properties']);
const emit = defineEmits(['facility-hover']);
const gRef = useTemplateRef('g');
const label = 'healthcare';

// Configuration for symbols based on the healthcare_type property
const symbolMap = {
    'Hospital':             { char: 'H', color: '#d9534f' }, // Red
    'Pharmacy':             { char: 'P', color: '#5cb85c' }, // Green
    'EMS':                  { char: 'A', color: '#0275d8' }, // Blue (Ambulance)
    'Laboratory':           { char: 'L', color: '#f0ad4e' }, // Orange
    'Public Health':        { char: 'S', color: '#5bc0de' }, // Teal (Service)
    'Urgent Care':          { char: '+', color: '#663399' }, // Purple
    'VA Facility':          { char: 'V', color: '#292b2c' }, // Black
};

inject(registerKey)(label, {
    filter: {
        legibleLabel: 'Healthcare Facilities',
        defaultStatus: false,
        visibleStates: new Set([MapZoomLevel.COUNTY]),
        groups: [GroupType.OTHER],
        onChecked: () => fadeIn(selection),
        onUnchecked: () => fadeOut(selection),
    },
});

let selection = null;
let gTag = null;

onMounted(() => {
    gTag = d3.select(gRef.value);
    const { result } = fetchGeojson(`${props.properties.path}/geojson/combined_healthcare.geojson`);
    renderToSVG(result);
});

function renderToSVG(r) {
    const d = r.data.value;
    if (r.loading.value) {
        const unwatch = watch(() => r.loading.value, () => { renderToSVG(r); unwatch(); });
        return;
    }
    if (r.error?.value) {
        console.error("Healthcare GeoJSON load error:", r.error.value);
        return;
    }
    if (!d || !d.features) return;

    selection = gTag.selectAll('.facility-group')
        .data(d.features)
        .join('g')
        .attr('class', 'facility-group')
        .attr('transform', f => {
            if (!f.geometry || !f.geometry.coordinates) return `translate(-9999, -9999)`;
            const p = props.properties.projection(f.geometry.coordinates);
            if (!p) return `translate(-9999, -9999)`;
            return `translate(${p[0]}, ${p[1]})`;
        })
        .attr('opacity', '0%') // Starts hidden as defaultStatus is false
        .on('mouseover', (event, d) => {
            emit('facility-hover', { props: d.properties, pos: { x: event.clientX, y: event.clientY } });
        })
        .on('mousemove', (event, d) => {
            emit('facility-hover', { props: d.properties, pos: { x: event.clientX, y: event.clientY } });
        })
        .on('mouseleave', () => {
            emit('facility-hover', null);
        });

    // Background square
    selection.append('rect')
        .attr('x', -1.5)
        .attr('y', -1.5)
        .attr('width', 3)
        .attr('height', 3)
        .attr('rx', 0.3)
        .attr('fill', f => symbolMap[f.properties.healthcare_type]?.color ?? '#777');

    // Text symbol
    selection.append('text')
        .text(f => symbolMap[f.properties.healthcare_type]?.char ?? '?')
        .attr('font-size', 2.2) // Unitless SVG value prevents browser min-font-size overrides
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('dy', 0.2);
}
</script>

<template>
    <g class="healthcare" ref="g"></g>
</template>

<style scoped>
.facility-group {
    cursor: pointer;
}
</style>