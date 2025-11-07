<script>
import * as d3 from 'd3';

export default {
    props: ["svgElement", "projection"],
    methods: {
        renderRailroads(geojson) {
            const pathGen = d3.geoPath(this.projection);

            // Create path elements for each railroad
            // Assign their stroke-opacity attribute based on
            // their InOpBy property and the year 1860
            d3.select(this.svgElement.value)
                .select("g.railroads")
                .selectAll(".rail")
                .data(geojson.features)
                .enter()
                .append("path")
                    .attr("d", pathGen)
                    .attr("stroke-opacity", d => d.properties.InOpBy <= 1860 ? "60%" : "0%")
                    .classed("rail", true);
        },
        renderCityPoints(geojson) {
            const pathGen = d3.geoPath(this.projection).pointRadius(1.5)

            // Create path elements for city lon and lat coordinates
            d3.select(this.svgElement.value)
                .select("g.cities")
                .select("g.points")
                .selectAll(".city")
                .data(geojson.features)
                .enter()
                .append("path")
                    .attr("d", pathGen)
                    .classed("city", true);
        },
        renderCityText(geojson) {
            // Project every city's lon and lat coordinates
            // pathGen would do this for us, however, the next
            // selection doesn't use pathGen
            const projectedFeatures = geojson.features.map(feature => {
                feature.geometry.coordinates = this.projection(feature.geometry.coordinates);
                return feature;
            })

            // Create text elements for city names
            d3.select(this.svgElement.value)
                .select("g.cities")
                .select("g.names")
                .selectAll(".city-name")
                .data(projectedFeatures)
                .enter()
                .append("text")
                    .attr("x", d => d.geometry.coordinates[0])
                    .attr("y", d => d.geometry.coordinates[1] - 5)
                    .attr("opacity", d => d.properties["Top Ten"] ? "100%" : "0%")
                    .attr("font", "italic 13px sans-serif")
                    .property("textContent", d => d.properties["City Name"])
                    .classed("city-name", true)
                .each((d, i, n) => {
                    const bbox = n[i].getBBox();
                    const originX = d.geometry.coordinates[0];
                    const centeredX = originX - (bbox.width / 2);

                    d3.select(n[i])
                            .attr("x", String(centeredX));
                });
        },
        renderBorders(geojson) {
            const pathGen = d3.geoPath(this.projection);

            // Create path elements for each polygon in the geojson data
            d3.select(this.svgElement.value)
            .select("g.borders")
            .selectAll(".border")
            .data(geojson.features, d => d.properties.id)
            .enter()
            .append("path")
                .attr("d", d => {
                    // d3 expects the reverse of the winding that geojson uses
                    d.geometry.coordinates[0].reverse();
                    return pathGen(d)
                })
                .attr("stroke-width", "2")
                .classed("border", true);

            // Create onClick handlers to add zoom in and out functionality
            d3.select(this.svgElement.value)
                .selectAll(".border")
                .on("click", (eventName) => {
                    const bbox = eventName.target.getBBox();
                    const boxString = String(bbox.x - 10) + " " +
                                    String(bbox.y - 10) + " " +
                                    String(bbox.width + 20) + " " +
                                    String(bbox.height + 20);

                    var viewBox = d3.select(this.svgElement.value).attr("viewBox");

                    // Sets default viewBox specified in components/BaseMap.vue
                    if (boxString == viewBox) {
                        d3.select(this.svgElement.value)
                            .transition()
                            .duration(750)
                                .attr("viewBox", "0 0 1600 800") // TODO: Move default viewBox to a global parameter or prop
                            .on("end", () => {
                                this.$emit("changeZoom", "state")
                                this.$emit("zoomState", "zoomOut")
                            });
                        
                    }
                    else {
                        d3.select(this.svgElement.value)
                            .transition()
                            .duration(750)
                                .attr("viewBox", boxString)
                            .on("end", () =>{
                                this.$emit("changeZoom", "county")
                                this.$emit("zoomState", "zoomIn")
                            });
                    }
                })
        }
    },
    created() {
        // Fetch railroad data
        fetch('/geojson/railroads.geojson')
        .then(response => response.json())
        .then(json => {
            if (this.svgElement.value) {
                this.renderRailroads(json);
            }
            else {
                const unwatch = this.$watch(() => this.svgElement.value, 
                                            newValue => {
                                                if (newValue) {
                                                    this.renderRailroads(json);
                                                    unwatch();
                                                }
                                            })
            }
        })

        // Fetch city data
        fetch('/geojson/cities.geojson')
        .then(response => response.json())
        .then (json => {
            if (this.svgElement.value) {
                this.renderCityPoints(json);
                this.renderCityText(json);
            }
            else {
                const unwatch = this.$watch(() => this.svgElement.value,
                                            newValue => {
                                                if (newValue) {
                                                    this.renderCityPoints(json);
                                                    this.renderCityText(json);
                                                    unwatch();
                                                }
                                            })
            }
        })

        // Fetch Border data
        fetch('/geojson/KSCounty_1860_GeoJSON.geojson')
        .then(response => response.json())
        .then(json => {
            if (this.svgElement.value) {
                this.renderBorders(json);
            }
            else {
                const unwatch = this.$watch(() => this.svgElement.value,
                                            newValue => {
                                                if (newValue) {
                                                    this.renderBorders(json);
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

:global(.city) {
    fill: red;
    pointer-events: none;
}

:global(.city-name) {
    fill: blue;
    pointer-events: none;
}

:global(.border) {
    fill: none;
    stroke: black;
    pointer-events: all;
}
</style>