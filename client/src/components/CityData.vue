<script>
/**
 * components/CityData.vue
 *
 * Fetches and renders all cities in Kansas.
 * Currently filters by the top ten most populous cities to display city names
 *
 */
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    methods: {
        renderData(data) {
            const pathGen = d3.geoPath(this.projection).pointRadius(1.5)

            // Create path elements for city lon and lat coordinates
            d3.select(this.svgElement.value)
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

            // Project every city's lon and lat coordinates
            // pathGen does this already in the selection above
            // however, the next selection doesn't use pathGen
            data.features = data.features.map(feature => {
                feature.geometry.coordinates = this.projection(feature.geometry.coordinates);
                return feature;
            })

            // Create text elements for city names
            d3.select(this.svgElement.value)
                .select("g.cities")
                .selectAll(".city-name")
                .data(data.features)
                .enter()
                .filter(d => d.properties["Top Ten"])
                .append("text")
                    .attr("x", d => d.geometry.coordinates[0])
                    .attr("y", d => d.geometry.coordinates[1] - 2)
                    .property("textContent", d => d.properties["City Name"])
                    .classed("city-name", true);
        }
    },
    created() {
        // fetch the geojson and then watch for the svg element
        // to become mounted, unless it's already mounted
        fetch('/geojson/cities.geojson')
        .then(response => response.json())
        .then(geojson => {
            if (this.svgElement.value) {
                this.renderData(geojson);
            }
            else {
                const unwatch = this.$watch(() => this.svgElement.value,
                                            newValue => {
                                                if (newValue) {
                                                    this.renderData(geojson);
                                                    unwatch();
                                                }
                                            })
            }
        })
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
