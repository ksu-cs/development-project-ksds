<script setup>
import { defineProps, onMounted, useTemplateRef, watch, ref } from 'vue';
import * as d3 from 'd3';
import { fetchGeojson } from './fetchGeojson';

const props = defineProps(["projection", "inputValue", "zoomState"]);
const pathGen = d3.geoPath(props.projection);
const gRef = useTemplateRef("g");

let opacity = "0%";
let selection = null;
let gTag = null;

onMounted(() => {
  let result = {
    data: ref(null),
    loading: ref(null),
    error: ref(null)
  }
  gTag = d3.select(gRef.value);
  fetchGeojson("KSTracts_2000.geojson", result);
  validateData(result);
});

watch(() => props.zoomState.value, onZoom);

function validateData(r) {
  let d = r.data.value;
  let l = r.loading.value;
  let e = r.error.value;

  if (l) {
    // Watch for the data to load
    const unwatch = watch(() => r.loading.value, () => { validateData(r); unwatch() });
  } else if (e) {
    console.log(e);
  } else {
    console.log("draw tracts");
    // Create tract path elements bound to data.
    selection = gTag.selectAll(".tract")
                      .data(d.features)
                      .enter()
                      .append("path")
                        .attr("d", d => {
                          d.geometry.coordinates[0].reverse();
                          return pathGen(d);
                        })
                        .attr("opacity", opacity)
                        .classed("tract", true);
  }
}

function onZoom(state) {
  switch (state) {
    case "state":
      opacity = "0%";
      break;
    case "county":
      opacity = "100%";
      break;
  }
  selection.transition()
      .duration(200)
      .attr("opacity", opacity);
}
</script>

<template>
  <g class="tracts" ref="g"></g>
</template>

<style scoped>
:global(.tract) {
  fill: none;
  stroke: #ffc5d3;
  stroke-width: 0.5;
  pointer-events: none;
  stroke-dasharray: 2 4;
}
</style>