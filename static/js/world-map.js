(async () => {
    const currentTime = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const month = monthNames[currentTime.getMonth()];
    const day = String(currentTime.getDate());
    const year = currentTime.getFullYear();

    const hour = currentTime.getHours();
    const daytime = currentTime.toLocaleString('en-US', {hour: 'numeric', hour12: true}).replace(" ", "");

    var vaccinated_countries_count = 0;
    var world_data = [], table_distribution = [], graph_top_vaccinations = [];

    let WorldVaccinationData = [];
    WorldVaccinationData = await d3.json("/get-world-vaccination-data");
    for (let i = 0; i < WorldVaccinationData.length; i++) {
        if (WorldVaccinationData[i].vaccinations > 0) {
            if (WorldVaccinationData[i].country === "World") {
                world_data.push(WorldVaccinationData[i]);
            } else {
                vaccinated_countries_count++;
            }
        }
    }
    if (world_data.length === 1) {
        d3.select('p.vaccinations-title')
            .html("As of <span class='vaccinations-title-daytime'>" + daytime + " on " + month + " " + day + ", " + year + "</span>, more than <span class='highlight-vaccinations'>" + abbreviateNumber(world_data[0].vaccinations) + "</span> doses have been administered in <b>" + vaccinated_countries_count + " countries</b> around the world")
    }

    var names;

    const world = await d3.json('../../data/map.json');
    var countries = topojson.feature(world, world.objects.countries).features;
    // neighbors = topojson.neighbors(world.objects.countries.geometries);

    var files = ["/data/world-countries.csv"];
    await Promise.all(files.map(url => d3.json(url))).then(function (values) {
        names = values[0];
        // WorldVaccinationData = values[1];

        countries.forEach(function (d) {
            // match csv country name with TOPOJSON
            for (let i = 0; i < Object.values(names).length; i++) {
                if (d.id === Object.values(names)[i].id) {
                    d['name'] = Object.values(names)[i].name;
                }
            }
        })
         // WorldVaccinationData.forEach(function (vaccination_data) {
         //
         // })
        // add world vaccination data to json
        WorldVaccinationData.forEach(function (vaccination_data) {
            if (vaccination_data.vaccinations !== 0) {
                 var new_vaccinations_per_hundred = (vaccination_data.new_vaccinations / vaccination_data.population) * 100;
                 table_distribution.push([
                     [vaccination_data.country, vaccination_data.date],
                     [vaccination_data.new_vaccinations, vaccination_data.vaccinations],
                     [new_vaccinations_per_hundred, vaccination_data.vaccinations_per_hundred.toFixed(2)]
                 ]);
                 graph_top_vaccinations.push({
                     "country": vaccination_data.country,
                     "vaccinations": vaccination_data.vaccinations,
                     "new_vaccinations_per_hundred": new_vaccinations_per_hundred,
                     "vaccinations_per_hundred": vaccination_data.vaccinations_per_hundred,
                     "date": vaccination_data.date
                 })
             }
            countries.forEach(function (d) {
                if (d.name === vaccination_data.country) {
                    d['vaccinations'] = vaccination_data;

                }
                if (d.name === "United States" && (vaccination_data.country === "Northern Mariana Islands" || vaccination_data.country === "Virgin Islands, U.S." || vaccination_data.country === "Guam" || vaccination_data.country === "Guam" || vaccination_data.country === "Puerto Rico")) {
                    d['vaccinations'] = vaccination_data;
                }
            })
        })
    })

    var index = 16;

    hideSpinnerWorld();

    const width = 1050, height = 550;
    const legendSVGHeight = 85;

    var legendSVG = d3.select("#vis5").append("svg")
        .attr('viewBox', `0 0 ${width} ${legendSVGHeight}`)
        .attr("class", "world-map-legend");

    var min_and_max_percentage = d3.extent(countries, function (d) {
        if (d.hasOwnProperty('vaccinations'))
            return d.vaccinations.vaccinations_per_hundred;
        // else
        //     console.log(d)
    })
    var p_min = min_and_max_percentage[0];
    var p_max = min_and_max_percentage[1];

    var unit_vaccinations_map = [];
    for (let i = 0; i < countries.length; i++) {
        let d = countries[i];
        if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations > 0){
            unit_vaccinations_map.push(d.vaccinations.vaccinations_per_hundred);
        }
    }
    unit_vaccinations_map.sort(function(a, b) {
        return a - b;
    });


    var unit_vaccinations_20thPercentile = d3.quantile(unit_vaccinations_map, 0.20);
    var unit_vaccinations_45thPercentile = d3.quantile(unit_vaccinations_map, 0.45);
    var unit_vaccinations_70thPercentile = d3.quantile(unit_vaccinations_map, 0.70);
    var unit_vaccinations_90thPercentile = d3.quantile(unit_vaccinations_map, 0.90);


    var p_interval = p_max - p_min;
    var p_i = p_interval / 4;
    // var p_domain = [p_min + p_i, p_min + p_i * 2, p_min + p_i * 3, p_min + p_i * 4, p_max + p_i];
    var p_domain_legend = [p_min, unit_vaccinations_20thPercentile, unit_vaccinations_45thPercentile, unit_vaccinations_70thPercentile, unit_vaccinations_90thPercentile, p_max];
    var p_domain;

    // if (p_max - unit_vaccinations_90thPercentile < 10) {
    p_domain = [p_min, unit_vaccinations_20thPercentile, unit_vaccinations_45thPercentile, unit_vaccinations_70thPercentile, unit_vaccinations_90thPercentile, p_max];

    
    const zoomCoordinates = {
        "World": {"x": 0, "y": 0, "k": 1},
        "North America": {"x": 122.44143621909018, "y": -19.26215789306815, "k": 2.042024251414407},
        "Europe": {"x": -1238.021693317245, "y": -11.213068146101023, "k": 3.149959619323031},
        "Middle East": {"x": -2634.420882440748, "y": -586.2051698308421, "k": 4.669781093872179},
        "Oceania": {"x": -1926.6424288541339, "y": -693.4183918668293, "k": 2.6390158215458235},
        "Asia": {"x": -1331.068444560838, "y": -189.15522544720352, "k": 2.1916235328954143},
        "South America": {"x": -150.8000339752533, "y": -465.27446886367454, "k": 2.0448570612198758},
        "Africa": {"x": -516.5232680367267, "y": -248.22992125495517, "k": 1.8327372893507303}
        //, "Asia": {"x": -1302.7331916850462, "y": -159.89007233762175, "k": 2.099433367246173}
        }


    // var colorScale = d3.scaleLinear()
    //     .domain([p_min, p_max])
    //     .range(["#e5f9f8", "#02995c"]);

    // var colorScale = d3.scaleThreshold()
    //     .domain(p_domain)
    //     .range(["#f5f5f5",
    //         "#e8f8f7", "#d2f1e5", "#96d6bc",
    //         "#5eb96c", "#46ab5e", "#02995c"]);
    //
    // var colorScaleLegend = d3.scaleQuantile()
    //     .domain(unit_vaccinations_map)
    //     .range([
    //         "#e8f8f7", "#d2f1e5", "#96d6bc",
    //         "#5eb96c", "#46ab5e", "#02995c"]);

    var colorScale = d3.scaleQuantile()
        .domain(p_domain)
        .range([
        "rgb(232,248,247)", "rgb(210,241,229)", "rgb(150,214,188)",
            "rgb(102,194,164)", "rgb(51,176,117)",
            "rgb(8,148,117)", "rgb(1,110,66)"
            ]);


    legendSVG.append('text')
        .attr("font-weight", "bold")
        .attr("class", "legend-title")
        .text("Number of Doses Administered Per 100 People")


    var legendLinear = d3.legendColor()
        // .title("Number of Doses Administered per 100 People")
        .shapeWidth(90)
        // .cells(8)
        .orient('horizontal')
        .scale(colorScale);


    var g_legend = legendSVG.append("g")
        .attr("class", "legendLinear");

    legendSVG.select(".legendLinear")
        .call(legendLinear);

    var noDataG = legendSVG.select('g.legendLinear')
        .insert('g', 'g.legendCells')
        .attr("transform", "translate(0, 0)")

    noDataG.append('rect')
        .attr("class", "no-data-swatch")
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
        .attr("transform", `translate(${(width - d3.select('.legend-title').node().getBBox().width) / 2},25)`);



    var svgWrapper = d3.select("#vis5").append("svg")
        .attr("id", "world-map")
        // .attr("width", width)
        // .attr("height", height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    var svg = svgWrapper.append("g");

    var projection = d3.geoNaturalEarth1()
        .scale(200)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = d3.geoPath().projection(projection);

    // var graticule = d3.geoGraticule();

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
    //     .attr("fill", "#fff")
    //     .attr("xlink:href", "#sphere");
    //
    // svg.append("path")
    //     .datum(graticule)
    //     .attr("class", "graticule")
    //     .attr("fill", "#fff")
    //     .attr("d", path);

    // get countries with data, append to the end of the country json (their border color will not be overridden)
    var hasData = [];
    for (var i = 0; i < countries.length; i++) {
        if (countries[i].hasOwnProperty('vaccinations') && countries[i]['vaccinations']['vaccinations'] > 0) {
            hasData.push(countries[i]);
            countries.splice(i, 1);
            i--;
        }
        if (countries[i].name === "Antarctica") {
            countries.splice(i, 1);
            i--;
        }
    }
    countries = countries.concat(hasData);
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
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations > 0) {
                return "country has-data"
            } else {
                return "country no-data"
            }
        })
        .attr("d", path)
        .attr("fill", function (d, i) {
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations > 0) {
                return colorScale(d.vaccinations.vaccinations_per_hundred)
            } else {
                return "rgb(245,245,245)"
            }
        })
        .attr("stroke", function (d) {
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations > 0) {
                return "#111"
            } else {
                return "#aeaeae"
            }
        })
        .attr("stroke-width", "0.5")
        .on('mouseover', function (d) {
            var color = d3.select(this).attr("fill");

            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations > 0) {
                d3.select(this)
                    .attr('stroke-width', '2');

                legendSVG.select(`[style="fill: ${color.replaceAll(',', ', ')};"]`)
                .attr("stroke", "#111")
                .attr("stroke-width", "2")
                .attr("fill-opacity", "1");
            } else {
                d3.select(this)
                    .attr('stroke-width', '1.5')
            }
            // legendSVG.selectAll('.swatch, .swatch-no-data')
            //     .attr("fill-opacity", "0.05");

        })
        .on('mousemove', function (d) {
            var pageX = d3.event.pageX;
            var pageY = d3.event.pageY;
            tooltip.classed('hidden', false)
                .style('left', (pageX + 20) + "px")
                .style('top', (pageY) + "px")
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations > 0) {
                tooltip.html(d.name + ":<br/> <span class='tooltip-number'>" + (d.vaccinations.vaccinations_per_hundred.toFixed(2)) + "</span> doses given per 100 people" +
                    "<br/> <span class='tooltip-number'>" + abbreviateNumber(d.vaccinations.vaccinations) + "</span> doses administered <br/>" +
                    "<span class='tooltip-date'>As of " + (d.vaccinations.date) + "</span>");
            } else {
                tooltip.html(d.name + ":<br/><span class='tooltip-no-data'>No reported data as of " + month + " " + day + ", " + year + "</span>");
            }
            if (pageX + 20 + d3.select('.d3tooltip-world').node().getBoundingClientRect().width >= d3.select('body').node().getBoundingClientRect().width) {
                tooltip.style('left', (d3.select('body').node().getBoundingClientRect().width - d3.select('.d3tooltip-world').node().getBoundingClientRect().width) + "px");
            }

        })
        .on('mouseout', function (d) {
            tooltip.classed('hidden', true);
            d3.select(this)
                .attr('stroke-width', '0.5');

            var color = d3.select(this).attr("fill");
            legendSVG.select(`[style="fill: ${color.replaceAll(',', ', ')};"]`)
                .attr("stroke-width", "0");
        })

    // Append Country Zoom In Menu
    d3.select("#vis5")
        .append("div")
        .attr("class", "world-map-projection-dropdown")
        .html(
            `<div class="btn-group-vertical" id='WorldMapZoomBtnGroup'>
<!--              <button class="btn btn-outline-primary dropdown-toggle" type="button" id="WorldMapZoomDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">-->
<!--                World-->
<!--              </button>-->
<!--              <div class="dropdown-menu" id='world-map-dropdown-items' aria-labelledby="WorldMapZoomDropdown">-->
                <button class="active dropdown-item zoom-dropdown" type="button">World</button>
                <button class="dropdown-item zoom-dropdown" type="button">Europe</button>
                <button class="dropdown-item zoom-dropdown" type="button">Middle East</button>
                <button class="dropdown-item zoom-dropdown" type="button">North America</button>
                <button class="dropdown-item zoom-dropdown" type="button">Asia</button>
                <button class="dropdown-item zoom-dropdown" type="button">South America</button>
                <button class="dropdown-item zoom-dropdown" type="button">Oceania</button>
<!--              </div>-->
            </div>`
        )


    d3.selectAll(".zoom-dropdown")
        .on("click", function () {
            d3.selectAll(".zoom-dropdown")
                .attr("class", "dropdown-item zoom-dropdown");
            d3.select(this)
                .attr("class", "active dropdown-item zoom-dropdown");

            var continent_selected = d3.select(this).text();
            let continent_coordinates = zoomCoordinates[continent_selected];
            d3.select("#WorldMapZoomDropdown")
                .text(continent_selected);
            if (screen.width < 768) {
                svg.transition()
                .duration(2000)
                .ease(d3.easeCubicOut)
                .attr('transform', `translate(${continent_coordinates.x}, ${continent_coordinates.y}) scale(${continent_coordinates.k})`)
            }
            else {
                svg.attr('transform', `translate(${continent_coordinates.x}, ${continent_coordinates.y}) scale(${continent_coordinates.k})`)
            }

        })

    legendSVG.selectAll('.swatch, .no-data-swatch')
        .on("mouseover", function (d) {
            var color = d3.select(this).style("fill");
            d3.select(this)
                .attr("stroke", "#111")
                .attr("stroke-width", "2");

            svg.selectAll('.country')
                .attr("fill-opacity", "0.05");

            svg.selectAll(`[fill="${color.replaceAll(' ', '')}"]`)
                .attr("stroke-width", "2")
                .attr("stroke", "#111")
                .attr("fill-opacity", "1");

        })
        .on("mouseout", function (d) {
            d3.select(this)
                .attr("stroke-width", "0");

            var color = d3.select(this).style("fill");
            svg.selectAll(`[fill="${color.replaceAll(' ', '')}"]`)
                .attr("stroke-width", "0.5");
            svg.selectAll('.country')
                .attr("fill-opacity", "1");
            svg.selectAll('.country.no-data')
                .attr("stroke", "#aeaeae");
        })


        // let zoom = d3.zoom()
        //    .scaleExtent([1, 7])
        //    // .translateExtent([[-500, -300], [1500, 1000]])
        //    .on('zoom', () => {
        //        console.log(d3.event.transform)
        //        svg.attr('transform', d3.event.transform)
        //    });
        //
        // svgWrapper.call(zoom);

    // var borders = topojson.feature(world, world.objects.countries, function (a, b) {
    //     return a !== b;
    // });


    table_distribution.sort(function (a, b) {
        return b[2][1] - a[2][1];
    });


    var buttonGroupGraphWrapper = d3.select("#vis5")
        .append("div")
        .attr("class", "btn-group-wrapper")
    var buttonGroupGraph = buttonGroupGraphWrapper.append("div")
        .attr("class", "btn-group world-map-button-group")
        .attr("role", "group")

    buttonGroupGraph.selectAll("button")
        .data(["Table", "Bar Graph"])
        .enter()
        .append("button")
        .attr("class", function (d) {
            if (d === "Table")
                return "active btn btn-outline-info world-map-graph-button"
            else
                return "btn btn-outline-info world-map-graph-button"
        })
        .html(function (d) {
            return d;
        })
        .on("click", function (d) {
            d3.selectAll("button.world-map-graph-button")
                .attr("class", "btn btn-outline-info world-map-graph-button")
            d3.select(this)
                .attr("class", "active btn btn-outline-info world-map-graph-button")

            if (d === "Table") {
                d3.select(".world-map-bars-svg")
                    .style("display", "none")
                d3.select(".world-vaccination-table")
                    .style("display", "table")

                if (index + 30 >= table_distribution.length) {
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
            } else if (d === "Bar Graph") {
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


    var graphMargin = {top: 50, right: 90, bottom: 70, left: 160}
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

    var graphColorScale = d3.scaleOrdinal(d3.schemeDark2)

    graph_top_vaccinations.sort(function (a, b) {
        return b.vaccinations_per_hundred - a.vaccinations_per_hundred;
    });


    x.domain([0, d3.max(graph_top_vaccinations, function (d) {
        return d.vaccinations_per_hundred;
    })])
    y.domain(graph_top_vaccinations.slice(0, 20).map(function (d) {
        return d.country;
    }));

    var bars = graphG.selectAll(".bar")
        .data(graph_top_vaccinations.slice(0, 20))
        .enter()
        .append('g')

    bars.append("rect")
        .attr("class", "bar world-map-graph-bars")
        //.attr("x", function(d) { return x(d.sales); })
        .attr("width", function (d) {
            return x(d.vaccinations_per_hundred - d.new_vaccinations_per_hundred);
        })
        .attr("y", function (d) {
            return y(d.country);
        })
        .attr("height", y.bandwidth())
        .attr("fill", function (d) {
            return graphColorScale(d.country)
        });


    bars.append("rect")
        .attr("class", "bar world-map-graph-bars-new")
        .attr("x", function(d) {
            return x(d.vaccinations_per_hundred - d.new_vaccinations_per_hundred);
        })
        .attr("width", function (d) {
            return x(d.new_vaccinations_per_hundred);
        })
        .attr("y", function (d) {
            return y(d.country);
        })
        .attr("height", y.bandwidth())
        .attr("fill", function (d) {
            return graphColorScale(d.country)
        })
        .attr("opacity", "0.6")


    bars.selectAll('.bar')
        .on('mousemove', function (d) {
            var pageX = d3.event.pageX;
            var pageY = d3.event.pageY;
            tooltip.classed('hidden', false)
                .style('left', (pageX + 20) + "px")
                .style('top', (pageY) + "px")
            if (d.hasOwnProperty('vaccinations') && d.vaccinations_per_hundred !== 0) {
                tooltip.html(d.country + ":<br/> <span class='tooltip-number'>" + (d.vaccinations_per_hundred.toFixed(2)) + "</span> doses given per 100 people" +
                    "<br/> <span class='tooltip-number'>" + abbreviateNumber(d.vaccinations) + "</span> doses administered <br/>" +
                    "<span class='tooltip-date'>As of " + (d.date) + "</span>");
            } else {
                tooltip.html(d.name + ":<br/><span class='tooltip-no-data'>No reported data as of " + month + " " + day + ", " + year + "</span>");
            }
            if (pageX + 20 + d3.select('.d3tooltip-world').node().getBoundingClientRect().width >= d3.select('body').node().getBoundingClientRect().width) {
                tooltip.style('left', (d3.select('body').node().getBoundingClientRect().width - d3.select('.d3tooltip-world').node().getBoundingClientRect().width) + "px");
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
        // y position of the label is halfway down the bar
        .attr("y", function (d) {
            return y(d.country) + y.bandwidth() / 2 + 4;
        })
        // x position is 3 pixels to the right of the bar
        .attr("x", function (d) {
            return x(d.vaccinations_per_hundred) + 3;
        })
        .style("font-size", "13px")
        .html(function (d) {
            if (parseFloat(d.new_vaccinations_per_hundred.toFixed(2)) !== 0)
                return d.vaccinations_per_hundred.toFixed(2) + "&nbsp;<tspan class='bars-new-vaccinations-text'>(+" + d.new_vaccinations_per_hundred.toFixed(2) + ")</tspan>";
            else
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
        .html(function (d, i) {
            if (i === 2)
                return d + "<span id=\"world-map-filter-desc\">&nbsp;<i class=\"fas fa-caret-down\"></i></span>";
            return d;
        })
        .style("background-color", function (d) {
            if (d === "Vaccinations")
                return "rgb(100, 208, 138)"
            if (d === "Doses Given Per 100 People")
                return "rgb(147,201,248)"
        })
        .on("click", function (d, i) {
            let caret_down_world = "<span id=\"world-map-filter-desc\">&nbsp;<i class=\"fas fa-caret-down\"></i></span>"

            if (!d3.select(this).html().includes(caret_down_world)) {
                d3.select("#world-map-filter-desc").remove();

                let existing_text = d3.select(this).html()
                d3.select(this).html(existing_text + caret_down_world)

                var new_table_distribution = table_distribution;
                if (i === 0) {
                    new_table_distribution.sort();
                } else if (i === 1 || i === 2) {
                    new_table_distribution.sort(function (a, b) {
                        return b[i][1] - a[i][1];
                    });
                } else {
                    new_table_distribution.sort(function (a, b) {
                        return b[i] - a[i];
                    });
                }
                table.selectAll('tbody').remove();
                updateWorldTable(new_table_distribution.slice(0, 16));
            }

        });


    updateWorldTable(table_distribution.slice(0, 16))


    d3.select("#btn4").on("click", () => {
        if (index + 30 >= table_distribution.length) {
            d3.select('#btn4')
                .attr('style', 'display: none;')
            d3.select('#btn3')
                .attr('style', 'display: inline-block;')

        }
        var newData = table_distribution.slice(index, index + 30);
        updateWorldTable(newData);
        index += 30;

    })

    d3.select("#btn3").on("click", () => {
        d3.select('#btn3')
            .attr('style', 'display: none;');
        d3.select('#btn4')
            .attr('style', 'display: inline-block');
        var newData = table_distribution.slice(0, 16);
        table.selectAll('tbody').remove();
        updateWorldTable(newData);
        index = 16;
    })



    function updateWorldTable(newData) {
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
            .attr("class", function (d, i) {
                if (i === 0) {
                    return 'country-cell';
                } else if (i === 1) {
                    return 'vaccination-cell';
                } else if (i === 2) {
                    return 'per-hundred-cell';
                }
            });

        let country_cell = cells.filter(function (d, i) {
            return i === 0;
        })
        country_cell.append("p")
            .attr("class", "cell-country-portion")
            .text(function (d) {
                return d[0];
            })
        country_cell.append("span")
            .attr("class", "cell-update-date-portion")
            .text(function (d) {
                if (d[0] === "United States"){
                    d3.select(".us-map>p.date")
                        .text("Updated " + d[1])
                }
                return "(Updated " + d[1] + ")"
            });


        let vaccination_cell = cells.filter(function (d, i) {
            return i === 1;
        })
        vaccination_cell.append("span")
            .attr("class", "cell-new-vaccinations-portion")
            .text(function (d) {
                if (d[0] !== 0) {
                    return "+" + abbreviateNumber(d[0])
                }
            })

        vaccination_cell.append("p")
            .attr("class", "cell-total-vaccinations-portion")
            .text(function (d) {
                return abbreviateNumber(d[1]);
            });


        let per_hundred_cell = cells.filter(function (d, i) {
            return i === 2;
        })
        per_hundred_cell.append("span")
            .attr("class", "cell-new-vaccinations-per-hundred-portion")
            .text(function (d) {
                d[0] = parseFloat(d[0].toFixed(2));
                if (d[0] > 0) {
                    return "+" + d[0].toFixed(2);
                }
            })
        per_hundred_cell.append("p")
            .attr("class", "cell-total-new-vaccinations-portion")
            .text(function (d) {
                return d[1];
            });
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

    // not display 11.0 instead of 11
    if (newValue >= 100 || suffixNum !== 0)
        newValue = newValue.toPrecision(3);

    // Rounding errors for values such as 999600 --> returns 1.00e+3K
    // now it will return 1.00M
    if (newValue == 1.00e+3) {
        // newValue is of type 'string'
        newValue = "1.00";
        suffixNum++;
    }

    newValue += suffixes[suffixNum];
    return newValue;
}

function hideSpinnerWorld() {
    document.getElementById('spinner-wrapper-world').style.display = 'none';
}