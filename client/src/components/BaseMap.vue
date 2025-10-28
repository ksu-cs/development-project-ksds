<script>
/**
 * components/BaseMap.vue
 *
 * Contains the base svg element that all geojson data is rendered to.
 * Calls each Data component to fetch and render geojson data.
 */
import { ref } from 'vue';
import RailroadData from './RailroadData.vue';
import BorderData from './BorderData.vue';
import CityData from './CityData.vue';
import TimelineTransition from './TimelineTransition.vue';
import * as d3 from 'd3';

export default {
    components: {
        RailroadData,
        BorderData,
        CityData,
        TimelineTransition
    },
    data() {
        return {
            scale: 14000,
            translation: [1150, 375]
        }
    },
    created() {
        this.projection = d3.geoAlbers().scale(this.scale).translate(this.translation)
        // Will reference the svg element in the template
        // If svg is declared in data(), it will be unwrapped
        this.svg = ref(null);
    },
    mounted() {
        this.svg.value = this.$refs.svg;
    }
}
</script>

<template>
    <div class="container">
        <svg ref="svg" width="1200" height="800" viewBox="0 0 1600 800"></svg>
        <fieldset class="checkboxes">
            <legend>Filters:</legend>
            <label><input type="checkbox"> Filter 1</label>
            <label><input type="checkbox"> Filter 2</label>
            <label><input type="checkbox"> Filter 3</label>
            <label><input type="checkbox"> Filter 4</label>
        </fieldset>

        <!--Fetches and renders geojson data-->
        <RailroadData :svgElement="svg" :projection="projection" />
        <CityData :svgElement="svg" :projection="projection" />
        <BorderData :svgElement="svg" :projection="projection" />
        <TimelineTransition :svgElement="svg" :projection="projection" />
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
