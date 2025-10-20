<script>
import RailroadData from './RailroadData.vue';
import * as d3 from 'd3';

export default {
    components: { RailroadData },
    data() {
        return {
            svg: null,
        };
    },
    mounted() {
        this.svg = this.$refs.svg
        this.projection = d3.geoAlbers().scale(10000).translate([1000, 250])
    }
}
</script>

<template>
    <div class="container">
        <svg ref="svg" width="1600" height="800"></svg>
        <RailroadData :svgElement="svg" :projection="projection" />
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: row;
}
</style>