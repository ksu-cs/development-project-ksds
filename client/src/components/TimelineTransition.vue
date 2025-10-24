<script setup>
import * as d3 from 'd3';
import { defineProps, onMounted } from 'vue';

onMounted(() => {
    const slider = d3.select("#yearSlider");
    const label = d3.select("#yearLabel");

    console.log(slider);

    //Whenever the slider is moved, updates label and map
    slider.on("input", function() {
    const year = +this.value;
    label.text(year);
    updateMap(year);
    });
})

const props = defineProps(["svgElement", "projection"]);

async function updateRailroads(year) {
    const fileName = '/geojson/railroads.geojson';

    const response = await fetch(fileName);
    const data = await response.json();

    const pathGen = d3.geoPath(props.projection);

    d3.select(props.svgElement)
      .selectAll(".rail")
      .remove()
    
    d3.select(props.svgElement)
      .selectAll(".rail")
      .data(data.features)
      .enter()
      .filter(d => d.properties.InOpBy <= year)
      .append("path")
        .attr("d", pathGen)
        .classed("rail", true)
}

function updateMap(year) {
    updateRailroads(year);

    const fileName = `/geojson/KSCounty_${year}_GeoJSON.geojson`;

    d3.json(fileName).then(geoData => {

    const pathGen = d3.geoPath(props.projection);

    // JOIN new data
    const paths = d3.select(props.svgElement).select("g.borders").selectAll(".border")
      .data(geoData.features, d => d.properties.id); // key by id if available

    // remove old paths
    paths.exit().remove();

    //new paths
    paths.enter()
      .append("path")
      .attr("d", d => {
        d.geometry.coordinates[0].reverse();
        return pathGen(d);
      })
      .attr("stroke", "#333")
      .attr("opacity", 0)
      .classed("border", true)
      .transition()
      .duration(500)
      .attr("opacity", 1);

      d3.select(props.svgElement).select("g.borders")
        .selectAll(".border")
        .on("click", (eventName) => {
            const bbox = eventName.target.getBBox();
            const boxString = String(bbox.x - 10) + " " +
                              String(bbox.y - 10) + " " +
                              String(bbox.width + 20) + " " +
                              String(bbox.height + 20);
            console.log("clicked");
            var viewBox = d3.select(props.svgElement).attr("viewBox");

            if (boxString == viewBox) {
                d3.select(props.svgElement)
                  .transition()
                  .duration(750)
                    .attr("viewBox", "0 0 1600 800")
            }
            else {
                d3.select(props.svgElement)
                  .transition()
                  .duration(750)
                    .attr("viewBox", boxString);
                }
            });
    });
}
</script>