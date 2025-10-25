<script>
/**
 * components/ViewTransition.vue
 *
 * Currently not used anywhere.
 * Intended to handle the viewBox transition.
 * Needs to watch for the svg element being created in the DOM.
 * Current functionality for the viewBox transition is handled in
 * components/BorderData.vue and components/ViewTransition.vue
 */
import * as d3 from 'd3';

export default {
    props: ["svgElement"],
    mounted() {
        // this.svgElement is not guaranteed to exist when this function is called.
        if (this.svgElement){
            d3.select(this.svgElement)
                .on("click", (eventName) => {
                    const [x, y] = d3.pointer(eventName);
                    d3.select(this.svgElement)
                        .transition()
                        .duration(750)
                            .attr("viewBox", String(x - 100) + " " + String(y - 50) + " 200 100");
                });
        }
        else{
            const unwatch = this.$watch('svgElement', () => {
                d3.select(this.svgElement)
                    .on("click", (eventName) => {
                        const [x, y] = d3.pointer(eventName);
                        d3.select(this.svgElement)
                            .transition()
                            .duration(750)
                                .attr("viewBox", String(x - 100) + " " + String(y - 50) + " 200 100");
                    });
                unwatch();
            });
        }
    }
}
</script>
