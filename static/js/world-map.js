(async () => {
    const world = await d3.json('../../data/map.json');
    var countries = topojson.feature(world, world.objects.countries).features;
    // neighbors = topojson.neighbors(world.objects.countries.geometries);

    var names, World_Vaccination_Data;
    var vaccinated_countries_count = 0;
    var world_data = [], table_distribution = [], graph_top_vaccinations = [];
    var files = ["/data/world-countries.csv", "/get-world-vaccination-data"];
    await Promise.all(files.map(url => d3.json(url))).then(function (values) {
        names = values[0];
        World_Vaccination_Data = values[1];

        countries.forEach(function (d) {
            // match csv country name with TOPOJSON
            for (let i = 0; i < Object.values(names).length; i++) {
                if (d.id === Object.values(names)[i].id) {
                    d['name'] = Object.values(names)[i].name;
                }
            }
        })


        // add world vaccination data to json
        World_Vaccination_Data.forEach(function (vaccination_data) {
            if (vaccination_data.country === "World") {
                world_data.push(vaccination_data);
            }
            countries.forEach(function (d) {
                if (d.name === vaccination_data.country) {
                    d['vaccinations'] = vaccination_data;
                    if (vaccination_data.vaccinations !== 0) {
                        var new_vaccinations_per_hundred = (vaccination_data.new_vaccinations / vaccination_data.population) * 100;
                        table_distribution.push([d.name, abbreviateNumber(vaccination_data.vaccinations), vaccination_data.vaccinations_per_hundred.toFixed(2), vaccination_data.new_vaccinations, new_vaccinations_per_hundred]);
                        graph_top_vaccinations.push({
                            "country": d.name,
                            "vaccinations": vaccination_data.vaccinations,
                            "vaccinations_per_hundred": vaccination_data.vaccinations_per_hundred,
                            "date": vaccination_data.date
                        })
                        vaccinated_countries_count++;
                    }
                }
                if (d.name === "United States" && (vaccination_data.country === "Northern Mariana Islands" || vaccination_data.country === "Virgin Islands, U.S." || vaccination_data.country === "Guam" || vaccination_data.country === "Guam" || vaccination_data.country === "Puerto Rico")) {
                    d['vaccinations'] = vaccination_data;
                }
            })
        })
    })

    var index = 16;

    var currentTime = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const month = monthNames[currentTime.getMonth()];
    const day = String(currentTime.getDate());
    const year = currentTime.getFullYear();

    const hour = currentTime.getHours();
    const daytime = currentTime.toLocaleString('en-US', { hour: 'numeric', hour12: true }).replace(" ", "")

    if (world_data.length === 1) {
        d3.select('p.vaccinations-title')
            .html("As of " + daytime + " on " + month + " " + day + ", " + year + ", more than <span class='highlight-vaccinations'>" + abbreviateNumber(world_data[0].vaccinations) + "</span> doses have been administered in " + vaccinated_countries_count + " countries around the world")
    }
    hideSpinnerWorld();


    const width = 1050, height = 550;

    var legendSVG = d3.select("#vis5").append("svg")
        .attr('viewBox', `0 0 ${width} 85`);

    var min_and_max_percentage = d3.extent(countries, function (d) {
        if (d.hasOwnProperty('vaccinations'))
            return d.vaccinations.vaccinations_per_hundred;
        // else
        //     console.log(d)
    })
    var p_min = min_and_max_percentage[0];
    var p_max = min_and_max_percentage[1];
    // var p_interval = p_max - p_min;
    // var p_i = p_interval / 4;
    // var p_domain = [p_min, p_min + p_i, p_min + p_i * 2, p_min + p_i * 3, p_max];

    var colorScale = d3.scaleLinear()
        .domain([p_min, p_max])
        .range(["#e5f9f8", "#02995c"]);

    var legendTitle = legendSVG.append('text')
        .attr("font-weight", "bold")
        .attr("class", "legend-title")
        .text("Number of Doses Administered Per 100 People")


    var legendLinear = d3.legendColor()
        // .title("Number of Doses Administered per 100 People")
        .shapeWidth(70)
        .cells(8)
        .orient('horizontal')
        .scale(colorScale);


    // var legendWrapper = svg.append("g")
    //     .attr("height", "30px;")

    var g_legend = legendSVG.append("g")
        .attr("class", "legendLinear");

    legendSVG.select(".legendLinear")
        .call(legendLinear);

    var noDataG = legendSVG.select('g.legendLinear')
        .insert('g', 'g.legendCells')
        .attr("transform", "translate(0, 0)")

    noDataG.append('rect')
        .attr("width", legendSVG.select(".swatch").node().getBBox().width)
        .attr("height", legendSVG.select(".swatch").node().getBBox().height)
        .style("fill", "#f5f5f5")

    noDataG.append('text')
        .attr("class", "label")
        .text("No Data")
        .style("text-anchor", "middle")
        .attr("transform", legendSVG.select('g.legendCells>g.cell>text.label').attr("transform"))

    legendSVG.select(".legendCells")
        .attr("transform", `translate(${legendSVG.select(".swatch").node().getBBox().width + 20}, 0)`)


    g_legend.attr("transform", `translate(${(width - d3.select('.legendLinear').node().getBBox().width) / 2},35)`);

    legendSVG.select('.legend-title')
        .attr("transform", `translate(${(width - d3.select('.legend-title').node().getBBox().width) / 2},25)`)



    var svg = d3.select("#vis5").append("svg")
        .attr("id", "world-map")
        // .attr("width", width)
        // .attr("height", height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    var projection = d3.geoNaturalEarth1()
        .scale(200)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = d3.geoPath().projection(projection);

    var graticule = d3.geoGraticule();

    // svg.append("defs")
    //     .append("path")
    //     .datum({type: "Sphere"})
    //     .attr("id", "sphere")
    //     .attr("d", path);
    //
    // svg.append("use")
    //     .attr("class", "stroke")
    //     .attr("xlink:href", "#sphere");
    //
    // svg.append("use")
    //     .attr("fill", "fill")
    //     .attr("fill", "#fff")
    //     .attr("xlink:href", "#sphere");
    //
    // svg.append("path")
    //     .datum(graticule)
    //     .attr("class", "graticule")
    //     .attr("fill", "#fff")
    //     .attr("d", path);

    // get countries with data, append to the end (their border color will not be overridden)
    var hasData = [];
    for (var i = 0; i < countries.length; i++) {
        if (countries[i].hasOwnProperty('vaccinations') && countries[i]['vaccinations']['vaccinations_per_hundred'] !== 0) {
            hasData.push(countries[i])
            countries.splice(i, 1)
            i--;
        }
        if (countries[i].name === "Antarctica") {
            countries.splice(i, 1);
            i--;
        }
    }
    countries = countries.concat(hasData)
    // countries.forEach(function (d, i) {
    //     console.log(d)
    //     if (d['vaccinations']['vaccinations_per_hundred'])
    //         countries.push(countries.splice(i, 1)[0])
    // })
    var tooltip = d3.select('body')
        .append('div')
        .attr('class', 'hidden d3tooltip-world')
        .attr('style', 'left: 0px; top: 150px;');

    svg.selectAll(".country")
        .data(countries)
        .enter()
        .insert("path", ".graticule")
        .attr("class", function (d) {
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations_per_hundred !== 0) {
                return "country has-data"
            } else {
                return "country no-data"
            }
        })
        .attr("d", path)
        .attr("fill", function (d, i) {
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations_per_hundred !== 0) {
                return colorScale(d.vaccinations.vaccinations_per_hundred)
            } else {
                return "#f5f5f5"
            }
        })
        .attr("stroke", function (d) {
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations_per_hundred !== 0) {
                return "#111"
            } else {
                return "#aeaeae"
            }
        })
        .attr("stroke-width", "0.5")
        .on('mouseover', function (d) {
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations_per_hundred !== 0) {
                d3.select(this)
                    .attr('stroke-width', '2')
            } else {
                d3.select(this)
                    .attr('stroke-width', '1.5')
            }
        })
        .on('mousemove', function (d) {
            var pageX = d3.event.pageX;
            var pageY = d3.event.pageY;
            tooltip.classed('hidden', false)
                .style('left', (pageX + 20) + "px")
                .style('top', (pageY) + "px")
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations_per_hundred !== 0) {
                tooltip.html(d.name + ":<br/> <span class='tooltip-number'>" + (d.vaccinations.vaccinations_per_hundred) + "</span> doses given per 100 people" +
                    "<br/> <span class='tooltip-number'>" + abbreviateNumber(d.vaccinations.vaccinations) + "</span> doses administered <br/>" +
                    "<span class='tooltip-date'>As of " + (d.vaccinations.date) + "</span>");
            } else {
                tooltip.html(d.name + ":<br/><span class='tooltip-no-data'>No reported data as of " + month + " " + day + ", " + year + "</span>");
            }

        })
        .on('mouseout', function (d) {
            tooltip.classed('hidden', true);
            d3.select(this)
                .attr('stroke-width', '0.5')
        })
    // .on('mouseout', tip.hide)

    // d3.selectAll('.country.has-data')
    //     .on("mouseover", function (d) {
    //         d3.select(this)
    //             .attr('stroke-width', '2')
    //         // .attr('stroke', '#ff0000')
    //         // d3.select(this).remove()
    //
    //     })
    // .on("mouseout", function () {
    //     d3.select(this)
    //         .attr('stroke-width', '0.5')
    // })


    var borders = topojson.feature(world, world.objects.countries, function (a, b) {
        return a !== b;
    });


    table_distribution.sort(function (a, b) {
        return b[2] - a[2];
    });


    var buttonGroupGraph = d3.select("#vis5")
        .append("div")
        .attr("class", "btn-group world-map-button-group")
        .attr("role", "group")

    buttonGroupGraph.selectAll("button")
        .data(["Table", "Bar Graph"])
        .enter()
        .append("button")
        .attr("class", function (d) {
            if (d === "Table")
                return "active btn btn-outline-primary world-map-graph-button"
            else
                return "btn btn-outline-primary world-map-graph-button"
        })
        .html(function (d) {
            return d;
        })
        .on("click", function (d) {
            d3.selectAll("button.world-map-graph-button")
                .attr("class", "btn btn-outline-primary world-map-graph-button")
            d3.select(this)
                .attr("class", "active btn btn-outline-primary world-map-graph-button")

            if (d === "Table"){
                d3.select(".world-map-bars-svg")
                    .style("display", "none")
                d3.select(".world-vaccination-table")
                    .style("display", "table")

                if (index + 20 >= table_distribution.length) {
                    d3.select('#btn4')
                        .attr('style', 'display: none;')
                    d3.select('#btn3')
                        .attr('style', 'display: inline-block;')
                } else {
                    d3.select("#btn4")
                        .style("display", "inline-block")
                    d3.select("#btn3")
                        .style("display", "none")

                }
            }
            else if (d === "Bar Graph") {
                d3.select(".world-vaccination-table")
                    .style("display", "none")
                d3.select(".world-map-bars-svg")
                    .style("display", "block")

                d3.select("#btn4")
                    .style("display", "none")
                d3.select("#btn3")
                    .style("display", "none")
                // d3.select(".legend-title-2")
                //     .style("display", "block")
            }

        })

    // var legendGraphSVG = d3.select("#vis5").append("svg")
    //     .attr("class", "legend-title-2")
    //     .style("display", "none")
    //     .attr('viewBox', `0 0 ${width} 35`);




    var graphMargin = {top: 50, right: 40, bottom: 70, left: 180}
    var graphWidth = width - graphMargin.left - graphMargin.right,
        graphHeight;
    if (screen.width < 768)
        graphHeight = 900 - graphMargin.top - graphMargin.bottom;
    else
        graphHeight = 600 - graphMargin.top - graphMargin.bottom;


    var graphSVG = d3.select("#vis5").append("svg")
        .attr('viewBox', `0 0 ${graphWidth} ${graphHeight}`)
        .attr("class", "world-map-bars-svg")
        // .style("display", "none")

    graphSVG.append("text")
        // .attr("font-weight", "bold")
        .attr("class", "legend-title legend-title-2")
        .text("Number of Doses Administered Per 100 People")


    graphSVG.select('.legend-title.legend-title-2')
        .attr("transform", `translate(${(graphWidth - d3.select('.legend-title.legend-title-2').node().getBBox().width) / 2},35)`)

    var graphG = graphSVG.append("g")
        .attr("transform", "translate(" + graphMargin.left + "," + graphMargin.top + ")");

    graphSVG.style("display", "none");

    var y = d3.scaleBand()
        .range([0, graphHeight - graphMargin.bottom])
        .padding(0.25);

    var x = d3.scaleLinear()
        .range([0, graphWidth - graphMargin.left - graphMargin.right - 20]);

    var countryMap = graph_top_vaccinations.map(d => d.country)

    var graphColorScale = d3.scaleOrdinal(d3.schemeCategory10)

    graph_top_vaccinations.sort(function (a, b) {
        return b.vaccinations_per_hundred - a.vaccinations_per_hundred;
    });

    //make y axis to show bar names
    // var yAxis = d3.axisLeft(y)
    //     .scale(y)
    //     //no tick marks
    //     .tickSize(0)
    // // .orient("left");
    //
    // var gy = svg.append("g")
    //     .attr("class", "y axis")
    //     .call(yAxis)

    x.domain([0, d3.max(graph_top_vaccinations, function (d) {
        return d.vaccinations_per_hundred;
    })])
    y.domain(graph_top_vaccinations.slice(0, 20).map(function (d) {
        return d.country;
    }));


    // var bars = svg.selectAll(".bar")
    //     .data(countries)
    //     .enter()
    //     .append("g")
    //
    // //append rects
    // bars.append("rect")
    //     .attr("class", "bar")
    //     .attr("y", function (d) {
    //         return y(d.name);
    //     })
    //     .attr("height", y.bandwidth())
    //     .attr("x", 0)
    //     .attr("width", function (d) {
    //         if (d.hasOwnProperty('vaccinations'))
    //             return x(d.vaccinations.vaccinations_per_hundred);
    //     });
    //
    // //add a value label to the right of each bar
    // bars.append("text")
    //     .attr("class", "label")
    //     //y position of the label is halfway down the bar
    //     .attr("y", function (d) {
    //         return y(d.name) + y.bandwidth() / 2 + 4;
    //     })
    //     //x position is 3 pixels to the right of the bar
    //     .attr("x", function (d) {
    //         if (d.hasOwnProperty('vaccinations'))
    //             return x(d.vaccinations.vaccinations_per_hundred) + 3;
    //     })
    //     .text(function (d) {
    //         if (d.hasOwnProperty('vaccinations'))
    //             return d.vaccinations.vaccinations_per_hundred;
    //     });

    var bars = graphG.selectAll(".bar")
        .data(graph_top_vaccinations.slice(0, 20))
        .enter()
        .append('g')

    bars.append("rect")
        .attr("class", "bar world-map-graph-bars")
        //.attr("x", function(d) { return x(d.sales); })
        .attr("width", function (d) {
            return x(d.vaccinations_per_hundred);
        })
        .attr("y", function (d) {
            return y(d.country);
        })
        .attr("height", y.bandwidth())
        .attr("fill", function (d) {
            return graphColorScale(d.country)
        })
        .on('mousemove', function (d) {
            var pageX = d3.event.pageX;
            var pageY = d3.event.pageY;
            tooltip.classed('hidden', false)
                .style('left', (pageX + 20) + "px")
                .style('top', (pageY) + "px")
            if (d.hasOwnProperty('vaccinations') && d.vaccinations_per_hundred !== 0) {
                tooltip.html(d.country + ":<br/> <span class='tooltip-number'>" + (d.vaccinations_per_hundred) + "</span> doses given per 100 people" +
                    "<br/> <span class='tooltip-number'>" + abbreviateNumber(d.vaccinations) + "</span> doses administered <br/>" +
                    "<span class='tooltip-date'>As of " + (d.date) + "</span>");
            } else {
                tooltip.html(d.name + ":<br/><span class='tooltip-no-data'>No reported data as of " + month + " " + day + ", " + year + "</span>");
            }
        })
        .on('mouseout', function (d) {
            tooltip.classed('hidden', true);
        });

    // add the x Axis
    graphG.append("g")
        .attr("transform", "translate(0," + graphHeight + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    graphG.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y));

    graphG.selectAll(".yAxis>.tick>text")
        .each(function (d, i) {
            d3.select(this).attr("class", "world-map-graph-country-label");
        });

    bars.append("text")
        .attr("class", "label world-map-graph-label")
        //y position of the label is halfway down the bar
        .attr("y", function (d) {
            return y(d.country) + y.bandwidth() / 2 + 4;
        })
        //x position is 3 pixels to the right of the bar
        .attr("x", function (d) {
            return x(d.vaccinations_per_hundred) + 3;
        })
        .style("font-size", "14px")
        .text(function (d) {
            return d.vaccinations_per_hundred.toFixed(2);
        });


    var table = d3.select("#vis5")
        .append("table")
        .attr('class', 'world-vaccination-table');

    // var header = table.append("thead").append("tr");
    table.append("thead")
        .append("tr")
        .selectAll("th")
        .data(["Country", "Vaccinations", "Doses Given Per 100 People"])
        .enter()
        .append("th")
        .text(function (d) {
            return d;
        })
        .style("background-color", function (d) {
            if (d === "Vaccinations")
                return "rgb(100, 208, 138)"
            if (d === "Doses Given Per 100 People")
                return "rgb(147,201,248)"
        });


    updateWorldTable(table_distribution.slice(0, 16), 0)


    d3.select("#btn4").on("click", () => {
        if (index + 20 >= table_distribution.length) {
            d3.select('#btn4')
                .attr('style', 'display: none;')
            d3.select('#btn3')
                .attr('style', 'display: inline-block;')

        }
        var newData = table_distribution.slice(index, index + 20);
        updateWorldTable(newData, index);
        index += 20;

    })

    d3.select("#btn3").on("click", () => {
        d3.select('#btn3')
            .attr('style', 'display: none;');
        d3.select('#btn4')
            .attr('style', 'display: inline-block');
        var newData = table_distribution.slice(0, 16);
        table.selectAll('tbody').remove();
        updateWorldTable(newData, 0);
        index = 16;
    })

    // legendSVG.selectAll('.swatch')
    //     .on("mouseover", function (d) {
    //         var color = d3.select(this).style("fill");
    //         svg.selectAll(`[fill="${color}"]`)
    //             .attr("stroke-width", "2");
    //     })

    function updateWorldTable(newData, index) {
        var table_body = table.append("tbody");
        var rows = table_body
            .selectAll("tr")
            .data(newData)
            .enter()
            .append("tr")
            .attr("class", function (d) {
                if (d[0] === "World") {
                    return "world_total_row"
                }
            });
        // We built the rows using the nested array - now each row has its own array.
        var cells = rows.selectAll("td")
            // each row has data associated; we get it and enter it for the cells.
            .data(function (d) {
                return d.slice(0, 3);
            })
            .enter()
            .append("td")
            .text(function (d, i) {
                if (i === 0)
                    return d;
            })
            .attr("class", function (d, i) {
                if (i === 0) {
                    return 'country-cell';
                }
                else if (i === 1) {
                    return 'vaccination-cell vaccination-double-cell';
                } else if (i === 2) {
                    return 'per-hundred-cell per-hundred-double-cell';
                }
            });

        var vaccination_cell = d3.selectAll("td.vaccination-double-cell")

        vaccination_cell.append("span")
            .attr("class", "cell-new-vaccinations-portion")
            .text(function (d, i) {
                i = i + index;
                if (table_distribution[i][3] !== 0) {
                    return "+" + abbreviateNumber(table_distribution[i][3])
                }
            })

        vaccination_cell.append("p")
            .attr("class", "cell-total-vaccinations-portion")
            .text(function (d, i) {
                i = i + index;
                if (table_distribution[i][3] !== 0) {
                    return d;
                } else {
                    return d;
                }
            });


        d3.selectAll("td.vaccination-double-cell")
            .attr("class", "vaccination-cell")

        var per_hundred_cell = d3.selectAll("td.per-hundred-double-cell")

        per_hundred_cell.append("span")
            .attr("class", "cell-new-vaccinations-per-hundred-portion")
            .text(function (d, i) {
                i = i + index;
                if (parseFloat(table_distribution[i][4].toFixed(2)) !== 0) {
                    return "+" + table_distribution[i][4].toFixed(2)
                }
            })

        per_hundred_cell.append("p")
            .attr("class", "cell-total-new-vaccinations-portion")
            .text(function (d, i) {
                return d;
            });
        d3.selectAll("td.per-hundred-double-cell")
            .attr("class", "per-hundred-cell")
    }


})();

// Imported Functions
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

function hideSpinnerWorld() {
    document.getElementById('spinner-wrapper-world').style.display = 'none';
}