// When page is loaded...
$(document).ready(function () {
    var continent = "World";
    var processing = false;
    $.ajax({
        url: "/update_continent",
        type: "get",
        async: true,
        data: { continent: continent },
        success: function (response) {
            // console.log(response)
            $("#progressbar").html(response);
            setTimeout(function () {
                if (!processing){
                    processing = true;
                    $.ajax({
                    url: "/get_bars_data",
                    type: "get",
                    async: true,
                    data: { continent: continent },
                    success: function (response) {
                        window.bars_data_response = response.bars_data
                        console.log(window.bars_data_response)
                    },
                    });
                }
            }, 50);

            setTimeout(function () {
                if (processing){
                    processing = false;
                    $.ajax({
                    url: "/get_bars_data",
                    type: "get",
                    async: true,
                    data: { continent: continent },
                    success: function (response) {
                        // Call d3 function
                        window.bars_data_response = response.bars_data
                        console.log(window.bars_data_response)
                        // d3.selectAll('#').remove()
                        let svgW = 700;
                        let svgH = 360;
                        let gMargin = {top: 50, right: 25, bottom: 75, left: 75};
                        let states = ['Pre-Clinical', 'Phase I', 'Phase II', 'Phase III', 'Approval'];
                        let currentState = 'Pre-Clinical'
                        let progressStart = 130;
                        let segmentWidth = 95;
                        svg = d3.select('#vis2')
                            .append('svg')
                            .attr('id', 'vis2')
                            .attr('width', svgW)
                            .attr('height', svgH);

                        colorScale = d3.scaleOrdinal()
                            .domain(states)
                            .range(['#c1c8e4', '#84ceeb', '#5ab9ea',
                                    '#88bdbc', '#3aafa9']);

                        data = window.bars_data_response
                        console.log(window.bars_data_response)
                        let flagMap = window.bars_data_response.map(d => d.flag);
                        let companyMap = window.bars_data_response.map(d => d.company)
                        let stageMap = window.bars_data_response.map(d => d.stage)

                        for (let i = 0; i < stageMap.length; i++){
                            if (stageMap[i] === 0) {
                                currentState = 'Pre-Clinical'
                            } else if (stageMap[i] === 1){
                                currentState = 'Phase I'
                            } else if (stageMap[i] === 2){
                                currentState = 'Phase II'
                            } else if (stageMap[i] === 3){
                                currentState = 'Phase III'
                            } else if (stageMap[i] === 4) {
                                currentState = 'Approval'
                            }

                        svg.append('rect')
                            .attr('class', 'progress-rect')
                            .attr('fill', function(){
                                return colorScale('Pre-Clinical');
                            })
                            .attr('height', 15)
                            .attr('width', function(){
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
                      .text(companyMap[i])
                      .call(wrap, 120);

                    let height = parseInt(svg.select('text').node().getBoundingClientRect().height);

                    svg.select('text').attr('transform', 'translate(0, ' + (-height / 2) + ')');

                    yTrack += (parseInt(height / 2) + 10);


                    function wrap(text, width) {
                      text.each(function() {
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

                // svg.append('svg:image')
                //     .attr({
                //       'xlink:href': 'http://www.iconpng.com/png/beautiful_flat_color/computer.png',  // can also add svg file here
                //     })
                //     .attr('height', 20)
                //     .attr('x', function(){
                //         const index = states.indexOf(currentState);
                //         return (index + 1) * segmentWidth + 5;
                //     })
                //     .attr('y', 50 + 60 * i);

                    }
                    svg.append('rect')
                        .attr('class', 'border')
                        .attr('rx', 10)
                        .attr('ry', 10)
                        .attr('fill', 'orange')
                        .attr('height', 350)
                        .attr('width', 10)
                        .attr('x', progressStart - 5)
                        .attr('y', 10);

                        // bars = new Bars(response.bars_data, 'vis3')
                        // console.log(bars)

                        },
                    });
                }
    }, 150)

        },
    });
});


// When Interactive Buttons are Clicked...
$('.button-font').on('click', function () {
    var processing = false;
    var continent = $(this).data("value");
    setTimeout(function () {
        if (!processing) {
            processing = true;
            $.ajax({
                url: "/update_continent",
                type: "get",
                async: true,
                data: {continent: continent},
                success: function (response) {
                    // console.log(response)
                    $("#progressbar").html(response);
                }
            })
        }
    }, 50);
    // processing = false;

    setTimeout(function () {
        if (processing){
            processing = false;
            $.ajax({
            url: "/get_bars_data",
            type: "get",
            async: true,
            data: { continent: continent },
            success: function (response) {
                // Call d3 function
                window.bars_data_response = response.bars_data
                console.log(window.bars_data_response)
                // d3.selectAll('#').remove()
                d3.select('#vis2').remove()
                let svgW = 700;
                let svgH = 360;
                let gMargin = {top: 50, right: 25, bottom: 75, left: 75};
                let states = ['Pre-Clinical', 'Phase I', 'Phase II', 'Phase III', 'Approval'];
                let currentState = 'Pre-Clinical'
                let progressStart = 130;
                let segmentWidth = 95;
                svg = d3.select('#vis3')
                    .append('svg')
                    .attr('id', 'vis2')
                    .attr('width', svgW)
                    .attr('height', svgH);

                colorScale = d3.scaleOrdinal()
                    .domain(states)
                    .range(['#c1c8e4', '#84ceeb', '#5ab9ea',
                            '#88bdbc', '#3aafa9']);

                data = window.bars_data_response
                console.log(window.bars_data_response)
                let flagMap = window.bars_data_response.map(d => d.flag);
                let companyMap = window.bars_data_response.map(d => d.company)
                let stageMap = window.bars_data_response.map(d => d.stage)

                for (let i = 0; i < stageMap.length; i++){
                    if (stageMap[i] === 0) {
                        currentState = 'Pre-Clinical'
                    } else if (stageMap[i] === 1){
                        currentState = 'Phase I'
                    } else if (stageMap[i] === 2){
                        currentState = 'Phase II'
                    } else if (stageMap[i] === 3){
                        currentState = 'Phase III'
                    } else if (stageMap[i] === 4) {
                        currentState = 'Approval'
                    }

                svg.append('rect')
                    .attr('class', 'progress-rect')
                    .attr('fill', function(){
                        return colorScale('Pre-Clinical');
                    })
                    .attr('height', 15)
                    .attr('width', function(){
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
              .text(companyMap[i])
              .call(wrap, 120);

            let height = parseInt(svg.select('text').node().getBoundingClientRect().height);

            svg.select('text').attr('transform', 'translate(0, ' + (-height / 2) + ')');

            yTrack += (parseInt(height / 2) + 10);


            function wrap(text, width) {
              text.each(function() {
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

        // svg.append('svg:image')
        //     .attr({
        //       'xlink:href': 'http://www.iconpng.com/png/beautiful_flat_color/computer.png',  // can also add svg file here
        //     })
        //     .attr('height', 20)
        //     .attr('x', function(){
        //         const index = states.indexOf(currentState);
        //         return (index + 1) * segmentWidth + 5;
        //     })
        //     .attr('y', 50 + 60 * i);

            }
            svg.append('rect')
                .attr('class', 'border')
                .attr('rx', 10)
                .attr('ry', 10)
                .attr('fill', 'orange')
                .attr('height', 350)
                .attr('width', 10)
                .attr('x', progressStart - 5)
                .attr('y', 10);

                // bars = new Bars(response.bars_data, 'vis3')
                // console.log(bars)

                },
            });
        }
    }, 150)
});