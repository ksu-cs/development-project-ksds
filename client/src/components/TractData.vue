<template>
  <g></g>
</template>

<script>
import * as d3 from 'd3';

export default {
  props: ["svgElement", "projection", "zoomState"],
  methods: {
    renderData(data) {
      const pathGen = d3.geoPath(this.projection);

      d3.select(this.svgElement.value)
        .append("g")
        .classed("tracts", true)
        .selectAll(".tract")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", d => {
          d.geometry.coordinates[0].reverse();
          return pathGen(d);
        })
        .attr("opacity", 0) //initially hidden
        .classed("tract", true);
    }
  },
  watch: {
  zoomState(newVal) {
    const show = newVal === "zoomIn";

    d3.select(this.svgElement.value)
      .selectAll(".tract")
      .transition()
      .duration(300)
      .attr("opacity", show ? 1 : 0);
  }
},
  created() {
    fetch('/geojson/KSTracts_2000.geojson')
      .then(res => res.json())
      .then(geojson => {
        if (this.svgElement.value) {
          this.renderData(geojson);
        } else {
          const unwatch = this.$watch(() => this.svgElement.value, newVal => {
            if (newVal) {
              this.renderData(geojson);
              unwatch();
            }
          });
        }
      });
  }
};
</script>

<style scoped>
:global(.tract) {
  fill: none;
  stroke: purple;
  stroke-width: 1.5;
  pointer-events: none;
}
</style>