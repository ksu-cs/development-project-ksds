<script>
/**
 * components/BorderData.vue
 *
 * Fetches and renders Kansas County border data from 1860
 * and renders it to the base svg element in the DOM.
 */
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    async mounted() {
        const response = await fetch('/geojson/KSCounty_1860_GeoJSON.geojson');
        const data = await response.json();

        const pathGen = d3.geoPath(this.projection);

        // Create path elements for each polygon in the geojson data
        d3.select(this.svgElement)
          .append("g")
          .classed("borders", true)
          .selectAll(".border")
          .data(data.features)
          .enter()
          .append("path")
            .attr("d", d => {
                // d3 expects the reverse of the winding that geojson uses
                d.geometry.coordinates[0].reverse();
                return pathGen(d)
            })
            .classed("border", true);

        // Create onClick handlers to add zoom in and out functionality
        d3.select(this.svgElement)
          .selectAll(".border")
          .on("click", (eventName) => {
            const bbox = eventName.target.getBBox();
            const boxString = String(bbox.x - 10) + " " +
                              String(bbox.y - 10) + " " +
                              String(bbox.width + 20) + " " +
                              String(bbox.height + 20);

            var viewBox = d3.select(this.svgElement).attr("viewBox");

            // Sets default viewBox specified in components/BaseMap.vue
            if (boxString == viewBox) {
              d3.select(this.svgElement)
                .transition()
                .duration(750)
                  .attr("viewBox", "0 0 1600 800") // TODO: Move default viewBox to a global parameter or prop
            }
            else {
              d3.select(this.svgElement)
                .transition()
                .duration(750)
                  .attr("viewBox", boxString);
            }
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
