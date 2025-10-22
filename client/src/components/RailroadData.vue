<script>
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    async mounted() {
        const response = await fetch('/geojson/railroads.geojson');
        const data = await response.json();

        const pathGen = d3.geoPath(this.projection);

        d3.select(this.svgElement)
          .append("g")
          .classed("railroads", true)
          .selectAll(".rail")
          .data(data.features)
          .enter()
          .append("path")
            .attr("d", pathGen)
            .classed("rail", true);
    }
}
</script>

<style scoped>
:global(.rail) {
    fill: none;
    stroke: green;
    stroke-width: 1;
    stroke-opacity: 50%;
    pointer-events: none;
}
</style>