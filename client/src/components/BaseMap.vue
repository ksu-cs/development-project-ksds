<script>
/**
 * components/BaseMap.vue
 *
 * Contains the base svg element that all geojson data is rendered to.
 * Calls each Data component to fetch and render geojson data.
 */
import { ref } from 'vue';
import * as d3 from 'd3';
import RailroadData from './RailroadData.vue';
import BorderData from './BorderData.vue';
import CityData from './CityData.vue';

export default {
    props: ["inputValue"],
    components: {
        RailroadData,
        BorderData,
        CityData
    },
    data() {
        return {
            projection: d3.geoAlbers().scale(14000).translate([1150, 375]),
        }
    },
    methods: {
        changeZoomLevel(zoomLevel, viewBox) {
            console.log(zoomLevel);
            this.svg.transition()
                .duration(750)
                .attr("viewBox", viewBox)
                .on("end", () => this.zoomState.value = zoomLevel);
        },
        onTransition(type, boxString) {
            if (boxString === this.svg.attr("viewBox")) {
                this.changeZoomLevel("state", "0 0 1600 800");
            } else {
                this.changeZoomLevel("county", boxString);
            }
        }
    },
    created() {
        this.zoomState = ref("state");
    },
    mounted() {
        this.svg = d3.select(this.$refs.svg);
    }
}
</script>

<template>
    <div class="container">
        <svg ref="svg" width="1200" height="800" viewBox="0 0 1600 800">
            <RailroadData :projection="projection" :inputValue="inputValue" :zoomState="zoomState" />
            <BorderData :projection="projection" :inputValue="inputValue" :zoomState="zoomState" @transition="onTransition"/>
            <CityData :projection="projection" :inputValue="inputValue" :zoomState="zoomState" />
        </svg>
        <fieldset class="checkboxes">
            <legend>Filters:</legend>
            <label><input type="checkbox"> Filter 1</label>
            <label><input type="checkbox"> Filter 2</label>
            <label><input type="checkbox"> Filter 3</label>
            <label><input type="checkbox"> Filter 4</label>
        </fieldset>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.checkboxes {
    display: flex;
    flex-direction: column;
}

.checkboxes label {
    padding: 5px 0px;
}
</style>
