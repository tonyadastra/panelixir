var world_continents = {
    aInternal: "World",
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

world_continents.registerListener(function (val) {
    if (needs_update) {
        var btn_group = document.getElementsByTagName('button');
        processing = true;

        for (var i = 0, length = btn_group.length; i < length; i++) {
            var btn = btn_group[i];
            if (btn.value === val) {
                btn.click();
                break;
            }
        }
    }
});

// function resize() {
    // var div_s = document.getElementsByClassName("modal_container")[0];
    // var btn1_s = document.getElementsByClassName("btn-stage")[1];
    // var btn2_s = document.getElementsByClassName("btn-country")[1];
    // var btn3_s = document.getElementsByClassName("btn-types")[1];
    // var div_clear_s = document.getElementsByClassName("clear_filter")[1];
    //
    // var div_l = document.getElementsByClassName("dropdown")[0];
    // var btn1_l = document.getElementsByClassName("btn-stage")[0];
    // var btn2_l = document.getElementsByClassName("btn-country")[0];
    // var btn3_l = document.getElementsByClassName("btn-types")[0];
    // var div_clear_l = document.getElementsByClassName("clear_filter")[0];
    // if (window.screen.width <= 425) {
    //     $(div_s).show();
    //     $(btn1_s).show();
    //     $(btn2_s).show();
    //     $(btn3_s).show();
    //     $(div_clear_s).show();
    //
    //     $(div_l).hide();
    //     $(btn1_l).hide();
    //     $(btn2_l).hide();
    //     $(btn3_l).hide();
    //     $(div_clear_l).hide();
    //
    //     var modal1 = document.getElementsByClassName("modal")[0];
    //     btn1_s.onclick = function () {
    //         modal1.style.display = "block";
    //     }
    //
    //     var modal2 = document.getElementsByClassName("modal")[1];
    //     btn2_s.onclick = function () {
    //         modal2.style.display = "block";
    //     }
    //
    //     var modal3 = document.getElementsByClassName("modal")[2];
    //     btn3_s.onclick = function () {
    //         modal3.style.display = "block";
    //     }
    //
    //     // clik anywhere to close modal
    //     window.onclick = function (event) {
    //         if (event.target == modal1) {
    //             modal1.style.display = "none";
    //         }
    //         if (event.target == modal2) {
    //             modal2.style.display = "none";
    //         }
    //         if (event.target == modal3) {
    //             modal3.style.display = "none";
    //         }
    //     }
    // } else {
    //     $(div_s).hide();
    //     $(btn1_s).hide();
    //     $(btn2_s).hide();
    //     $(btn3_s).hide();
    //     $(div_clear_s).hide();
    //
    //     $(div_l).show();
    //     $(btn1_l).show();
    //     $(btn2_l).show();
    //     $(btn3_l).show();
    //     $(div_clear_l).show();
    //
    // }
// }

var needs_update = true;
var processing = false;
var count = 1, limit = 5;

/** When page is loaded...**/
$(document).ready(function () {
    /** Interactive Map Setup **/
    let world = [], names = [], countries, vac_map = new Map();
    let map_svgW = 700, map_svgH = 550;
    let rotate = [100, -20];
    let velocity = 0.01;
    let time = Date.now();
    var ContinentArray = {
        "Europe": [-35.187509595656408, -70.75594328392682],
        "North America": [96.3959652111984, -60.4768931916812],
        "Antarctica": [-69.53089507427761, 89.30702018723926],
        "Oceania": [-138.56893652314406, 18.31504815749142],
        "Asia": [-96.51319759040699, -20.94479984182297],
        "South America": [60.17789122485408, 20.310911906837475],
        "Africa": [-29.91403682471926, 3.377695631236064],
        "World": [100, -40]
    }


    // Tools
    let projection = d3.geoOrthographic()
        .scale(270)
        // .rotate([100.5728366920307, -48])
        .translate([map_svgW / 2, map_svgH / 2])
        .clipAngle(90)
        .precision(0.7);
    var path = d3.geoPath()
        .projection(projection);
    var graticule = d3.geoGraticule();
    var colors = {
        clickable: '#e3e2df', hover: '#bab2b5', clicked: "peachpuff",
        clickhover: '#bab2b5', p0: '#c1c8e4', p1: '#84ceeb',
        p2: '#5ab9ea', p3: '#88bdbc', p4: '#3aafa9'
    };


    // Set up the svg work space
    var map = d3.select('#vis1')
        .append('svg')
        // .attr('width', map_svgW)
        // .attr('height', map_svgH)
        .attr('viewBox', `0 0 ${map_svgW} ${map_svgH}`)
        .attr('class', "map")

    map.append("defs").append("path")
        .datum({type: "Sphere"})
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

    $(function () {
        // resize();


        $.ajax({
            url: "/load_data",
            type: "get",
            async: true,
            success: function (response) {
                window.map_response = JSON.parse(response).map_data.vaccines;
                var vac_country = window.map_response.map(d => d.country);
                var vac_stage = window.map_response.map(d => d.stage);

                /** Interactive Map Response **/
                // filter unique countries with highest stage
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

                var files = ["/data/map.json", "/data/world-country-names.tsv"];

                Promise.all(files.map(url => d3.json(url))).then(function (values) {
                    world = values[0]
                    // console.log("map", values[0])
                    names = values[1]
                    // console.log(world)
                    // console.log("custom", world_continent)
                    var globe = {type: "Sphere"},
                        land = topojson.feature(world, world.objects.land),
                        borders = topojson.mesh(world, world.objects.countries, function (a, b) {
                        return a !== b;
                    })
                    let grid = graticule();
                    countries = topojson.feature(world, world.objects.countries).features;
                    map.insert("path", ".graticule")
                        .datum(land)
                        .attr("class", "land")
                        .attr("d", path);

                    for (let i = 0; i < Object.values(names).length; i++) {
                        for (let j = 0; j < countries.length; j++) {

                            let map_continent;
                            if (countries[j].id === Object.values(names)[i].id) {
                                map_continent = Object.values(names)[i].continent_name;

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
                                    .attr("continent", map_continent)
                                    .attr("countryname", Object.values(names)[i].name)
                                    .on("click", function () {
                                        needs_update = true;
                                        var prev_color = colors.clickable, prev_stage = -1;
                                        var temp;
                                        world_continents.continent = d3.select(this).attr("continent");

                                        d3.selectAll(".clicked")
                                            .classed("clicked", false)
                                            .select(function () {
                                                // console.log(this)
                                                // console.log(d3.select(this).attr("countryname"));
                                                temp = vac_map.get(d3.select(this).attr("countryname"));
                                                prev_stage = temp === undefined ? -1 : temp;

                                                if (prev_stage === 0) {
                                                    prev_color = colors.p0;
                                                } else if (prev_stage === 1) {
                                                    prev_color = colors.p1;
                                                } else if (prev_stage === 2) {
                                                    prev_color = colors.p2;
                                                } else if (prev_stage === 3) {
                                                    prev_color = colors.p3;
                                                } else if (prev_stage === 4) {
                                                    prev_color = colors.p4;
                                                } else {
                                                    prev_color = colors.clickable;
                                                }
                                                d3.select(this).attr("fill", prev_color);
                                                // console.log("unselected", prev_stage, prev_color, d3.select(this).attr("countryname"));
                                            })

                                        d3.selectAll("path").filter(function (d) {
                                            return d3.select(this).attr("continent") === map_continent;
                                        })
                                            .attr("fill", colors.clicked)
                                            .classed("clicked", true);


                                        (function transition() {
                                            d3.select(".clicked").transition()
                                                .duration(1000)
                                                .tween("rotate", function () {
                                                    // console.log(ContinentArray[map_continent])
                                                    // Assign Continent to Rotate to
                                                    var r = d3.interpolate(projection.rotate(), ContinentArray[map_continent])

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

                    // Initial Rotation
                    // d3.timer(function () {
                    //     var feature = map.selectAll("path");
                    //     var dt = Date.now() - time;
                    //     if (processing) {
                    //         time = Date.now()
                    //     }
                    //     if (!processing) {
                    //             projection.rotate([ContinentArray[window.continent][0] + velocity * dt, rotate[1]]);
                    //         feature.attr("d", path);
                    //     }
                    // });
                });
            }
        })

        // $.ajax({
        //     url: '/card',
        //     type: 'get',
        //     data: { 'count': count, 'limit': limit },
        //     success: function (response) {
        //         // console.log(response)
        //         console.log(response)
        //         $('#card_container').append(response);
        //         count = count + 1;
        //     }
        // });

        var btn_group = document.getElementsByTagName('button');
        for (var i = 0, length = btn_group.length; i < length; i++) {
            var btn = btn_group[i];
            if (btn.value === 'World') {
                btn.click();
                break;
            }
        }
    });


    /** When Interactive Buttons are Clicked... **/
    $('.button-font').on('click', function () {
        var prev_continent = 'World';
        var continent = $(this).data("value");
        // if (prev_continent !== continent) {

            window.continent = world_continents.continent;
            $.ajax({
                url: "/get_bars_data",
                type: "get",
                async: true,
                data: {continent: continent},
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
                    let svgW = 700, svgH = 360;
                    let gMargin = {top: 50, right: 25, bottom: 75, left: 75};
                    let states = ['Pre-Clinical', 'Phase I', 'Phase II', 'Phase III', 'Approval'];
                    let currentState = 'Pre-Clinical'
                    let progressStart = 130, segmentWidth = 85;
                    // vis3 replaces vis2 in position
                    svg = d3.select('#vis3')
                        .append('svg')
                        .attr('id', 'vis2')
                        .attr('viewBox', `0 0 ${svgW} ${svgH}`);

                    colorScale = d3.scaleOrdinal()
                        .domain(states)
                        .range(['#c1c8e4', '#84ceeb', '#5ab9ea',
                            '#88bdbc', '#3aafa9']);

                    let flagMap = window.bars_data_response.map(d => d.flag);
                    let companyMap = window.bars_data_response.map(d => d.company);
                    let stageMap = window.bars_data_response.map(d => d.stage);

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
                            .attr("class", "bars-text")
                            .text(companyMap[i].replace(/\//g, ", "))
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
                                        .attr('height', 25)
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

            /** change map on button click */
            // setTimeout(() => {
            if (world_continents.continent !== continent) {
                needs_update = false;
                processing = continent !== 'World';
                world_continents.continent = continent;
                var prev_color = colors.clickable, prev_stage = -1;

                d3.selectAll(".clicked")
                    .classed("clicked", false)
                    .select(function () {
                        // console.log(this)
                        // console.log(d3.select(this).attr("countryname"));
                        var temp = vac_map.get(d3.select(this).attr("countryname"));
                        prev_stage = temp === undefined ? -1 : temp;

                        if (prev_stage === 0) {
                            prev_color = colors.p0;
                        } else if (prev_stage === 1) {
                            prev_color = colors.p1;
                        } else if (prev_stage === 2) {
                            prev_color = colors.p2;
                        } else if (prev_stage === 3) {
                            prev_color = colors.p3;
                        } else if (prev_stage === 4) {
                            prev_color = colors.p4;
                        } else {
                            prev_color = colors.clickable;
                        }
                        d3.select(this).attr("fill", prev_color);
                        // console.log("unselected", prev_stage, prev_color, d3.select(this).attr("countryname"));
                    })

                d3.selectAll("path").filter(function (d) {
                    return d3.select(this).attr("continent") === continent;
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
                            var r = d3.interpolate(projection.rotate(), ContinentArray[continent])
                            return function (t) {
                                // projection.rotate(r(t)).scale(s(t));
                                projection.rotate(r(t));
                                map.selectAll("path").attr("d", path);
                            }
                        });
                })();
            }
        // }
        // }, 600);
    });

});

var nearToBottom = 100;
$(window).scroll(function () {
    if ($(window).scrollTop() + $(window).height() >
        $(document).height() - nearToBottom) {
        // ajax call get data from server and append to the div
        $.ajax({
            url: '/card',
            type: 'get',
            data: {'count': count, 'limit':limit},
            success: function (response) {
                // console.log(response)
                // console.log(response)
                $('#card_container').append(response);

                count = count+1;
            }
        });
    }
});

$("#mobile-form").submit(function(){
    let stages = document.querySelector('.active#stages').value;
    let country = document.querySelector('.active#country').value;
    let type = document.querySelector('.active#type').value;
    $.ajax({
        url: "/mobile-form",
        data: {'stages': stages, 'country': country, 'type': type},
        type: "GET",
        success: function (response) {

            $('.all-cards').remove();
            document.getElementById('mobile_container').innerHTML = response;

        },
        // error:function(e){
        //     console.log(JSON.stringify(e));
        // }
    });
    return false;
});

