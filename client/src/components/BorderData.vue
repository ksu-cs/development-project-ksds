<script>
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    async mounted() {
        const response = await fetch('/geojson/KSCounty_1950_GeoJSON.geojson');
        const data = await response.json();

        const pathGen = d3.geoPath(this.projection);

        d3.select(this.svgElement)
          .selectAll(".border")
          .data(data.features)
          .enter()
          .append("path")
            .attr("d", pathGen)
            .classed("border", true)
    }
}
</script>

<style scoped>
:global(.border) {
    fill: none;
    stroke: black;
    stroke-width: 1;
}
</style>