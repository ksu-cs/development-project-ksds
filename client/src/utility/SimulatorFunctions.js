// @utility/SimulatorFunctions.js

// External imports
/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
/* eslint-enable no-unused-vars */

// Utility imports
import { lerp } from './Interpolators';

/**
 * 
 * @param {d3.Selection} pointSelection The points to simulate
 * @returns {d3.Simulation} Simulation of the bubble plot
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
 * 
 * @param {d3.Selection} selection 
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