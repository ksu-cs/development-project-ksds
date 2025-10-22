<script>
import RailroadData from './RailroadData.vue';
import BorderData from './BorderData.vue';
import CityData from './CityData.vue';
import * as d3 from 'd3';

export default {
    components: {
        RailroadData,
        BorderData,
        CityData
    },
    data() {
        return {
            svg: null,
            projection: null,
        };
    },
    mounted() {
        this.svg = this.$refs.svg;
        this.projection = d3.geoAlbers().scale(14000).translate([1150, 375]).clipAngle(null);
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
        <RailroadData :svgElement="svg" :projection="projection" />
        <CityData :svgElement="svg" :projection="projection" />
        <BorderData :svgElement="svg" :projection="projection" />
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