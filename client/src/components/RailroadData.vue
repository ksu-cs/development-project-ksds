<script>
/**
 * components/RailroadData.vue
 *
 * Fethces and renders all railroad data.
 * components/TimelineTransition.vue should handle
 * fading in and out the relevant railroad path elements
 */
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    methods: {
        renderData(data) {
        const pathGen = d3.geoPath(this.projection);

        // Create path elements for each railroad
        // Assign their stroke-opacity attribute based on
        // their InOpBy property and the year 1860
        d3.select(this.svgElement.value)
            .select("g.railroads")
            .selectAll(".rail")
            .data(data.features)
            .enter()
            .append("path")
                .attr("d", pathGen)
                .attr("stroke-opacity", d => d.properties.InOpBy <= 1860 ? "60%" : "0%")
                .classed("rail", true);
        }
    },
    created() {
        // fetch the geojson and then watch for the svg element
        // to become mounted, unless it's already mounted
        fetch('/geojson/railroads.geojson')
        .then(response => response.json())
        .then(geojson => {
            if (this.svgElement.value) {
                this.renderData(geojson);
            }
            else {
                const unwatch = this.$watch(() => this.svgElement.value,
                                            newValue => {
                                                if (newValue) {
                                                    this.renderData(geojson)
                                                    unwatch();
                                                }
                                            })
            }
        })
    }
}
</script>

<style scoped>
:global(.rail) {
    fill: none;
    stroke: green;
    stroke-width: 1;
    pointer-events: none;
}
</style>
