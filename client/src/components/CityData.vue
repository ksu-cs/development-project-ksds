<script>
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    async mounted() {
        const response = await fetch('/geojson/cities.geojson');
        const data = await response.json();

        const pathGen = d3.geoPath(this.projection).pointRadius(1.5)

        d3.select(this.svgElement)
          .selectAll(".city")
          .data(data.features)
          .enter()
          .append("path")
            .attr("d", pathGen)
            .classed("city", true)
    }
}
</script>

<style scoped>
:global(.city) {
    fill: red;
}
</style>