'use strict';

// Init variables
let data = [];
// let bars_data = [];
let worldmap = null;
// let bars = null;

d3.json('/load_data').then(d => {

    // Redefine "data"
    data = d.vaccines;

    // Instantiate Graph
    worldmap = new Worldmap(data, 'vis1');

}).catch(err => console.log(err));

// d3.json('/get_bars_data').then(d => {
//
//     // Redefine "data"
//     bars_data = d.bars_data;
//
//     // Instantiate Graph
//     bars = new Bars(bars_data, 'vis2')
//
// }).catch(err => console.log(err));

