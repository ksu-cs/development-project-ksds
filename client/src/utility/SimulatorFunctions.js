// @utility/SimulatorFunctions.js

// External imports
/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
/* eslint-enable no-unused-vars */

// Utility imports
import { lerp } from './Interpolators';

/**
 * Creates a simulation for a bubble plot using d3.js's force simulation
 * @param { d3.Selection } pointSelection The d3.js selection of points to
 * simulate.
 * @param { Number } minR the minimum radius for the nodes in the bubble plot.
 * @param { Number } maxR the maximum radius for the nodes in the bubble plot.
 * @returns { d3.Simulation } Simulation of the bubble plot
 */
export function createBubblePlotSimulation(pointSelection, minR, maxR) {
    let nodes = getNodes(pointSelection);

    return d3.forceSimulation(nodes)
        .alphaTarget(0.3)
        .velocityDecay(0.1)
        .force('x', d3.forceX((d) => d.origin.xProjected).strength(0.01))
        .force('y', d3.forceY((d) => d.origin.yProjected).strength(0.01))
        .force('collide', d3.forceCollide().radius((d) => lerp(minR, maxR, d.norm)).iterations(3))
}

/**
 * Extracts and processes node data from a d3.js selection.
 * @param { d3.Selection } selection The d3.js selection containing the nodes to
 * process
 * @returns { Array<Object> } An aray of node objects
 */
function getNodes(selection) {
    let nodes = [];
    let indx = 0;

    selection.each((d, i) => {
        if (!d.properties['pop-data'].valid) return;

        nodes.push({
            index: indx++,
            oldIndex: i,
            x: d.properties.origin.xProjected,
            y: d.properties.origin.yProjected,
            vx: 0,
            vy: 0,
            origin: {
                x: d.geometry.coordinates[0],
                y: d.geometry.coordinates[1],
                xProjected: d.properties.origin.xProjected,
                yProjected: d.properties.origin.yProjected,
            },
            norm: d.properties['pop-data'].norm,
            data: d,
        })
    })

    console.log(nodes);
    return nodes;
}