'use strict';

// Init variables
let data = [];
let worldmap = null;

d3.json('/load_data').then(d => {

    // Redefine "data"
    data = d.vaccines;

    // Instantiate Graph
    worldmap = new Worldmap(data, 'vis1');
    console.log(worldmap);

}).catch(err => console.log(err));