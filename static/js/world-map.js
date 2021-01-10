(async () => {
    const world = await d3.json('../../data/map.json');
    var countries = topojson.feature(world, world.objects.countries).features;
        // neighbors = topojson.neighbors(world.objects.countries.geometries);

    var names, World_Vaccination_Data;
    var world_data = [];
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
        d3.select('p.vaccinations-subtitle')
            .html("As of " + month + " " + day + ", " + year + ", more than <span class='highlight-vaccinations'>" + abbreviateNumber(world_data[0].vaccinations) + "</span> doses have been administered in the world")
    }
    hideSpinner();


    const width = 1050, height = 550;

    var svg = d3.select("#vis5").append("svg")
        // .attr("width", width)
        // .attr("height", height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    var projection = d3.geoNaturalEarth1()
        .scale(200)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = d3.geoPath().projection(projection);

    var graticule = d3.geoGraticule();


    var min_and_max_percentage = d3.extent(countries, function (d) {
        if (d.hasOwnProperty('vaccinations'))
            return d.vaccinations.vaccinations_per_hundred;
        else
            console.log(d)
    })
    var p_min = min_and_max_percentage[0];
    var p_max = min_and_max_percentage[1];
    // var p_interval = p_max - p_min;
    // var p_i = p_interval / 4;
    // var p_domain = [p_min, p_min + p_i, p_min + p_i * 2, p_min + p_i * 3, p_max];

    var colorScale = d3.scaleLinear()
        .domain([p_min, p_max])
        .range(["#e5f9f8", "#02995c"]);


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
            }
            else {
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

    var legendLinear = d3.legendColor()
        // .title("Number of Doses Administered per 100 People")
        .shapeWidth(50)
        .cells(8)
        .orient('horizontal')
        .scale(colorScale);

    var g_legend = svg.append("g")
        .attr("class", "legendLinear");

    svg.select(".legendLinear")
        .call(legendLinear);

    g_legend.attr("transform", `translate(${(width - d3.select('.legendLinear').node().getBBox().width) / 2},500)`);
    // console.log(borders)

    // svg.data(borders)
    //     .enter()
    //     .insert("path", ".graticule")
    //
    //     // .enter()
    //     .attr("class", "boundary")
    //     .attr("d", path);


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