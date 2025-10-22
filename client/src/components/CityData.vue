<script>
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    async mounted() {
        const response = await fetch('/geojson/cities.geojson');
        const data = await response.json();

        const pathGen = d3.geoPath(this.projection).pointRadius(1.5)

        d3.select(this.svgElement)
          .append("g")
            .classed("cities", true)
          .append("g")
            .classed("points", true)
          .selectAll(".city")
          .data(data.features)
          .enter()
          .append("path")
            .attr("d", pathGen)
            .classed("city", true);

        d3.select(this.svgElement)
          .select("g.cities")
          .append("g")
            .classed("city-names", true)
          .selectAll(".city-name")
          .data(data.features)
          .enter()
          .filter((d, i) => d.properties["Top Ten"])
          .append("text")
            .attr("x", d => this.projection(d.geometry.coordinates)[0])
            .attr("y", d => this.projection(d.geometry.coordinates)[1] - 2)
            .property("textContent", d => d.properties["City Name"])
            .classed("city-name", true);
    }
}
</script>

<style scoped>
:global(.city) {
    fill: red;
    pointer-events: none;
}

:global(.city-name) {
    font: italic 13px sans-serif;
    fill: blue;
}
</style>