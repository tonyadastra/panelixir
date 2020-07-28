
window.addEventListener('storage', function () {
    // document.querySelector("button[data-value='val']").click();
    console.log("storeag change")
    var btn_group = document.getElementsByTagName('button');

    for (var i = 0, length = btn_group.length; i < length; i++) {
        var btn = btn_group[i];
        if (btn.value == localStorage.getItem('continent')) {
            btn.click();
            break;
        }
    }
})

map = {
    aInternal: 'World',
    aListener: function (val) { },
    set continent(val) {
        this.aInternal = val;
        this.aListener(val);
    },
    get continent() {
        return this.aInternal;
    },
    registerListener: function (listener) {
        this.aListener = listener;
    }
}


/** When page is loaded...**/
$(document).ready(function () {
    $(function () {
        $.ajax({
            url: "/load_data",
            type: "get",
            async: true,
            data: {},
            success: function (response) {
                window.map_response = JSON.parse(response).map_data.vaccines;
                var vac_country = window.map_response.map(d => d.country);

                var vac_stage = window.map_response.map(d => d.stage);

                /** Interactive Map Response **/
                let world = [];
                let names = [];
                let map_svgW = 650;
                let map_svgH = 600;

                // Tools
                let projection = d3.geoOrthographic()
                    .scale(300)
                    .rotate([100.5728366920307, -48])
                    .translate([map_svgW / 2, map_svgH / 2])
                    .clipAngle(90)
                    .precision(0.7);
                var path = d3.geoPath().projection(projection);
                var graticule = d3.geoGraticule();
                var colors = {
                    clickable: '#e3e2df', hover: '#bab2b5', clicked: "peachpuff",
                    clickhover: '#bab2b5', p0: '#c1c8e4', p1: '#84ceeb',
                    p2: '#5ab9ea', p3: '#88bdbc', p4: '#3aafa9'
                };

                // Set up the svg/g work space
                d3.select('#vis1').remove()
                var map = d3.select('#vis4')
                    .append('svg')
                    .attr('id', 'vis1')
                    .attr('width', map_svgW)
                    .attr('height', map_svgH)
                    .attr('class', "map")

                map.append("defs").append("path")
                    .datum({ type: "Sphere" })
                    .attr("id", "sphere")
                    .attr("d", path);

                map.append("use")
                    .attr("class", "stroke")
                    .attr("xlink:href", "#sphere");

                map.append("use")
                    .attr("class", "fill")
                    .attr("xlink:href", "#sphere");

                map.append("path")
                    .datum(graticule)
                    .attr("class", "graticule")
                    .attr("d", path);

                // filter unique countries with highest stage
                let vac_map = new Map();
                for (let i = 0; i < vac_country.length; i++) {
                    if (vac_country[i].includes(",")) {
                        let arr = vac_country[i].split(",")
                        arr.forEach(function (elem) {
                            if (!vac_map.get(elem.trim()) || vac_map.get(elem.trim()) < vac_stage[i]) {
                                vac_map.set(elem.trim(), vac_stage[i]);
                            }
                        });
                    } else {
                        if (!vac_map.get(vac_country[i]) || vac_map.get(vac_country[i]) < vac_stage[i]) {
                            vac_map.set(vac_country[i], vac_stage[i]);
                        }
                    }
                }
                // console.log(vac_map);

                // console.log(data);

                var files = ["/data/map.json", "/data/world-country-names.tsv"];

                Promise.all(files.map(url => d3.json(url))).then(function (values) {
                    world = values[0]
                    // console.log("map", values[0])
                    names = values[1]
                    // console.log(world)
                    // console.log("custom", world_continent)
                    var globe = { type: "Sphere" },
                        land = topojson.feature(world, world.objects.land),
                        countries = topojson.feature(world, world.objects.countries).features,
                        borders = topojson.mesh(world, world.objects.countries, function (a, b) { return a !== b; });

                    map.insert("path", ".graticule")
                        .datum(land)
                        .attr("class", "land")
                        .attr("d", path);

                    for (let i = 0; i < Object.values(names).length; i++) {
                        for (let j = 0; j < countries.length; j++) {

                            let continent;
                            if (countries[j].id == Object.values(names)[i].id) {
                                continent = Object.values(names)[i].continent_name;
                                // console.log("continent", continent)

                                let curr_color = colors.clickable;
                                let curr_stage = -1;
                                if (vac_map.get(Object.values(names)[i].name) !== undefined) {
                                    curr_stage = vac_map.get(Object.values(names)[i].name);
                                    // console.log(curr_stage);
                                    // console.log(Object.values(names)[i].name);
                                }

                                if (curr_stage === 0) {
                                    curr_color = colors.p0;
                                } else if (curr_stage === 1) {
                                    curr_color = colors.p1;
                                } else if (curr_stage === 2) {
                                    curr_color = colors.p2;
                                } else if (curr_stage === 3) {
                                    curr_color = colors.p3;
                                } else if (curr_stage === 4) {
                                    curr_color = colors.p4;
                                }
                                // console.log(j, Object.values(names)[i].name);


                                map.insert("path", ".graticule")
                                    .datum(countries[j])
                                    .attr("fill", curr_color)
                                    .attr("d", path)
                                    .attr("class", "clickable")
                                    .attr("data-country-id", j)
                                    .attr("continent", continent)
                                    .attr("countryname", Object.values(names)[i].name)
                                    .on("click", function () {
                                        var prev_color = colors.clickable;
                                        var prev_stage = -1;
                                        var temp;

                                        d3.selectAll(".clicked")
                                            .classed("clicked", false)
                                            .select(function () {
                                                // console.log(this)
                                                // console.log(d3.select(this).attr("countryname"));
                                                temp = vac_map.get(d3.select(this).attr("countryname"));
                                                prev_stage = temp === undefined ? -1 : temp;

                                                if (prev_stage == 0) {
                                                    prev_color = colors.p0;
                                                } else if (prev_stage == 1) {
                                                    prev_color = colors.p1;
                                                } else if (prev_stage == 2) {
                                                    prev_color = colors.p2;
                                                } else if (prev_stage == 3) {
                                                    prev_color = colors.p3;
                                                } else if (prev_stage == 4) {
                                                    prev_color = colors.p4;
                                                } else {
                                                    prev_color = colors.clickable;
                                                }
                                                d3.select(this).attr("fill", prev_color);
                                                // console.log("unselected", prev_stage, prev_color, d3.select(this).attr("countryname"));
                                            })

                                        // console.log("clicked", clicked, Object.values(names)[i].name, prev_stage, prev_color);

                                        map.continent = continent;
                                        localStorage.setItem('continent', continent);

                                        d3.selectAll("path").filter(function (d) {
                                            return d3.select(this).attr("continent") == continent;
                                        })
                                            .attr("fill", colors.clicked)
                                            .classed("clicked", true);

                                        // d3.select(this)
                                        //   .select(function () {
                                        //     d3.select(this).attr("fill", curr_color);
                                        //     console.log("unselected", prev_stage, prev_color, d3.select(this).attr("countryname"));
                                        //   });
                                        // .attr("fill", colors.clicked);

                                        (function transition() {
                                            d3.select(".clicked").transition()
                                                .duration(1000)
                                                .tween("rotate", function () {
                                                    var p = d3.geoCentroid(countries[d3.select(this).attr("data-country-id")]);
                                                    var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
                                                    var b = path.bounds(d3.select(this));
                                                    // console.log("bound", countries[d3.select(this).attr("data-country-id")])
                                                    var nextScale = projection.scale() * 1 / Math.max((b[1][0] - b[0][0]) / (300 / 2), (b[1][1] - b[0][1]) / (300 / 2));
                                                    var s = d3.interpolate(300, nextScale);
                                                    // console.log(projection.scale())
                                                    return function (t) {
                                                        // projection.rotate(r(t)).scale(s(t));
                                                        projection.rotate(r(t));
                                                        map.selectAll("path").attr("d", path);
                                                    }
                                                });
                                        })();
                                    })

                                    .on("mousemove", function () {
                                        var c = d3.select(this);
                                        if (c.classed("clicked")) {
                                            c.attr("fill", colors.clickhover);
                                        } else {
                                            // d3.selectAll("path").filter(function (d) {
                                            //   console.log(d3.select(this).attr("continent"))
                                            //   return d3.select(this).attr("continent") == continent;

                                            // })
                                            //   .attr("fill", colors.hover);
                                            // && d3.select(this).attr("data-country-id") != countries[j].id;
                                            // .classed("clicked", true);
                                            c.attr("fill", colors.hover);
                                        }
                                        // console.log("mouse move", Object.values(names)[i].name);
                                    })

                                    .on("mouseout", function () {
                                        var c = d3.select(this);

                                        if (c.classed("clicked")) {
                                            c.attr("fill", colors.clicked);
                                            // d3.selectAll("path").filter(function (d) {
                                            //   return d3.select(this).attr("continent") == continent;
                                            // })
                                            //   .attr("fill", colors.clicked);
                                            // console.log("clicked mouse out", Object.values(names)[i].name)
                                        } else {
                                            // console.log("unclicked mouse out", Object.values(names)[i].name)
                                            d3.select(this).attr("fill", curr_color);
                                        }
                                        // console.log("mouse out");
                                    });
                            }
                        }
                    }
                    map.insert("path", ".graticule")
                        .datum(borders)
                        .attr("class", "boundary")
                        .attr("d", path);

                    // return (world, names)

                });
            }
        })


        var btn_group = document.getElementsByTagName('button');
        for (var i = 0, length = btn_group.length; i < length; i++) {
            var btn = btn_group[i];
            if (btn.value == 'World') {
                btn.click();
                break;
            }
        }
    });

    // var continent = "World"
    // var processing = false;
    //     setTimeout(function () {
    //         if (!processing) {
    //             processing = true;
    //             $.ajax({
    //                 url: "/get_bars_data",
    //                 type: "get",
    //                 async: true,
    //                 data: { continent: continent },
    //                 success: function (response) {
    //                     /** Interactive Progress Response **/
    //                     var progress_response = JSON.parse(response).count
    //                     d3.selectAll('#progress0')
    //                         .transition()
    //                         .duration(100)
    //                         .textTween(function () {
    //                             return d3.interpolateRound(0, progress_response[0])

    //                         })
    //                         .ease(d3.easePolyOut.exponent(3))
    //                     d3.selectAll('#progress1')
    //                         .transition()
    //                         .duration(100)
    //                         .textTween(function () {
    //                             return d3.interpolateRound(0, progress_response[1])

    //                         })
    //                         .ease(d3.easePolyOut.exponent(3))
    //                     d3.selectAll('#progress2')
    //                         .transition()
    //                         .duration(100)
    //                         .textTween(function () {
    //                             return d3.interpolateRound(0, progress_response[2])

    //                         })
    //                         .ease(d3.easePolyOut.exponent(3))
    //                     d3.selectAll('#progress3')
    //                         .transition()
    //                         .duration(100)
    //                         .textTween(function () {
    //                             return d3.interpolateRound(0, progress_response[3])

    //                         })
    //                         .ease(d3.easePolyOut.exponent(3))
    //                     d3.selectAll('#progress4')
    //                         .transition()
    //                         .duration(100)
    //                         .textTween(function () {
    //                             return d3.interpolateRound(0, progress_response[4])

    //                         })
    //                         .ease(d3.easePolyOut.exponent(3))

    //                     /** Interactive Bars Response **/
    //                     // Call d3 function
    //                     // Change to new data
    //                     window.bars_data_response = JSON.parse(response).bars_data.bars_data
    //                     console.log(window.bars_data_response)
    //                     // Init variables, setup workspace
    //                     let svgW = 700;
    //                     let svgH = 360;
    //                     let gMargin = { top: 50, right: 25, bottom: 75, left: 75 };
    //                     // Define states, connect to colors
    //                     let states = ['Pre-Clinical', 'Phase I', 'Phase II', 'Phase III', 'Approval'];
    //                     // Define initial state, transition starts from 'Pre-Clinical'
    //                     let currentState = 'Pre-Clinical';
    //                     // Progress X position
    //                     let progressStart = 130;
    //                     // Single Stage Length
    //                     let segmentWidth = 95;

    //                     // Create svg workspace
    //                     svg = d3.select('#vis2')
    //                         .append('svg')
    //                         .attr('id', 'vis2')
    //                         .attr('width', svgW)
    //                         .attr('height', svgH);

    //                     // Map Colors with states
    //                     colorScale = d3.scaleOrdinal()
    //                         .domain(states)
    //                         .range(['#c1c8e4', '#84ceeb', '#5ab9ea',
    //                             '#88bdbc', '#3aafa9']);

    //                     // Map Variables (data)
    //                     let flagMap = window.bars_data_response.map(d => d.flag);
    //                     let companyMap = window.bars_data_response.map(d => d.company)
    //                     let stageMap = window.bars_data_response.map(d => d.stage)

    //                     for (let i = 0; i < stageMap.length; i++) {
    //                         if (stageMap[i] === 0) {
    //                             currentState = 'Pre-Clinical'
    //                         } else if (stageMap[i] === 1) {
    //                             currentState = 'Phase I'
    //                         } else if (stageMap[i] === 2) {
    //                             currentState = 'Phase II'
    //                         } else if (stageMap[i] === 3) {
    //                             currentState = 'Phase III'
    //                         } else if (stageMap[i] === 4) {
    //                             currentState = 'Approval'
    //                         }


    //                         svg.append('rect')
    //                             .attr('class', 'progress-rect')
    //                             .attr('fill', function () {
    //                                 return colorScale('Pre-Clinical');
    //                             })
    //                             .attr('height', 15)
    //                             .attr('width', function () {
    //                                 const index = states.indexOf('Pre-Clinical');
    //                                 // console.log(index)
    //                                 return (index + 1) * segmentWidth;
    //                             })
    //                             .attr('rx', 10)
    //                             .attr('ry', 10)
    //                             .attr('x', progressStart)
    //                             .attr('y', 50 + 60 * i)
    //                             .transition() // Apply transition
    //                             .duration(2000)
    //                             .attr('fill', function () {
    //                                 return colorScale(currentState);
    //                             })
    //                             .attr('width', function () {
    //                                 var index = states.indexOf(currentState);
    //                                 return (index + 1) * segmentWidth;
    //                             })
    //                             .delay(function (d, i) {
    //                                 return i * 200;
    //                             });

    //                         // Initial y coordinate of textbox
    //                         let yTrack = 45;

    //                         // Append textbox
    //                         svg.append("text")
    //                             .attr("x", 60)
    //                             .attr("y", yTrack + i * 60)
    //                             .attr("text-anchor", "middle")
    //                             .attr("font-family", "sans-serif")
    //                             .attr("font-size", "12px")
    //                             .attr("font-weight", "bold")
    //                             .text(companyMap[i])
    //                             .call(wrap, 120); // Function wrap makes sure that the text doesn't go out of limited width

    //                         let height = parseInt(svg.select('text').node().getBoundingClientRect().height);

    //                         svg.select('text').attr('transform', 'translate(0, ' + (-height / 2) + ')');

    //                         yTrack += (parseInt(height / 2) + 10);


    //                         function wrap(text, width) {
    //                             text.each(function () {
    //                                 let text = d3.select(this),
    //                                     words = text.text().split(/\s+/).reverse(),
    //                                     word,
    //                                     line = [],
    //                                     lineNumber = 0,
    //                                     lineHeight = 1.05, // ems
    //                                     x = text.attr("x"),
    //                                     y = text.attr("y"),
    //                                     dy = 1.05,
    //                                     tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
    //                                 while (word = words.pop()) {
    //                                     line.push(word);
    //                                     tspan.text(line.join(" "));
    //                                     if (tspan.node().getComputedTextLength() > width) {
    //                                         line.pop();
    //                                         tspan.text(line.join(" "));
    //                                         line = [word];
    //                                         tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
    //                                     }
    //                                 }
    //                             });
    //                         }

    //                         for (let a = 0; a < flagMap[i].length; a++) {
    //                             // if flagMap[i][a] is undefined
    //                             if (flagMap[i][a] !== '.') {
    //                                 for (let j = 0; j < flagMap[i][a].length; j++) {
    //                                     svg.append('svg:image')
    //                                         .attr('xlink:href', flagMap[i][a])
    //                                         .attr('height', 20)
    //                                         .attr('x', function () {
    //                                             const index = states.indexOf(currentState);
    //                                             // Add x values for multiple images
    //                                             return (index + 1) * segmentWidth + progressStart + 5 + a * 50;
    //                                         })
    //                                         .attr('y', 47.5 + 60 * i);
    //                                 }
    //                             }
    //                         }
    //                         // If single country
    //                         if (flagMap[i][0] === '.') {
    //                             svg.append('svg:image')
    //                                 .attr('xlink:href', flagMap[i])
    //                                 .attr('height', 20)
    //                                 .attr('x', function () {
    //                                     const index = states.indexOf(currentState);
    //                                     return (index + 1) * segmentWidth + progressStart + 5;
    //                                 })
    //                                 .attr('y', 47.5 + 60 * i);
    //                         }

    //                     }
    //                     // Append orange bar on the left
    //                     svg.append('rect')
    //                         .attr('class', 'border')
    //                         .attr('rx', 10)
    //                         .attr('ry', 10)
    //                         .attr('fill', 'orange')
    //                         .attr('height', 350)
    //                         .attr('width', 10)
    //                         .attr('x', progressStart - 5)
    //                         .attr('y', 10);
    //                 },
    //             });
    //         }
    //     }, 150)
    // });


    /** When Interactive Buttons are Clicked... **/
    $('.button-font').on('click', function () {
        var processing = false;
        var continent = $(this).data("value");
        setTimeout(function () {
            if (!processing) {
                processing = true;
                $.ajax({
                    url: "/get_bars_data",
                    type: "get",
                    async: true,
                    data: { continent: continent },
                    success: function (response) {

                        /** Interactive Progress Response **/
                        var progress_response = JSON.parse(response).count
                        d3.selectAll('#progress0')
                            .transition()
                            .duration(774)
                            .textTween(function () {
                                return d3.interpolateRound(0, progress_response[0])

                            })
                            .ease(d3.easePolyOut.exponent(3))
                        d3.selectAll('#progress1')
                            .transition()
                            .duration(774)
                            .textTween(function () {
                                return d3.interpolateRound(0, progress_response[1])

                            })
                            .ease(d3.easePolyOut.exponent(3))
                        d3.selectAll('#progress2')
                            .transition()
                            .duration(774)
                            .textTween(function () {
                                return d3.interpolateRound(0, progress_response[2])

                            })
                            .ease(d3.easePolyOut.exponent(3))
                        d3.selectAll('#progress3')
                            .transition()
                            .duration(774)
                            .textTween(function () {
                                return d3.interpolateRound(0, progress_response[3])

                            })
                            .ease(d3.easePolyOut.exponent(3))
                        d3.selectAll('#progress4')
                            .transition()
                            .duration(774)
                            .textTween(function () {
                                return d3.interpolateRound(0, progress_response[4])

                            })
                            .ease(d3.easePolyOut.exponent(3))


                        /** Interactive Bars Response **/
                        // Call d3 function
                        window.bars_data_response = JSON.parse(response).bars_data.bars_data
                        console.log(window.bars_data_response)
                        // clear vis2 workspace
                        d3.select('#vis2').remove()
                        let svgW = 700;
                        let svgH = 360;
                        let gMargin = { top: 50, right: 25, bottom: 75, left: 75 };
                        let states = ['Pre-Clinical', 'Phase I', 'Phase II', 'Phase III', 'Approval'];
                        let currentState = 'Pre-Clinical'
                        let progressStart = 130;
                        let segmentWidth = 95;
                        // vis3 replaces vis2 in position
                        svg = d3.select('#vis3')
                            .append('svg')
                            .attr('id', 'vis2')
                            .attr('width', svgW)
                            .attr('height', svgH);

                        colorScale = d3.scaleOrdinal()
                            .domain(states)
                            .range(['#c1c8e4', '#84ceeb', '#5ab9ea',
                                '#88bdbc', '#3aafa9']);

                        let flagMap = window.bars_data_response.map(d => d.flag);
                        let companyMap = window.bars_data_response.map(d => d.company)
                        let stageMap = window.bars_data_response.map(d => d.stage)

                        for (let i = 0; i < stageMap.length; i++) {
                            if (stageMap[i] === 0) {
                                currentState = 'Pre-Clinical'
                            } else if (stageMap[i] === 1) {
                                currentState = 'Phase I'
                            } else if (stageMap[i] === 2) {
                                currentState = 'Phase II'
                            } else if (stageMap[i] === 3) {
                                currentState = 'Phase III'
                            } else if (stageMap[i] === 4) {
                                currentState = 'Approval'
                            }

                            svg.append('rect')
                                .attr('class', 'progress-rect')
                                .attr('fill', function () {
                                    return colorScale('Pre-Clinical');
                                })
                                .attr('height', 15)
                                .attr('width', function () {
                                    const index = states.indexOf('Pre-Clinical');
                                    // console.log(index)
                                    return (index + 1) * segmentWidth;
                                })
                                .attr('rx', 10)
                                .attr('ry', 10)
                                .attr('x', progressStart)
                                .attr('y', 50 + 60 * i)
                                .transition()
                                .duration(2000)
                                .attr('fill', function () {
                                    return colorScale(currentState);
                                })
                                .attr('width', function () {
                                    var index = states.indexOf(currentState);
                                    return (index + 1) * segmentWidth;
                                })
                                .delay(function (d, i) {
                                    return i * 200;
                                });

                            let yTrack = 45;


                            svg.append("text")
                                .attr("x", 60)
                                .attr("y", yTrack + i * 60)
                                .attr("text-anchor", "middle")
                                .attr("font-family", "sans-serif")
                                .attr("font-size", "12px")
                                .attr("font-weight", "bold")
                                .text(companyMap[i])
                                .call(wrap, 120);

                            let height = parseInt(svg.select('text').node().getBoundingClientRect().height);

                            svg.select('text').attr('transform', 'translate(0, ' + (-height / 2) + ')');

                            yTrack += (parseInt(height / 2) + 10);


                            function wrap(text, width) {
                                text.each(function () {
                                    let text = d3.select(this),
                                        words = text.text().split(/\s+/).reverse(),
                                        word,
                                        line = [],
                                        lineNumber = 0,
                                        lineHeight = 1.05, // ems
                                        x = text.attr("x"),
                                        y = text.attr("y"),
                                        dy = 1.05,
                                        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
                                    while (word = words.pop()) {
                                        line.push(word);
                                        tspan.text(line.join(" "));
                                        if (tspan.node().getComputedTextLength() > width) {
                                            line.pop();
                                            tspan.text(line.join(" "));
                                            line = [word];
                                            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                                        }
                                    }
                                });
                            }

                            // Append Flag Image
                            // If multiple countries
                            for (let a = 0; a < flagMap[i].length; a++) {
                                // if flagMap[i][a] is undefined
                                if (flagMap[i][a] !== '.') {
                                    for (let j = 0; j < flagMap[i][a].length; j++) {
                                        svg.append('svg:image')
                                            .attr('xlink:href', flagMap[i][a])
                                            .attr('height', 20)
                                            .attr('x', function () {
                                                const index = states.indexOf(currentState);
                                                // Add x values for multiple images
                                                return (index + 1) * segmentWidth + progressStart + 5 + a * 50;
                                            })
                                            .attr('y', 47.5 + 60 * i);
                                    }
                                }
                            }
                            // If single country
                            if (flagMap[i][0] === '.') {
                                svg.append('svg:image')
                                    .attr('xlink:href', flagMap[i])
                                    .attr('height', 20)
                                    .attr('x', function () {
                                        const index = states.indexOf(currentState);
                                        return (index + 1) * segmentWidth + progressStart + 5;
                                    })
                                    .attr('y', 47.5 + 60 * i);
                            }

                        }
                        // Append orange bar
                        svg.append('rect')
                            .attr('class', 'border')
                            .attr('rx', 10)
                            .attr('ry', 10)
                            .attr('fill', 'orange')
                            .attr('height', 350)
                            .attr('width', 10)
                            .attr('x', progressStart - 5)
                            .attr('y', 10);




                        // d3.select(self.frameElement).style("height", svgH + "px");

                    },

                });
            }
        }, 150)
    });
});

map.registerListener(function (val) {
    console.log("listener change")
    var btn_group = document.getElementsByTagName('button');

    for (var i = 0, length = btn_group.length; i < length; i++) {
        var btn = btn_group[i];
        if (btn.value == val) {
            btn.click();
            break;
        }
    }
});

