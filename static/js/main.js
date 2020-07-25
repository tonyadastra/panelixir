'use strict';

// Init variables
let data = [];
let worldmap = null;
let bars = null;

d3.json('/load_data').then(d => {

    // Redefine "data"
    data = d.vaccines;

    // Instantiate Graph
    worldmap = new Worldmap(data, 'vis1');
    bars = new Bars(data, 'vis2')

}).catch(err => console.log(err));

