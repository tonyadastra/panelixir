(async () => {
    function abbreviateNumber(value) {
        var newValue = value;
        if (value >= 1000) {
            var suffixes = ["", "K", "M", "B", "T"];
            var suffixNum = Math.floor(("" + value).length / 3);
            var shortValue = '';
            for (var precision = 2; precision >= 1; precision--) {
                shortValue = parseFloat((suffixNum != 0 ? (value / Math.pow(1000, suffixNum)) : value).toPrecision(precision));
                var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
                if (dotLessShortValue.length <= 2) {
                    break;
                }
            }
            if (shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
            newValue = shortValue + suffixes[suffixNum];
        }
        return newValue;
    }

    var Moderna, Pfizer, US_States;
    let us_state_distribution = [];
    var files = ["/data/us-states.csv", "/get-moderna-distribution-data", "/get-pfizer-distribution-data"];
    await Promise.all(files.map(url => d3.json(url))).then(function (values) {
        US_States = values[0]
        Moderna = values[1]
        Pfizer = values[2]
        US_States.forEach(function (state) {
            Moderna.forEach(function (state_moderna) {
                Pfizer.forEach(function (state_pfizer) {
                    if (state.state === state_moderna.state && state_moderna.state === state_pfizer.state) {
                        var total_doses = state_moderna.doses + state_pfizer.doses;
                        var percentage_covered = total_doses / state.population;
                        var state_data = {
                            "state": state.state,
                            "doses": total_doses,
                            "percentage_covered": percentage_covered
                        };
                        us_state_distribution.push(state_data)
                    }
                })
            })
        })
    })
    // Step 2. Load the US map data.
    const us = await d3.json('../../data/us-map.json');
    const data = topojson.feature(us, us.objects.states).features;

    // Step 3. Draw the SVG.
    // First let's create an empty SVG with 960px width and 600px height.
    const width = 960;
    const height = 600;
    const margin = 200;
    const svg = d3.select('#vis4')
        .append('svg')
        // .attr('width', width)
        // .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // Create an instance of geoPath.
    const path = d3.geoPath();

    // Create colorScale
    var colorScale = d3.scaleLinear()
        // .domain([0.1, 0.2, 0.4, 0.6, 0.8, 0.99])
        .domain([0, 0.2, 0.4, 0.6, 0.8, 1.0])
        .range(d3.schemeYlGn[6]);

    // var tooltip = d3.select('body').append('div')
    //     .attr('class', 'hidden d3tooltip');

    // Use the path to plot the US map based on the geometry data.
    for (var i = 0; i < data.length; i++) {
        var country_data = [data[i]];
        var color = "#fff";
        for (var j = 0; j < us_state_distribution.length; j++) {
            // console.log(us_state_distribution[j].state)
            if (data[i].properties.name === us_state_distribution[j].state) {
                var percentage_covered = us_state_distribution[j].percentage_covered;
                color = colorScale(percentage_covered);
                // console.log(print_percentage)
            }
        }
        svg.append('g')
            .selectAll('path')
            .data(country_data)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', color)
            .on('mousemove', function (d) {
                d3.select(".d3tooltip").remove();
                // Tooltip
                var tooltip = d3.select('body').append('div')
                    .attr('class', 'hidden d3tooltip')
                    .attr('style', 'left: 0px; top: 0px;');
                // console.log(svg.node().getBBox())

                var mouse = d3.mouse(this);
                var print_percentage = 0;
                var available_doses = 0;
                for (var i = 0; i < us_state_distribution.length; i++) {
                    if (d.properties.name === us_state_distribution[i].state) {
                        var percentage_covered = us_state_distribution[i].percentage_covered;
                        print_percentage = (percentage_covered * 100).toFixed(2);
                        available_doses = us_state_distribution[i].doses;
                    }
                }
                tooltip.classed('hidden', false)
                        // .attr("dy", "0em")
                        .html(d.properties.name + ": " + (print_percentage) + "% covered" + "<br/>" +
                            "Doses available: " + abbreviateNumber(available_doses) )
                // console.log(svg.node().getBBox())
                if (screen.width < 768) {
                    tooltip.style('left', '0px')
                        .style('top', "60px");
                }
                else {
                    tooltip.style('left', (mouse[0] + 270) + 'px')
                        .style('top', (mouse[1] + 170) + "px");
                }


                // tooltip.classed('hidden', false)
                //     // .attr("dy", "0em")
                //     .html(d.properties.name + ": " + (print_percentage) + "% covered")
                //     .style('left', (mouse[0] + 270) + 'px')
                //     .style('top', (mouse[1] + 170) + "px");
                var matrix = this.getScreenCTM()
                    .translate(+ this.getAttribute("cx"), + this.getAttribute("cy"));
                // tooltip.html(d.properties.name + ": " + (print_percentage) + "% covered")
                //     .style("left", (window.pageXOffset + matrix.e + 15 + mouse[0]) + "px")
                //     .style("top", (window.pageYOffset + matrix.f - 30 + mouse[1]) + "px");
                // console.log(window.pageXOffset)
                // console.log(matrix)
                    // .attr('style', 'top: ' + (d3.event.pageY) + 'px');
                // console.log(d3.event.pageY)
                console.log(mouse)
                // console.log(tooltip.node().getBoundingClientRect())
                // .text("Doses: " + abbreviateNumber(available_doses))
                // .call(wrap, 120);

                // tooltip.append("foreignObject")
                //     .attr("width", 480)
                //     .attr("height", 500)
                //     .append("xhtml:body")
                //     .style("font", "14px 'Helvetica Neue'")
                //     .html('<p>d.properties.name + ": " + (print_percentage) + "%"</p>');
            })
            .on('mouseout', function () {
                d3.select(".d3tooltip").remove();
                // tooltip.classed('hidden', true);
            });
    }

    var linear = d3.scaleLinear()
        .domain([0, 20, 40, 60, 80, 100])
        .range(d3.schemeYlGn[6]);

    var legend = svg.append("g")
        .attr("class", "legendLinear")
        .attr('transform', `translate(600,20)`);

    var legendLinear = d3.legendColor()
        .title("Percentage Covered(%)")
        .shapeWidth(50)
        .orient('horizontal')
        .scale(linear);
    svg.select(".legendLinear")
        .call(legendLinear);

    d3.select('.legendTitle')
        // text-center: x: (legend width - legendTitle width) / 2
        .attr('transform', `translate(${(legend.node().getBBox().width - d3.select('.legendTitle').node().getBBox().width) / 2},0)`);


    // legend.append('text')
    //     // .attr("x", width -348)
    //     // .attr("y", 5)
    //     .attr("dy", ".35em")
    //     .text("Hi!")
    //     .attr('transform', `translate(0,0)`);


})();