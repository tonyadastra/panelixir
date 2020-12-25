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
    p2: '#5ab9ea', p3: '#2b98d2', p4: '#3aafa9'
};

// Set up the svg work space
var map = d3.select('#vis1')
    .append('svg')
    // .attr('width', map_svgW)
    // .attr('height', map_svgH)
    .attr('viewBox', `0 0 ${map_svgW} ${map_svgH}`)
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

function resize() {
    if (window.screen.width > 768) {
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

                var files = ["/data/map.json", "/data/world-countries.csv"];

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
                    d3.timer(function () {
                        var feature = map.selectAll("path");
                        var dt = Date.now() - time;
                        if (processing) {
                            time = Date.now()
                        }
                        if (!processing) {
                            projection.rotate([ContinentArray[window.continent][0] + velocity * dt, rotate[1]]);
                            feature.attr("d", path);
                        }
                    });
                });
            }
        })
    }
}

var needs_update = true;
var processing = false;
var count = 1, limit = 10, mobile_count = 1;

function createDesktopDropdownCountry(country_array) {
    var country_dropdown;

    country_array.forEach((country) => {
        var dropdown = document.createElement("button");
        var country_flag = country
        if (country_flag == "United States")
            country_flag = "USA"
        if (country_flag == "United Kingdom")
            country_flag = "UK"

        var country_wrapper = document.createElement('div')
        country_wrapper.setAttribute('style', 'height: 18px;display:table;')

        var imgUrl = '../static/img/flag/' + country_flag.replace(' ', '') + '.png'
        const image = new Image();
        image.setAttribute('height', '18px');
        image.setAttribute('width', '28px');
        image.setAttribute('style', 'display:table-cell; margin: auto;')
        image.src = imgUrl;

        var text = document.createElement('span')
        text.innerHTML = "\t" + country
        text.setAttribute('style', 'display:table-cell;line-height:18px;vertical-align:middle;padding-left:5px;')

        country_wrapper.appendChild(image)
        country_wrapper.appendChild(text)

        dropdown.appendChild(country_wrapper)
        // dropdown.innerHTML = country;
        dropdown.setAttribute('id', 'country');
        dropdown.setAttribute('value', country);
        dropdown.setAttribute('style', 'height: 32px;');


        if (window.screen.width > 768) {
            dropdown.setAttribute('class', 'desktop-dropdown dropdown-item-ctry');
            country_dropdown = document.getElementById("all-dropdown-items-country");
            dropdown.addEventListener("click", function () {
                $(".desktop-dropdown#country").removeClass("active");
                dropdown.setAttribute('class', 'active desktop-dropdown dropdown-item-ctry');
                setDesktopCountryTitle();

            })
            dropdown.setAttribute('onclick', 'desktopClick()');
        } else {
            country_dropdown = document.getElementById("all-dropdown-items-country-mobile");
            dropdown.setAttribute('class', 'mobile-dropdown-item-ctry mobile-dropdown-item');
            dropdown.addEventListener("click", function () {
                // Remove all previous active dropdown-items
                $(".mobile-dropdown-item").removeClass("active");
                // Set new to active
                dropdown.setAttribute('class', 'active mobile-dropdown-item-ctry mobile-dropdown-item');

            })
            dropdown.setAttribute('onclick', 'mobileCountryClick()');
        }
        country_dropdown.appendChild(dropdown);
    })
}
var total_rows = 0;
/** When page is loaded...**/
$(document).ready(function () {
    $.ajax({
        url: "get_update_time",
        type: "get",
        async: true,
        success: function (response) {
            var update_date = JSON.parse(response).update_time
            total_rows = JSON.parse(response).total_rows

            d3.select('#update_top').append('span')
                .text("Latest Update: " + update_date.replace('   ', ' '))

            $.ajax({
                url: "get_vaccine_countries",
                type: "get",
                async: true,
                success: function (countries) {
                    // var option1_value = $('#compare-dropdown-1').val();
                    var option1_value = 2;
                    // var selected_option_1 = option1.options[option1.selectedIndex].value;
                    // console.log(option1_value)
                    // var option2_value = $('#compare-dropdown-2').val();
                    var option2_value = 1;
                    $.ajax({
                        url: '/get-compare-vaccine-info',
                        type: 'GET',
                        data: {
                            'vaccine1': option1_value, 'vaccine2': option2_value
                        },
                        // beforeSend: function () {
                        //     // show spinner when loading
                        //     $('#spinner').html("<div class='spinner-grow text-success' id='elixir' role='status'><span class='sr-only'>Loading</span></div>");
                        // },
                        // complete: function () {
                        //     // hide the spinner
                        //     $('#spinner').html("");
                        // },
                        success: function (response) {
                            document.getElementById('compare-table').innerHTML = response;
                            if (window.screen.width > 768) {
                                var country_dropdown = document.getElementById("all-dropdown-items-country");
                                var top_countries = document.createElement("BUTTON");
                                top_countries.innerHTML = "Top Countries";
                                top_countries.setAttribute('class', 'dropdown-item disabled dropdown-item-border');
                                top_countries.setAttribute('style', 'color: darkcyan; font-weight: bold;');
                                country_dropdown.appendChild(top_countries);

                                createDesktopDropdownCountry(JSON.parse(countries).top_countries)

                                var other_countries = document.createElement("BUTTON");
                                other_countries.innerHTML = "Other Countries";
                                other_countries.setAttribute('class', 'dropdown-item disabled dropdown-item-border');
                                other_countries.setAttribute('style', 'font-weight: bold;');
                                country_dropdown.appendChild(other_countries);

                                createDesktopDropdownCountry(JSON.parse(countries).world_countries)
                            } else {
                                // var country_dropdown_mobile = document.getElementById("all-dropdown-items-country-mobile");
                                createDesktopDropdownCountry(JSON.parse(countries).all_countries)
                            }

                            $(function () {
                                resize();

                                var btn_group = document.getElementsByTagName('button');
                                for (var i = 0, length = btn_group.length; i < length; i++) {
                                    var btn = btn_group[i];
                                    if (btn.value === 'World') {
                                        btn.click();
                                        break;
                                    }
                                }
                            });
                        }
                    });

                }
            })


        }

    })



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
                // clear vis2 workspace
                d3.select('#vis2').remove()
                let svgW = 700, svgH = 370;
                let gMargin = { top: 50, right: 25, bottom: 75, left: 75 };
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
                        '#2b98d2', '#3aafa9']);

                let flagMap = window.bars_data_response.map(d => d.flag);
                let companyMap = window.bars_data_response.map(d => d.company);
                let stageMap = window.bars_data_response.map(d => d.stage);
                let idMap = window.bars_data_response.map(d => d.vac_id);

                // add title
                svg.append("text")
                    .attr("x", (svgW / 2))
                    .attr("y", 50)
                    .attr("text-anchor", "middle")
                    .style("font-size", "18px")
                    .attr("font-weight", "bold")
                    .text("Top 5 Candidates");

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
                        .attr('y', 80 + 60 * i)
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

                    let yTrack = 75;

                    svg.append("text")
                        .attr("x", 60)
                        .attr("y", yTrack + i * 60)
                        .attr("text-anchor", "middle")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "12px")
                        .attr("font-weight", "bold")
                        .attr("class", "bars-text")
                        .attr("id", idMap[i])
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
                                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").attr('class', 'tspan').text(word);
                                }
                            }
                        });
                    }
                    // Show company introduction on click
                    d3.selectAll('.bars-text')
                        .on('click', function () {
                            $(".bars-text").removeClass("clicked");
                            $(this).addClass("clicked");
                            let company_id = document.querySelector('.clicked.bars-text').id;
                            console.log(company_id)
                            $.ajax({
                                url: "/display-company",
                                data: {'company_id': company_id},
                                type: "GET",
                                success: function (response) {
                                    // console.log(response)
                                    document.getElementById('append-card').innerHTML = response;
                                    $('#company-modal').modal('show');
                                },
                            });
                            return false;
                        })

                    // Append Flag Image
                    // If multiple countries
                    for (let a = 0; a < flagMap[i].length; a++) {
                        // if flagMap[i][a] is not undefined
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
                                    .attr('y', 77.5 + 60 * i);
                            }
                        }
                    }
                    // If single country
                    // if flagMap[i][a] is undefined
                    if (flagMap[i][0] === '.') {
                        svg.append('svg:image')
                            .attr('xlink:href', flagMap[i])
                            .attr('height', 20)
                            .attr('x', function () {
                                const index = states.indexOf(currentState);
                                return (index + 1) * segmentWidth + progressStart + 5;
                            })
                            .attr('y', 77.5 + 60 * i);
                    }

                }
                // Append orange bar
                svg.append('rect')
                    .attr('class', 'border')
                    .attr('rx', 10)
                    .attr('ry', 10)
                    .attr('fill', 'orange')
                    .attr('height', 330)
                    .attr('width', 10)
                    .attr('x', progressStart - 5)
                    .attr('y', 40);

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

            if (window.screen.width > 768) {
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
        }
    });

    // Mobile - Show Active Dropdown Item when Dropdown is clicked
    // Trigger Mobile Dropdown
    $(".dropdown-toggle").dropdown();
    // Scroll To Active Dropdown Item
    $(".dropdown > .dropdown-mobile").click(function () {
        // Get Active Item
        var element = document.getElementsByClassName("active mobile-dropdown-item-ctry mobile-dropdown-item")[0];
        // Scroll Into View, (true)=top, (false)=bottom
        element.scrollIntoView();
    })

    $(".dropdown > #dropdown-desktop-country").click(function () {
        var input_country = document.getElementsByClassName("form-control search-country")[0];
        input_country.focus()
        input_country.select()
        // Show Top/Other Countries tag
        $("#all-dropdown-items-country .disabled").show()
        // Scroll Into View, (true)=top, (false)=bottom
        // element.scrollIntoView();
    })

    // Search feature for Country / Region Dropdown
    $("#myInput").on("keyup", function () {
        var input_value = $(this).val().toLowerCase();
        $("#all-dropdown-items-country button.dropdown-item-ctry").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(input_value) > -1)
        });

        // Show "Top countries" and "other countries" when input field becomes empty again
        if (input_value === '') {
            $("#all-dropdown-items-country .disabled").show()
        }
        else {
            // Hide "Top countries" and "other countries" when searching
            $("#all-dropdown-items-country .disabled").hide()
        }
    });

    // Prevent dropdowns from hiding when clicking inside
    $('#all-dropdown-items-country').on('click', function (event) {
        event.stopPropagation();
    });
    $('#all-dropdown-items-stages').on('click', function (event) {
        event.stopPropagation();
    });
    $('#all-dropdown-items-platforms').on('click', function (event) {
        event.stopPropagation();
    });
});


var mobile_stage = ''
var mobile_country = ''
var mobile_type = ''
var prev_response = ''
var prev_response_mobile = ''
var desktop_stage = ''
var desktop_country = ''
var desktop_type = ''
var prev_mobile_count = 0
var prev_count = 0
$(window).scroll(function () {
    if (window.screen.width <= 768) {
        if ($(window).scrollTop() + $(window).height() >=
            $(document).height() - $('.page-footer').height() - 150) {
            if (mobile_count < (total_rows / limit) && prev_mobile_count !== mobile_count) {
                $.ajax({
                    url: '/mobile-card',
                    type: 'GET',
                    data: {
                        'mobile_stage': mobile_stage, 'mobile_country': mobile_country, 'mobile_type': mobile_type,
                        'mobile_count': mobile_count, 'limit': limit
                    },
                    beforeSend: function () {
                        // show spinner when loading
                        $('#spinner').html("<div class='spinner-grow text-success' id='elixir' role='status'><span class='sr-only'>Loading</span></div>");
                    },
                    complete: function () {
                        // hide the spinner
                        $('#spinner').html("");
                    },
                    success: function (response) {
                        if (response !== prev_response_mobile) {
                            $('#mobile_container').append(response);
                            mobile_count = mobile_count + 1;
                        }
                        prev_response_mobile = response;
                    }
                });
                prev_mobile_count = mobile_count;
            }
        }
    } else {
        if ($(window).scrollTop() + $(window).height() >=
            $(document).height() - $('.page-footer').height()) {
            if (count < (total_rows / limit) && prev_count !== count) {
                $.ajax({
                    url: '/card',
                    type: 'get',
                    data: {
                        'desktop_stage': desktop_stage,
                        'desktop_country': desktop_country,
                        'desktop_type': desktop_type,
                        'count': count,
                        'limit': limit
                    },
                    beforeSend: function () {
                        // show spinner when loading
                        $('#spinner').html("<div class='spinner-grow text-success' id='elixir' role='status'><span class='sr-only'>Loading</span></div>");
                    },
                    complete: function () {
                        // hide the spinner
                        $('#spinner').html("");
                    },
                    success: function (response) {
                        if (response !== prev_response) {
                            var info = document.createElement('div');
                            info.innerHTML = response;
                            $('#card_container').append(info);
                            count = count + 1;
                        }
                        prev_response = response;
                    }
                });
                prev_count = count
            }

        }
    }
    if (world_continents.continent === 'World'){
        // When Map Outside of Window, stop map spinning
        processing = $(window).scrollTop() > $(window).height();
    }
});

// Mobile Modal
// When Dropdown Item is Clicked
function mobileCountryClick() {
    var countryTitle = document.querySelector('.active#country').value;
    if (countryTitle === "") {
        countryTitle = "<i class=\"fa fa-globe-americas\"> </i>&nbsp;Worldwide";
    }
    // Display Title of Previous Selected Country
    document.getElementById('mobile-button').innerHTML = countryTitle;
    // When Dropdown Item Clicked and Matches Most Viewed Countries, set button to active
    if (document.querySelector('.active#country').value === "United States" || "United Kingdom" || "China") {
        var dropdownName = document.querySelector('.active#country').value;
        $(".btn-group-2 > .btn").removeClass("active");
        d3.selectAll(".btn-mobile-country")
            .filter(function () {
                return d3.select(this).attr("value") === dropdownName; // filter by single attribute
            })
            .attr('class', 'active btn btn-default btn-mobile-country mobile-font most-viewed')
    }
    // If Dropdown Item Clicked and it is not listed in Most Viewed Countries, deactivate all buttons
    if (document.querySelector('.active.most-viewed') !== null) {
        if (document.querySelector('.active#country').value !== document.querySelector('.active.most-viewed').value) {
            $(".btn-group-2 > .btn").removeClass("active");
        }
    }
}
$('.dropdown-mobile > .mobile-dropdown-item').click(function () {
    // Remove all previous active dropdown-items
    $('.dropdown-mobile > .mobile-dropdown-item').removeClass("active");
    // Set new to active
    $(this).addClass("active");
    mobileCountryClick();
});

// When most-viewed button is clicked
$('.most-viewed').click(function () {
    var countryTitle = $(this).val();
    // Remove Previous Active
    $(".dropdown-mobile > .mobile-dropdown-item").removeClass("active");
    // Set matched dropdown item to active
    d3.selectAll(".mobile-dropdown-item-ctry")
        .filter(function () {
            return d3.select(this).attr("value") === countryTitle; // filter by single attribute
        })
        .attr('class', 'active mobile-dropdown-item-ctry mobile-dropdown-item')
    // var element = document.getElementsByClassName("active mobile-dropdown-item-ctry mobile-dropdown-item")[0].scrollIntoView(true);

    // Value to All to display
    if ($(this).val() === "") {
        countryTitle = "<i class=\"fa fa-globe-americas\"> </i>&nbsp;Worldwide";
    }
    // change dropdown title
    document.getElementById('mobile-button').innerHTML = countryTitle;

})

// Display Title of Previous Selected Country when Reopening
$('.btn-filter').click(function (){
    var activeCountry = document.querySelector('.active.mobile-dropdown-item-ctry#country').value;
    if (activeCountry === ""){
        activeCountry = "<i class=\"fa fa-globe-americas\"> </i>&nbsp;Worldwide";
    }
    document.getElementById('mobile-button').innerHTML = activeCountry;
})

$('.btn-clear').click(function () {
    $(".btn-group-1 > .btn").removeClass("active");
    $(".btn-group-2 > .btn").removeClass("active");
    $(".mobile-dropdown-item-ctry").removeClass("active");
    $(".btn-group-3 > .btn").removeClass("active");

    // $(".btn.btn-default.btn-mobile-stage.mobile-font.stages-all").click();
    // $(".btn.btn-default.btn-mobile-country.mobile-font.most-viewed.country-all").click();
    // $(".btn.btn-default.btn-mobile-type.mobile-font.type-all").click();

    $(".btn.btn-default.btn-mobile-stage.mobile-font.stages-all").addClass('active');
    $(".btn.btn-default.btn-mobile-country.mobile-font.most-viewed.country-all").addClass('active');
    $(".mobile-dropdown-item-ctry.mobile-dropdown-item.country-worldwide").addClass('active');
    $(".btn.btn-default.btn-mobile-type.mobile-font.type-all").addClass('active');


    // document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('TagIWantToLoadTo').scrollIntoView(true);
})

// AJAX Request for submitting mobile form
$(".submit-mobile-form").click(function () {
    mobile_stage = document.querySelector('.active.btn-mobile-stage#stages').value;
    mobile_country = document.querySelector('.active.mobile-dropdown-item-ctry#country').value;
    mobile_type = document.querySelector('.active.btn-mobile-type#type').value;
    $.ajax({
        url: "/mobile-form",
        data: {
            'mobile_stage': mobile_stage, 'mobile_country': mobile_country, 'mobile_type': mobile_type,
            'limit': limit, 'mobile_count': mobile_count
        },
        type: "GET",
        beforeSend: function() {
            // show the preloader (progress bar)
            $('#TagIWantToLoadTo').html("<div class='load-progress'><div class='indeterminate'></div></div>");
        },
        complete: function () {
            // hide the preloader (progress bar)
            $('#TagIWantToLoadTo').html("");
        },
        success: function (response) {
            $('.initial-cards').remove();
            // $('#card_container').remove();
            document.getElementById('mobile_container').innerHTML = response;
            mobile_count = 1;
        },
    });
    return false;
});

// $(document).ready(function() {
//
//
// });

// Keep Interactive Button Active after clicking outside
$(".button-font").on('click', function () {
    $(".button-font").removeClass('active');
    $(this).addClass('active');
})

// Mobile Modal
// Switch Stages
$(".btn-group-1 > .btn").click(function() {
  $(".btn-group-1 > .btn").removeClass("active");
  $(this).addClass("active");
});

// Switch Popular Countries
$(".btn-group-2 > .btn").click(function() {
  $(".btn-group-2 > .btn").removeClass("active");
  $(this).addClass("active");
});

// Switch Types
$(".btn-group-3 > .btn").click(function() {
  $(".btn-group-3 > .btn").removeClass("active");
  $(this).addClass("active");
});

// Close modal after form submission
$('#submit-form').click(function(e) {
    e.preventDefault();
    // Coding
    $('#exampleModalCenter').modal('toggle'); //or  $('#IDModal').modal('hide');
    return false;
});


$('.dropdown-item-stages').click(function () {
    $(".dropdown-item-stages").removeClass('active');
    $(this).addClass('active');
    var active_stage = document.querySelector('.active.desktop-dropdown#stages').value;
    if (active_stage === "_") {
        active_stage = "All Stages"
    }
    else if (active_stage === "0") {
        active_stage = "Pre-Clinical"
    }
    else if (active_stage === "1") {
        active_stage = "Phase I"
    }
    else if (active_stage === "2") {
        active_stage = "Phase II"
    }
    else if (active_stage === "3") {
        active_stage = "Phase III"
    }
    else if (active_stage === "4") {
        active_stage = "Approval"
    }
    else if (active_stage === "4-1") {
        active_stage = "Limited Use"
    }
    else if (active_stage === "0-1") {
        active_stage = "Abandoned"
    }
    var dropdown_title_stage = document.getElementById('dropdown-desktop-stage')
    dropdown_title_stage.innerHTML = active_stage;
    document.getElementById('TagIWantToLoadTo').scrollIntoView(true);
})

$('.dropdown-item-ctry').click(function () {
    $(".dropdown-item-ctry").removeClass('active');
    $(this).addClass('active');
    // var active_country = document.querySelector('.active.desktop-dropdown#country').value;
    // if (active_country === "") {
    //     active_country = "<i class=\"fa fa-globe-americas\"> </i>&nbsp;Worldwide"
    // }
    // var dropdown_title_country = document.getElementById('dropdown-desktop-country')
    // dropdown_title_country.innerHTML = active_country;
    // document.getElementById('TagIWantToLoadTo').scrollIntoView(true);
})

$('.dropdown-item-type').click(function () {
    $(".dropdown-item-type").removeClass('active');
    $(this).addClass('active');
    var active_type = document.querySelector('.active.desktop-dropdown#type').value;
    if (active_type === ""){
        active_type = "All Platforms"
    }
    else if (active_type === "Protein"){
        active_type = "Subunit Vaccines"
    }
    else if (active_type === "DNA%' or vac_type LIKE '%RNA"){
        active_type = "Nucleic Acid Vaccines"
    }
    else if (active_type === "Viral Vector"){
        active_type = "Viral Vector Vaccines"
    }
    else if (active_type === "Virus%' or vac_type LIKE '%Inactivated"){
        active_type = "Whole-Pathogen Vaccines"
    }
    else if (active_type === "VLP"){
        active_type = "Nanoparticle Vaccines"
    }
    else if (active_type === "Repurposed") {
        active_type = "Other Platforms"
    }

    var dropdown_title_type = document.getElementById('dropdown-desktop-type')
    dropdown_title_type.innerHTML = active_type;
    document.getElementById('TagIWantToLoadTo').scrollIntoView(true);
})

$('.clear-filter').click(function () {
    $(".dropdown-item-stages").removeClass('active');
    $(".dropdown-item-ctry").removeClass('active');
    $(".dropdown-item-type").removeClass('active');

    $(".desktop-dropdown.dropdown-item-stages.dropdown-item-4.all-stages").addClass('active');
    $(".desktop-dropdown.dropdown-item-ctry.worldwide-countries").addClass('active');
    $(".desktop-dropdown.dropdown-item-type.all-platforms").addClass('active');

    var dropdown_title_stage = document.getElementById('dropdown-desktop-stage')
    dropdown_title_stage.innerHTML = "Vaccine Stage ";
    var dropdown_title_country = document.getElementById('dropdown-desktop-country')
    dropdown_title_country.innerHTML= "Country / Region ";
    var dropdown_title_type = document.getElementById('dropdown-desktop-type')
    dropdown_title_type.innerHTML = "Vaccine Platform ";

    // document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('TagIWantToLoadTo').scrollIntoView(true);
    // });
})

$('.desktop-dropdown').on("click", function () {
    desktopClick()
    // return false;
})

$('.clear-filter').click(function () {
    var dropdown_title_stage = document.getElementById('dropdown-desktop-stage')
    dropdown_title_stage.innerHTML = "Vaccine Stage ";
    var dropdown_title_country = document.getElementById('dropdown-desktop-country')
    dropdown_title_country.innerHTML = "Country / Region ";
    var dropdown_title_type = document.getElementById('dropdown-desktop-type')
    dropdown_title_type.innerHTML = "Vaccine Platform ";
})

function desktopClick(){
    $('#dropdown-desktop-stage').dropdown('hide');
    $('#dropdown-desktop-country').dropdown('hide');
    $('#dropdown-desktop-type').dropdown('hide');
    desktop_stage = document.querySelector('.active.desktop-dropdown#stages').value;
    desktop_country = document.querySelector('.active.desktop-dropdown#country').value;
    desktop_type = document.querySelector('.active.desktop-dropdown#type').value;
    // clear input field
    document.getElementsByClassName("form-control search-country")[0].value = '';
    $.ajax({
        url: "/desktop-form",
        data: {
            'desktop_stage': desktop_stage, 'desktop_country': desktop_country, 'desktop_type': desktop_type,
            'limit': limit, 'desktop_count': count
        },
        type: "GET",
        beforeSend: function () {
            // show the preloader (progress bar)
            $('#TagIWantToLoadTo').html("<div class='load-progress'><div class='indeterminate'></div></div>");
            // setTimeout(() => {}, 2000);
        },
        complete: function () {
            // hide the preloader (progress bar)
            $('#TagIWantToLoadTo').html("");
        },
        success: function (response) {
            $('.initial-cards').remove();
            // $('#mobile_container').remove();
            document.getElementById('card_container').innerHTML = response;
            count = 1;
        },
    });

    // var active_country = document.querySelector('.active.desktop-dropdown#country').value;
    // if (active_country === "") {
    //     active_country = "<i class=\"fa fa-globe-ameriocas\"> </i>&nbsp;Worldwide"
    // }
    // var dropdown_title_country = document.getElementById('dropdown-desktop-country')
    // dropdown_title_country.innerHTML = active_country;
    document.getElementById('TagIWantToLoadTo').scrollIntoView(true);
}
$(".desktop-dropdown.dropdown-item-ctry").click(function () {
    setDesktopCountryTitle();
})


function setDesktopCountryTitle() {
    var active_country = document.querySelector('.active.desktop-dropdown#country').value;
    if (active_country === "") {
        active_country = "<i class=\"fa fa-globe-americas\"> </i>&nbsp;Worldwide"
    }
    var dropdown_title_country = document.getElementById('dropdown-desktop-country')
    dropdown_title_country.innerHTML = active_country;
}


$(".btn.btn-light").mouseup(function(){
    $(this).blur();
})


$('#dropdown-desktop-country').click(function () {
    document.getElementById('myInput').value = '';
    $("#all-dropdown-items-country button.dropdown-item-ctry").filter(function () {
        $(this).toggle($(this).text().toLowerCase().indexOf('') > -1)
    });

})

$('.compare-dropdown').on("change", function () {
    // console.log('clicked')
    var option1_value = $('#compare-dropdown-1').val();
    // var selected_option_1 = option1.options[option1.selectedIndex].value;
    console.log(option1_value)
    var option2_value = $('#compare-dropdown-2').val();
    $.ajax({
        url: '/get-compare-vaccine-info',
        type: 'GET',
        data: {
            'vaccine1': option1_value, 'vaccine2': option2_value
        },
        // beforeSend: function () {
        //     // show spinner when loading
        //     $('#spinner').html("<div class='spinner-grow text-success' id='elixir' role='status'><span class='sr-only'>Loading</span></div>");
        // },
        // complete: function () {
        //     // hide the spinner
        //     $('#spinner').html("");
        // },
        success: function (response) {
            document.getElementById('compare-table').innerHTML = response;
        }
    });
})

// $(function() {
//     $('a[href]').attr('target', '_blank');
// });