(async () => {
    const world = await d3.json('../../data/map.json');
    var countries = topojson.feature(world, world.objects.countries).features;
    // neighbors = topojson.neighbors(world.objects.countries.geometries);

    var names, World_Vaccination_Data;
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
                    table_distribution.push([d.name, abbreviateNumber(vaccination_data.vaccinations), vaccination_data.vaccinations_per_hundred]);
                    graph_top_vaccinations.push({
                        "country": d.name,
                        "vaccinations_per_hundred": vaccination_data.vaccinations_per_hundred
                    })
                }
                if (d.name === "United States" && (vaccination_data.country === "Northern Mariana Islands" || vaccination_data.country === "Virgin Islands, U.S." || vaccination_data.country === "Guam" || vaccination_data.country === "Guam" || vaccination_data.country === "Puerto Rico")) {
                    d['vaccinations'] = vaccination_data;
                }
            })
        })

    })

    var currentTime = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const month = monthNames[currentTime.getMonth()];
    const day = String(currentTime.getDate());
    const year = currentTime.getFullYear();


    if (world_data.length === 1) {
        d3.select('p.vaccinations-title')
            .html("As of " + month + " " + day + ", " + year + ", more than <span class='highlight-vaccinations'>" + abbreviateNumber(world_data[0].vaccinations) + "</span> doses have been administered in the world")
    }
    hideSpinner();


    const width = 1050, height = 550;

    var legendSVG = d3.select("#vis5").append("svg")
        .attr('viewBox', `0 0 ${width} 80`);

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
        .shapeWidth(50)
        .cells(8)
        .orient('horizontal')
        .scale(colorScale);

    // var legendWrapper = svg.append("g")
    //     .attr("height", "30px;")

    var g_legend = legendSVG.append("g")
        .attr("class", "legendLinear");

    legendSVG.select(".legendLinear")
        .call(legendLinear);

    g_legend.attr("transform", `translate(${(width - d3.select('.legendLinear').node().getBBox().width) / 2},30)`);
    legendSVG.select('.legend-title')
        .attr("transform", `translate(${(width - d3.select('.legend-title').node().getBBox().width) / 2},20)`)


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
                return "#f0f0f0"
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
                .style('left', (pageX + 20) + 'px')
                .style('top', (pageY) + "px")
            if (d.hasOwnProperty('vaccinations') && d.vaccinations.vaccinations_per_hundred !== 0) {
                tooltip.html(d.name + ":<br/> <span class='tooltip-number'>" + (d.vaccinations.vaccinations_per_hundred) + "</span> doses given per 100 people" +
                    "<br/> <span class='tooltip-number'>" + abbreviateNumber(d.vaccinations.vaccinations) + "</span> doses administered");
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
        // console.log(a)
        // console.log(b)
        // console.log(a !== b)
        return a !== b;
    });


    table_distribution.sort(function (a, b) {
        return b[2] - a[2];
    });

    var graphMargin = {top: 20, right: 40, bottom: 50, left: 150}
    var graphWidth = width - graphMargin.left - graphMargin.right,
        graphHeight = 500 - graphMargin.top - graphMargin.bottom;

    var graphSVG = d3.select("#vis5").append("svg")
        .attr('viewBox', `0 0 ${graphWidth} ${graphHeight}`)
        .append("g")
        .attr("transform", "translate(" + graphMargin.left + "," + graphMargin.top + ")");

    var y = d3.scaleBand()
        .range([0, graphHeight - graphMargin.bottom])
        .padding(0.1);

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

    var bars = graphSVG.selectAll(".bar")
        .data(graph_top_vaccinations.slice(0, 20))
        .enter()
        .append('g')

    bars.append("rect")
        .attr("class", "bar")
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
        });

    // add the x Axis
    graphSVG.append("g")
        .attr("transform", "translate(0," + graphHeight + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    graphSVG.append("g")
        .attr("class", "yAxis")
        .call(d3.axisLeft(y));

    graphSVG.selectAll(".yAxis>.tick>text")
        .each(function (d, i) {
            d3.select(this).style("font-size", "14px");
        });

    bars.append("text")
        .attr("class", "label")
        //y position of the label is halfway down the bar
        .attr("y", function (d) {
            return y(d.country) + y.bandwidth() / 2 + 4;
        })
        //x position is 3 pixels to the right of the bar
        .attr("x", function (d) {
            return x(d.vaccinations_per_hundred) + 3;
        })
        .text(function (d) {
            return d.vaccinations_per_hundred;
        });


    // var table = d3.select("#vis5")
    //     .append("table")
    //     .attr('class', 'world-vaccination-table');
    //
    // // var header = table.append("thead").append("tr");
    // table.append("thead")
    //     .append("tr")
    //     .selectAll("th")
    //     .data(["Country", "Vaccinations", "Doses Given Per Hundred"])
    //     .enter()
    //     .append("th")
    //     .text(function (d) {
    //         return d;
    //     })
    //     .attr("style", function (d) {
    //         if (d === "Percentage Covered")
    //             return "background-color: rgb(100, 208, 138)"
    //     });
    //
    // var table_body = table.append("tbody");
    // var rows = table_body
    //     .selectAll("tr")
    //     .data(table_distribution.slice(0, 12))
    //     .enter()
    //     .append("tr")
    //     .attr("class", function (d) {
    //         if (d[0] === "U.S. Total") {
    //             return "us_total_row"
    //         }
    //     });
    // // We built the rows using the nested array - now each row has its own array.
    // var cells = rows.selectAll("td")
    //     // each row has data associated; we get it and enter it for the cells.
    //     .data(function (d) {
    //         return d;
    //     })
    //     .enter()
    //     .append("td")
    //     .text(function (d, i) {
    //         if (i % 3 === 0 && i !== 0) {
    //             return d + "%";
    //         }
    //         return d;
    //     })
    //     .attr("class", function (d, i) {
    //         if (i % 3 === 0 && i !== 0) {
    //             return 'percentage-cell';
    //         }
    //     });


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

function hideSpinner() {
    document.getElementById('spinner-wrapper').style.display = 'none';
}