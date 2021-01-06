(async () => {
    const us = await d3.json('../../data/us-map.json');
    const data = topojson.feature(us, us.objects.states).features;

    var Moderna, Pfizer, US_States;
    // let us_state_distribution = [];
    let table_distribution = [];
    var files = ["/data/us-states.csv", "/get-moderna-distribution-data", "/get-pfizer-distribution-data"];
    await Promise.all(files.map(url => d3.json(url))).then(function (values) {
        US_States = values[0]
        Moderna = values[1]
        Pfizer = values[2]
        US_States.forEach(function (state) {
            Moderna.forEach(function (state_moderna) {
                Pfizer.forEach(function (state_pfizer) {
                    if (state.state === state_moderna.state && state_moderna.state === state_pfizer.state) {
                        state.population = parseInt(state.population)
                        var total_doses = state_moderna.doses + state_pfizer.doses;
                        var percentage_covered = total_doses / state.population;
                        var state_data = {
                            "state": state.state,
                            "code": state.code,
                            "doses": total_doses,
                            "population": state.population,
                            "percentage_covered": percentage_covered * 100
                        };
                        // Add distribution data to each state
                        data['distribution'] = state_data
                        data.forEach(function (d_state) {
                            if (d_state.properties.name === state.state) {
                                d_state['distribution'] = state_data
                            }
                        })
                        // percentage_array.push(percentage_covered * 100)
                        // us_state_distribution.push(state_data)
                        table_distribution.push([state_data.state, abbreviateNumber(state_data.doses), abbreviateNumber(state_data.population), state_data.percentage_covered.toFixed(2)])
                    }
                })
            })
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
    hideSpinner();
    svg.append('g')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('id', function (d) {
            return d.distribution.code;
        })
        .attr('fill', function (d) {
            if (d['distribution']) {
                return colorScale(d.distribution.percentage_covered)
            } else {
                return "#fff";
            }
        })
        .on('mousemove', function (d) {
            d3.select(".d3tooltip").remove();
            // Tooltip
            var tooltip = d3.select('body').append('div')
                .attr('class', 'hidden d3tooltip')
                .attr('style', 'left: 0px; top: 150px;');

            var mouse = d3.mouse(this);
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
                    .style('top', "150px");
            } else {
                tooltip.style('left', (mouse[0] + 270) + 'px')
                    .style('top', (mouse[1] + 170) + "px");
            }

            // var matrix = this.getScreenCTM()
            //     .translate(+this.getAttribute("cx"), +this.getAttribute("cy"));
        })
        .on('mouseout', function () {
            d3.select(".d3tooltip").remove();
            // tooltip.classed('hidden', true);
        })

    svg.append("g")
        .attr("class", "states-names")
        .selectAll("text")
        .data(data)
        .enter()
        .append("svg:text")
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
            // if (d.properties.name === 'District of Columbia') {
            //     // ToDo: Area: polygonArea(d.geometry.coordinates[0][0]) (if <10, create small icon)
            //     return 'transparent'
            // }
            // return 'black'
        })
        .on('mousemove', function (d) {
            d3.select(".d3tooltip").remove();
            // Tooltip
            var tooltip = d3.select('body').append('div')
                .attr('class', 'hidden d3tooltip')
                .attr('style', 'left: 0px; top: 150px;');


            var hover_state_code = d3.select(this).text();
            d3.select("#" + hover_state_code)
                .attr('fill', 'red')

            var mouse = d3.mouse(this);
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
                    .style('top', "150px!important;")
                    // .style('font-size', '11px;');
            } else {
                tooltip.style('left', (mouse[0] + 270) + 'px')
                    .style('top', (mouse[1] + 170) + "px");
            }


            // var matrix = this.getScreenCTM()
            //     .translate(+this.getAttribute("cx"), +this.getAttribute("cy"));
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

    // shoelace algorithm
    function polygonArea(points) {
        var sum = 0.0;
        var length = points.length;
        if (length < 3) {
            return sum;
        }
        points.forEach(function (d1, i1) {
            var i2 = (i1 + 1) % length;
            var d2 = points[i2];
            sum += (d2[1] * d1[0]) - (d1[1] * d2[0]);
        });
        return sum / 2;
    }

    var legend = svg.append("g")
        .attr("class", "legendLinear")
        .attr('transform', `translate(600,20)`);

    var legendLinear = d3.legendColor()
        .title("Percentage Covered")
        .shapeWidth(50)
        .orient('horizontal')
        .scale(colorScale);
    svg.select(".legendLinear")
        .call(legendLinear);

    d3.select('.legendTitle')
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
            .attr('style', 'display: none;')
        d3.select('#btn2')
            .attr('style', 'display: inline-block')
        index = 10;
        var newData = table_distribution.slice(0, 12);
        d3.selectAll('tbody').remove();
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


// Imported Functions
function hideSpinner() {
    document.getElementById('spinner-wrapper').style.display = 'none';
}

function abbreviateNumber(value) {
    let newValue = value;
    const suffixes = ["", "K", "M", "B", "T"];
    let suffixNum = 0;
    while (newValue >= 1000) {
        newValue /= 1000;
        suffixNum++;
    }

    newValue = newValue.toPrecision(3);

    newValue += suffixes[suffixNum];
    return newValue;
}