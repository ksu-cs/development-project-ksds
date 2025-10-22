<script>
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    async mounted() {
        const response = await fetch('/geojson/KSCounty_1950_GeoJSON.geojson');
        const data = await response.json();

        const pathGen = d3.geoPath(this.projection);

        d3.select(this.svgElement)
          .append("g")
          .classed("borders", true)
          .selectAll(".border")
          .data(data.features)
          .enter()
          .append("path")
            .attr("d", d => {
                d.geometry.coordinates[0].reverse();
                return pathGen(d)
            })
            .classed("border", true);
        
            d3.select(this.svgElement)
              .selectAll(".border")
              .on("click", (eventName) => {
                const bbox = eventName.target.getBBox();
                const boxString = String(bbox.x - 10) + " " +
                                  String(bbox.y - 10) + " " +
                                  String(bbox.width + 20) + " " +
                                  String(bbox.height + 20);

                d3.select(this.svgElement)
                  .transition()
                  .duration(750)
                    .attr("viewBox", boxString);
              })
    }
}
</script>

<style scoped>
:global(.border) {
    fill: none;
    stroke: black;
    stroke-width: 2;
    pointer-events: all;
}
</style>