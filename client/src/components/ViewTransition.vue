<script>
import * as d3 from 'd3';

export default {
    props: ["svgElement"],
    mounted() {
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