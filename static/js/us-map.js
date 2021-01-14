(async () => {
    const us = await d3.json('../../data/us-map.json');
    const data = topojson.feature(us, us.objects.states).features;
    const data_administered = topojson.feature(us, us.objects.states).features;

    var special_jurisdictions = ["District of Columbia", "Puerto Rico", "U.S. Virgin Islands", "Mariana Islands", "American Samoa", "Guam"];

    var US_Distribution_Data, US_States;
    var us_total_data_distributed = [], us_total_data_administered = [];
    let table_distribution = [], table_distribution_administered = [];
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
                        var administered_per_100 = (dbStateData.doses_administered / state.population) * 100;
                        var state_data = {
                            "state": state.state,
                            "code": state.code,
                            "doses": total_doses,
                            "doses_administered": dbStateData.doses_administered,
                            "population": state.population,
                            "percentage_covered": percentage_covered * 100,
                            "administered_per_100": administered_per_100
                        };

                        var state_data_administered = {
                            "state": state.state,
                            "code": state.code,
                            "doses": dbStateData.doses_administered,
                            "population": state.population,
                            "percentage_covered": administered_per_100
                        };
                        // Add distribution data to each state
                        data.forEach(function (d_state) {
                            if (d_state.properties.name === state.state) {
                                d_state['distribution'] = state_data
                            }
                        })

                        data_administered.forEach(function (d_state) {
                            if (d_state.properties.name === state_data_administered.state) {
                                d_state['distribution'] = state_data_administered
                            }
                        })
                        // if (special_jurisdictions.includes(dbStateData.jurisdiction)) {
                        //     data.push({"type": "Feature", "properties": {"name": state.state, "type": "Territory"}, "distribution": state_data})
                        // }
                        // percentage_array.push(percentage_covered * 100)
                        // us_state_distribution.push(state_data)
                        if (!special_jurisdictions.includes(state.state) || state.state === "District of Columbia") {
                            table_distribution.push([state_data.state, abbreviateNumber(state_data.doses), state_data.percentage_covered.toFixed(2)])
                            table_distribution_administered.push([state_data.state, abbreviateNumber(state_data.doses_administered), state_data.administered_per_100.toFixed(2)])
                        }
                    }
                // })
            })
        })

        var total_population = d3.sum(data, d => d.distribution.population)
        US_Distribution_Data.forEach(function (d) {
            if (d.jurisdiction === "U.S. Total") {
        //         // add US Totals
        // var total_doses = d3.sum(data, d => d.distribution.doses)
                var total_percentage_covered = (d.doses / total_population) * 100;
                var total_administered_per_100 = (d.doses_administered / total_population) * 100;
        // var total_percentage_covered = (total_doses / total_population) * 100;
                us_total_data_distributed = ["U.S. Total", abbreviateNumber(d.doses), total_percentage_covered.toFixed(2)]
                us_total_data_administered = ["U.S. Total", abbreviateNumber(d.doses_administered), total_administered_per_100.toFixed(2)]
            }
        })
    })


    const width = 960;
    const height = 600;
    const svg = d3.select('#vis4')
        .append('svg')
        // .attr('width', width)
        // .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // Create an instance of geoPath.
    const path = d3.geoPath();

    var table = d3.select("#table")
            .append("table")
            .attr('class', 'us-vaccine-distribution');

    var textColorException = ["New Jersey", "Rhode Island", "Delaware", "Hawaii"];

    var table_title = ["State", "Doses Administered", "Doses Given Per 100 People"];
    // console.log(data)
    var buttonGroup = d3.select("#vis4")
        .append("div")
        .attr("class", "btn-group us-map-button-group")
        .attr("style", "margin-top: 1rem; margin-bottom: 1rem;")
        .attr("role", "group")

    buttonGroup.selectAll("button")
        .data(["Administered", "Distributed"])
        .enter()
        .append("button")
        .attr("class", function (d) {
            if (d === "Administered")
                return "active btn btn-outline-primary us-map-graph-button"
            else
                return "btn btn-outline-primary us-map-graph-button"
        })
        .html(function (d) {
            return d;
        })
        .on("click", function (d) {
            d3.selectAll("button.us-map-graph-button")
                .attr("class", "btn btn-outline-primary us-map-graph-button")
            d3.select(this)
                .attr("class", "active btn btn-outline-primary us-map-graph-button")

            if (d === "Administered"){
                // d3.select(".world-map-bars-svg")
                //     .style("display", "none")
                // d3.select(".world-vaccination-table")
                //     .style("display", "table")
                table_title = ["State", "Doses Administered", "Doses Given Per 100 People"];
                updateUSMap(data_administered, table_distribution_administered, table_title, us_total_data_administered);


                // if (index + 20 >= table_distribution.length) {
                //     d3.select('#btn4')
                //         .attr('style', 'display: none;')
                //     d3.select('#btn3')
                //         .attr('style', 'display: inline-block;')
                // } else {
                //     d3.select("#btn4")
                //         .style("display", "inline-block")
                //     d3.select("#btn3")
                //         .style("display", "none")
                //
                // }
            }
            else if (d === "Distributed") {
                table_title = ["State", "Doses Distributed", "Doses Available Per 100 People"];
                updateUSMap(data, table_distribution, table_title, us_total_data_distributed);
                // d3.select(".world-vaccination-table")
                //     .style("display", "none")
                // d3.select(".world-map-bars-svg")
                //     .style("display", "block")
                //
                // d3.select("#btn4")
                //     .style("display", "none")
                // d3.select("#btn3")
                //     .style("display", "none")
                // d3.select(".legend-title-2")
                //     .style("display", "block")
            }

        })
    hideSpinner();

    updateUSMap(data_administered, table_distribution_administered, table_title, us_total_data_administered);

    function updateUSMap(data, table_distribution, table_title, us_total_data) {
        svg.selectAll('g').remove()
        table.selectAll('thead').remove()
        table.selectAll('tbody').remove()
        var min_and_max_percentage = d3.extent(data, function (d) {
            return d.distribution.percentage_covered;
        })

        var p_min = min_and_max_percentage[0];
        var p_max = min_and_max_percentage[1];
        var p_interval = p_max - p_min;
        var p_i = p_interval / 4;


        var p_domain = [p_min + p_i, p_min + p_i * 2, p_min + p_i * 3, p_min + p_i * 4, p_max + p_i];
        // Create colorScale
        var colorScale = d3.scaleThreshold()
            // .domain([0.1, 0.2, 0.4, 0.6, 0.8, 0.99])
            // .domain([0, 20, 40, 60, 80, 100])
            .domain(p_domain)
            .range(d3.schemeBuGn[6].slice(1, 6));

        var p_domain_legend = [p_min, p_min + p_i, p_min + p_i * 2, p_min + p_i * 3, p_max];

        var colorScaleLegend = d3.scaleLinear()
            // .domain([0.1, 0.2, 0.4, 0.6, 0.8, 0.99])
            // .domain([0, 20, 40, 60, 80, 100])
            .domain(p_domain_legend)
            .range(d3.schemeBuGn[6].slice(1, 6));

        var textColorScale = d3.scaleThreshold()
            .domain(p_domain)
            .range(['#000', '#000', '#000', '#fff', '#fff', '#fff'])

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
        data.forEach(function (d) {
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
                } else {
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

                if (table_title[1] === "Doses Administered") {
                    tooltip.classed('hidden', false)
                        // .attr("dy", "0em")
                        .html(d.properties.name + ": <span class='tooltip-number'>" + (d.distribution.percentage_covered.toFixed(2)) + "</span> doses given per 100 people" + "<br/>" +
                            "Doses administered: <span class='tooltip-number'>" + abbreviateNumber(available_doses) + "</span>")
                }
                else if (table_title[1] === "Doses Distributed") {
                    tooltip.classed('hidden', false)
                        // .attr("dy", "0em")
                        .html(d.properties.name + ": <span class='tooltip-number'>" + (d.distribution.percentage_covered.toFixed(2)) + "</span> doses available per 100 people" + "<br/>" +
                            "Doses available: <span class='tooltip-number'>" + abbreviateNumber(available_doses) + "</span>")
                }



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
                } else {
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

                if (table_title[1] === "Doses Administered") {
                    tooltip.classed('hidden', false)
                        // .attr("dy", "0em")
                        .html(d.properties.name + ": <span class='tooltip-number'>" + (d.distribution.percentage_covered.toFixed(2)) + "</span> doses given per 100 people" + "<br/>" +
                            "Doses administered: <span class='tooltip-number'>" + abbreviateNumber(available_doses) + "</span>")
                }
                else if (table_title[1] === "Doses Distributed") {
                    tooltip.classed('hidden', false)
                        // .attr("dy", "0em")
                        .html(d.properties.name + ": <span class='tooltip-number'>" + (d.distribution.percentage_covered.toFixed(2)) + "</span> doses available per 100 people" + "<br/>" +
                            "Doses available: <span class='tooltip-number'>" + abbreviateNumber(available_doses) + "</span>")
                }


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
            .title(table_title[2])
            .shapeWidth(50)
            .orient('horizontal')
            .scale(colorScaleLegend);

        svg.select(".legendLinear")
            .call(legendLinear);

        svg.select('.legendTitle')
            // text-center: x: (legend width - legendTitle width) / 2
            .attr('transform', `translate(${(legend.node().getBBox().width - d3.select('.legendTitle').node().getBBox().width) / 2},0)`);



        // sort entire dataset
        table_distribution.sort(function (a, b) {
            return b[2] - a[2];
        });


        table.append("thead")
            .append("tr")
            .selectAll("th")
            .data(table_title)
            .enter()
            .append("th")
            .text(function (d) {
                return d;
            })
            .style("background-color", function (d, i) {
                if (i === 1)
                    return "rgb(100, 208, 138)"
                else if (i === 2)
                    return "rgb(147,201,248)"
            });


        var us_total_table_body = table.append("tbody");
        var us_total_row = us_total_table_body
            .selectAll("tr")
            .data([us_total_data])
            .enter()
            .append("tr")
            .attr("class", "us_total_row");
        var us_total_cells = us_total_row.selectAll("td")
            // each row has data associated; we get it and enter it for the cells.
            .data(function (d) {
                return d;
            })
            .enter()
            .append("td")
            .text(function (d, i) {
                if (i === 2 && table_title[2] === "Percentage Covered") {
                    return d + "%";
                }
                return d;
            })
            .attr("class", function (d, i) {
                if (i === 1) {
                    return 'percentage-cell';
                }
                else if (i === 2) {
                    return 'per-hundred-cell';
                }
            });
        // We built the rows using the nested array - now each row has its own array.
        update(table_distribution.slice(0, 12), table_title[2])

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
            update(newData, table_title[2]);

        })

        d3.select("#btn1").on("click", () => {
            d3.select('#btn1')
                .attr('style', 'display: none;');
            d3.select('#btn2')
                .attr('style', 'display: inline-block');
            index = 12;
            var newData = table_distribution.slice(0, 12);
            table.selectAll('tbody').remove();
            update(newData, table_title[2]);
        })
    }

    // indexValue for initial # of columns

    function update(newData, title_2) {
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
                if (i === 2 && title_2 === "Percentage Covered") {
                    return d + "%";
                }
                return d;
            })
            .attr("class", function (d, i) {
                if (i === 1) {
                    return 'percentage-cell';
                }
                else if (i === 2) {
                    return 'per-hundred-cell';
                }
            });
    }



})();

function hideSpinner() {
    document.getElementById('spinner-wrapper').style.display = 'none';
}