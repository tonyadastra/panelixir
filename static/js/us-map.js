(async () => {
    const us = await d3.json('../../data/us-map.json');
    const data = topojson.feature(us, us.objects.states).features;

    var special_jurisdictions = ["District of Columbia", "Puerto Rico", "U.S. Virgin Islands", "Mariana Islands", "American Samoa", "Guam"];

    var US_Distribution_Data, US_States;
    let table_distribution = [];
    var files = ["/data/us-states.csv", "/get-usa-distribution-data"];
    await Promise.all(files.map(url => d3.json(url))).then(function (values) {
        US_States = values[0];
        US_Distribution_Data = values[1];
        // Moderna = values[1]
        // Pfizer = values[2]
        US_States.forEach(function (state) {
            US_Distribution_Data.forEach(function (dbStateData) {
                // Pfizer.forEach(function (state_pfizer) {
                    if (state.state === dbStateData.jurisdiction) {
                        state.population = parseInt(state.population)
                        var total_doses = dbStateData.doses;
                        var percentage_covered = total_doses / state.population;
                        var state_data = {
                            "state": state.state,
                            "code": state.code,
                            "doses": total_doses,
                            "population": state.population,
                            "percentage_covered": percentage_covered * 100
                        };
                        // Add distribution data to each state
                        data.forEach(function (d_state) {
                            if (d_state.properties.name === state.state) {
                                d_state['distribution'] = state_data
                            }
                        })
                        // if (special_jurisdictions.includes(dbStateData.jurisdiction)) {
                        //     data.push({"type": "Feature", "properties": {"name": state.state, "type": "Territory"}, "distribution": state_data})
                        // }
                        // percentage_array.push(percentage_covered * 100)
                        // us_state_distribution.push(state_data)
                        if (!special_jurisdictions.includes(state.state) || state.state === "District of Columbia") {
                            table_distribution.push([state_data.state, abbreviateNumber(state_data.doses), abbreviateNumber(state_data.population), state_data.percentage_covered.toFixed(2)])
                        }
                    }
                // })
            })
        })
    })
    // console.log(data)


    const width = 960;
    const height = 600;
    const svg = d3.select('#vis4')
        .append('svg')
        // .attr('width', width)
        // .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // Create an instance of geoPath.
    const path = d3.geoPath();

    var min_and_max_percentage = d3.extent(data, function (d) {
        return d.distribution.percentage_covered;
    })
    var p_min = min_and_max_percentage[0];
    var p_max = min_and_max_percentage[1];
    var p_interval = p_max - p_min;
    var p_i = p_interval / 4;


    var textColorException = ["New Jersey", "Rhode Island", "Delaware", "Hawaii"];

    var p_domain = [p_min, p_min + p_i, p_min + p_i * 2, p_min + p_i * 3, p_max];
    // Create colorScale
    var colorScale = d3.scaleLinear()
        // .domain([0.1, 0.2, 0.4, 0.6, 0.8, 0.99])
        // .domain([0, 20, 40, 60, 80, 100])
        .domain(p_domain)
        .range(d3.schemeBuGn[5]);

    var textColorScale = d3.scaleThreshold()
        .domain(p_domain)
        .range(['#000', '#000', '#000', '#000', '#fff', '#fff'])

    // var tooltip = d3.select('body').append('div')
    //     .attr('class', 'hidden d3tooltip');

    // Use the path to plot the US map based on the geometry data.
    svg.append('g')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('class', 'us-map-region')
        .attr('d', path)
        .attr('id', function (d) {
            if (d['distribution'] && d.properties.name !== "District of Columbia") {
                return d.distribution.code;
            }
        })
        .attr('fill', function (d) {
            if (d['distribution']) {
                return colorScale(d.distribution.percentage_covered)
            } else {
                return "#fff";
            }
        })

    svg.append("g")
        .attr("class", "states-names")
        .selectAll("text")
        .data(data)
        .enter()
        .append("svg:text")
        .attr("class", function (d) {
            if (textColorException.includes(d.properties.name)) {
                return "us-map-text text-color-exception"
            } else {
                return "us-map-text"
            }
        })
        .attr('pointer-events', function (d) {
            if (!textColorException.includes(d.properties.name)) {
                return "none";
            }
        })
        .text(function (d) {
            if (d['distribution'] && d.distribution.code !== 'DC') {
                return d.distribution.code;
            }
        })
        .attr("x", function (d) {
            switch (d.properties.name) {
                case 'Michigan':
                case 'Florida':
                case 'Rhode Island':
                    return path.centroid(d)[0] + 10;
                case 'Louisiana':
                case 'Hawaii':
                    return path.centroid(d)[0] - 10;
                case 'California':
                    return path.centroid(d)[0] - 5;
                case 'New Jersey':
                    return path.centroid(d)[0] + 25;
                case 'Delaware':
                    return path.centroid(d)[0] + 20;
                default:
                    return path.centroid(d)[0];
            }
        })
        .attr("y", function (d) {
            switch (d.properties.name) {
                case 'Michigan':
                    return path.centroid(d)[1] + 15;
                case 'Rhode Island':
                    return path.centroid(d)[1] + 20;
                case 'Connecticut':
                case 'Tennessee':
                    return path.centroid(d)[1] + 5;
                case 'New Hampshire':
                case 'New Jersey':
                case 'Delaware':
                case 'Hawaii':
                    return path.centroid(d)[1] + 10;
                case 'Massachusetts':
                case 'Kentucky':
                    return path.centroid(d)[1] + 4;
                default:
                    return path.centroid(d)[1];
            }
        })
        .attr("text-anchor", "middle")
        .attr('fill', function (d) {
            if (textColorException.includes(d.properties.name)) {
                return "black";
            } else if (d['distribution']) {
                return textColorScale(d.distribution.percentage_covered)
            } else {
                return "transparent";
            }
        })


    var special_jurisdictions_data = [];
    data.forEach(function (d){
        if (special_jurisdictions.includes(d.properties.name)) {
            special_jurisdictions_data.push(d)
        }
    })


    svg.append("g")
        .selectAll("rect")
        .data(special_jurisdictions_data)
        .enter()
        .append("rect")
        .attr('class', 'us-map-region')
        .attr('id', function (d) {
            return d.distribution.code;
        })
        .attr("width", 15)
        .attr("height", 15)
        .attr("transform", `translate(830, 400)`)
        .attr("fill", function (d) {
            return colorScale(d.distribution.percentage_covered)
        })

    svg.append("g")
        .selectAll("text")
        .data(special_jurisdictions_data)
        .enter()
        .append("text")
        .attr("class", "us-map-text text-color-exception")
        .attr("transform", `translate(850, 412.5)`)
        .text(function (d) {
            return d.distribution.code;
        })


    d3.selectAll('.us-map-region')
        .on('mousemove', function (d) {
            d3.select(".d3tooltip").remove();
            // Tooltip
            var tooltip;
            if (screen.width < 768) {
                tooltip = d3.select('div.us-map').append('div')
                    .attr('class', 'hidden d3tooltip')
                    .attr('style', 'left: 0px; top: 0px;')
            }
            else {
                tooltip = d3.select('body').append('div')
                    .attr('class', 'hidden d3tooltip')
                    .attr('style', 'left: 0px; top: 670px;');
            }

            // var mouse = d3.mouse(this);
            var print_percentage = 0;
            var available_doses = 0;

            if (d['distribution']) {
                print_percentage = d.distribution.percentage_covered.toFixed(2);
                available_doses = d.distribution.doses;
            }
            var pageX = d3.event.pageX;
            var pageY = d3.event.pageY;

            tooltip.classed('hidden', false)
                // .attr("dy", "0em")
                .html(d.properties.name + ": " + (print_percentage) + "% covered" + "<br/>" +
                    "Doses available: " + abbreviateNumber(available_doses))

            if (screen.width < 768) {
                tooltip.style('left', '0px')
                    .style('top', "0px");
            } else {
                tooltip.style('left', (pageX + 20) + 'px')
                    .style('top', (pageY) + "px");
            }

        })
        .on('mouseout', function () {
            d3.select(".d3tooltip").remove();
            // tooltip.classed('hidden', true);
        })

    d3.selectAll('text.us-map-text.text-color-exception')
        .on('mousemove', function (d) {
            d3.select(".d3tooltip").remove();
            // Tooltip

            var tooltip;
            if (screen.width < 768) {
                tooltip = d3.select('div.us-map').append('div')
                    .attr('class', 'hidden d3tooltip')
                    .attr('style', 'left: 0px; top: 0px;')
            }
            else {
                tooltip = d3.select('body').append('div')
                    .attr('class', 'hidden d3tooltip')
                    .attr('style', 'left: 0px; top: 670px;');
            }


            var hover_state_code = d3.select(this).text();
            d3.select("#" + hover_state_code)
                .attr('fill', 'red')

            var pageX = d3.event.pageX;
            var pageY = d3.event.pageY;

            // var mouse = d3.mouse(this);
            var print_percentage = 0;
            var available_doses = 0;

            if (d['distribution']) {
                print_percentage = d.distribution.percentage_covered.toFixed(2);
                available_doses = d.distribution.doses;
            }

            tooltip.classed('hidden', false)
                // .attr("dy", "0em")
                .html(d.properties.name + ": " + (print_percentage) + "% covered" + "<br/>" +
                    "Doses available: " + abbreviateNumber(available_doses))
            // console.log(svg.node().getBBox())
            if (screen.width < 768) {
                tooltip.style('left', '0px')
                    .style('top', "670px!important;")
                // .style('font-size', '11px;');
            } else {
                tooltip.style('left', (pageX + 20) + 'px')
                    .style('top', (pageY) + "px");
            }

        })
        .on('mouseout', function (d) {
            var mouseout_state_code = d3.select(this).text();
            var color = "#fff";
            if (d['distribution']) {
                color = colorScale(d.distribution.percentage_covered)
            }
            d3.select("#" + mouseout_state_code)
                .attr('fill', color)

            d3.select(".d3tooltip").remove();
            // tooltip.classed('hidden', true);
        });



    var legend = svg.append("g")
        .attr("class", "legendLinear")
        .attr('transform', `translate(600,20)`);

    var legendLinear = d3.legendColor()
        .title("Percentage Covered(%)")
        .shapeWidth(50)
        .orient('horizontal')
        .scale(colorScale);

    svg.select(".legendLinear")
        .call(legendLinear);

    svg.select('.legendTitle')
        // text-center: x: (legend width - legendTitle width) / 2
        .attr('transform', `translate(${(legend.node().getBBox().width - d3.select('.legendTitle').node().getBBox().width) / 2},0)`);

    // sort entire dataset
    table_distribution.sort(function (a, b) {
        return b[3] - a[3];
    });

    // add US Totals
    var total_doses = d3.sum(data, d => d.distribution.doses)
    var total_population = d3.sum(data, d => d.distribution.population)
    var total_percentage_covered = (total_doses / total_population) * 100

    var us_total_data = ["U.S. Total", abbreviateNumber(total_doses), abbreviateNumber(total_population), total_percentage_covered.toFixed(2)]
    table_distribution.splice(0, 0, us_total_data)


    // You could also have made the new array with a map function!
    //using colors and fonts from the UNICEF Style Guide
    var table = d3.select("#table")
        .append("table")
        .attr('class', 'us-vaccine-distribution');

    // var header = table.append("thead").append("tr");
    table.append("thead")
        .append("tr")
        .selectAll("th")
        .data(["State", "Doses", "Population", "Percentage Covered"])
        .enter()
        .append("th")
        .text(function (d) {
            return d;
        })
        .attr("style", function (d) {
            if (d === "Percentage Covered")
                return "background-color: rgb(100, 208, 138)"
        });

    var table_body = table.append("tbody");
    var rows = table_body
        .selectAll("tr")
        .data(table_distribution.slice(0, 12))
        .enter()
        .append("tr")
        .attr("class", function (d){
            if (d[0] === "U.S. Total") {
                return "us_total_row"
            }
        });
    // We built the rows using the nested array - now each row has its own array.
    var cells = rows.selectAll("td")
        // each row has data associated; we get it and enter it for the cells.
        .data(function (d) {
            return d;
        })
        .enter()
        .append("td")
        .text(function (d, i) {
            if (i % 3 === 0 && i !== 0) {
                return d + "%";
            }
            return d;
        })
        .attr("class", function (d, i) {
            if (i % 3 === 0 && i !== 0) {
                return 'percentage-cell';
            }
        });

    // indexValue for initial # of columns
    var index = 12;

    d3.select("#btn2").on("click", () => {
        if (index + 20 >= table_distribution.length) {
            d3.select('#btn2')
                .attr('style', 'display: none;')
            d3.select('#btn1')
                .attr('style', 'display: inline-block;')

        }
        var newData = table_distribution.slice(index, index + 20);
        index += 20;
        update(newData);

    })

    d3.select("#btn1").on("click", () => {
        d3.select('#btn1')
            .attr('style', 'display: none;');
        d3.select('#btn2')
            .attr('style', 'display: inline-block');
        index = 12;
        var newData = table_distribution.slice(0, 12);
        table.selectAll('tbody').remove();
        update(newData);
    })

    function update(newData) {
        var new_table_body = table.append("tbody");
        var new_rows = new_table_body
            .selectAll("tr")
            .data(newData)
            .enter()
            .append("tr")
            .attr("class", function (d) {
                if (d[0] === "U.S. Total") {
                    return "us_total_row"
                }
            });
        // We built the rows using the nested array - now each row has its own array.
        var cells = new_rows.selectAll("td")
            // each row has data associated; we get it and enter it for the cells.
            .data(function (d) {
                return d;
            })
            .enter()
            .append("td")
            .text(function (d, i) {
                if (i % 3 === 0 && i !== 0) {
                    return d + "%";
                }
                return d;
            })
            .attr("class", function (d, i) {
                if (i % 3 === 0 && i !== 0) {
                    return 'percentage-cell';
                }
            });
    }



})();
