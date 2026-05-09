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
const emit = defineEmits(['facility-hover', 'legend-data', 'legend-visibility']);
const gRef = useTemplateRef('g');
const label = 'healthcare';

// Configuration for symbols
const symbolMap = {
    'Hospital':             { char: 'H', color: '#d9534f' }, // Red
    'Pharmacy':             { char: 'P', color: '#5cb85c' }, // Green
    'EMS':                  { char: 'A', color: '#0275d8' }, // Blue (Ambulance)
    'Laboratory':           { char: 'L', color: '#f0ad4e' }, // Orange
    'Public Health':        { char: 'S', color: '#5bc0de' }, // Teal (Service)
    'Urgent Care':          { char: '+', color: '#663399' }, // Purple
    'VA Facility':          { char: 'V', color: '#292b2c' }, // Black
};

let isChecked = false;
let selection = null;
let gTag = null;

const legendArray = Object.entries(symbolMap).map(([type, data]) => ({
    label: type,
    color: data.color,
    char: data.char,
    type: 'symbol'
}));

const hooks = inject(registerKey)(label, {
    filter: {
        legibleLabel: 'Healthcare Facilities',
        defaultStatus: false,
        visibleStates: new Set([MapZoomLevel.COUNTY]),
        groups: [GroupType.OTHER],
        legend: legendArray,
        onChecked: () => {
            isChecked = true;
            if (props.properties.zoomState.value === MapZoomLevel.COUNTY) {
                if (selection) fadeIn(selection);
                emit('legend-visibility', true);
            }
        },
        onUnchecked: () => {
            isChecked = false;
            if (selection) fadeOut(selection);
            emit('legend-visibility', false);
            emit('facility-hover', null);
        },
    },
});

onMounted(() => {
    gTag = d3.select(gRef.value);
    const { result } = fetchGeojson(`${props.properties.path}/geojson/combined_healthcare.geojson`);
    renderToSVG(result);
    
    emit('legend-data', symbolMap); 
});

hooks.onZoomChange((newZoom) => {
    if (!selection) return;
    
    if (newZoom === MapZoomLevel.STATE) {
        fadeOut(selection);
        emit('legend-visibility', false);
        emit('facility-hover', null);
    } else if (newZoom === MapZoomLevel.COUNTY && isChecked) {
        fadeIn(selection);
        emit('legend-visibility', true);
    }
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

    const initialOpacity = (isChecked && props.properties.zoomState.value === MapZoomLevel.COUNTY) ? '100%' : '0%';

    selection = gTag.selectAll('.facility-group')
        .data(d.features)
        .join(
            enter => {
                const g = enter.append('g')
                    .attr('class', 'facility-group')
                    .attr('transform', f => {
                        if (!f.geometry || !f.geometry.coordinates) return `translate(-9999, -9999)`;
                        const p = props.properties.projection(f.geometry.coordinates);
                        if (!p) return `translate(-9999, -9999)`;
                        return `translate(${p[0]}, ${p[1]})`;
                    })
                    .attr('opacity', initialOpacity)
                    .on('mouseover', (event, f) => {
                        if (!isChecked) return;
                        emit('facility-hover', { props: f.properties, pos: { x: event.clientX, y: event.clientY } });
                    })
                    .on('mousemove', (event, f) => {
                        if (!isChecked) return;
                        emit('facility-hover', { props: f.properties, pos: { x: event.clientX, y: event.clientY } });
                    })
                    .on('mouseleave', () => {
                        emit('facility-hover', null);
                    });

                g.append('rect')
                    .attr('x', -1.5)
                    .attr('y', -1.5)
                    .attr('width', 3)
                    .attr('height', 3)
                    .attr('rx', 0.3)
                    .attr('fill', f => symbolMap[f.properties.healthcare_type]?.color ?? '#777');

                g.append('text')
                    .text(f => symbolMap[f.properties.healthcare_type]?.char ?? '?')
                    .attr('font-size', 2.2)
                    .attr('font-weight', 'bold')
                    .attr('fill', 'white')
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'central')
                    .attr('dy', 0.2);

                return g;
            },
            update => update.attr('opacity', initialOpacity),
            exit => exit.remove()
        );
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