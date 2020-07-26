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
            // window.location.replace('/');
        },
    });
});

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
                window.localStorage.setItem('vis', 'vis3')
                // d3.selectAll('#').remove()
                d3.select('#vis2').remove()
                let svgW = 700;
                let svgH = 360;
                let gMargin = {top: 50, right: 25, bottom: 75, left: 75};
                let states = ['Pre-Clinical', 'Phase I', 'Phase II', 'Phase III', 'Approval'];
                let currentState = 'Approval'
                segmentWidth = 95;
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
                return colorScale(currentState);
            })
            .attr('height', 15)
            .attr('width', function(){
                const index = states.indexOf(currentState);
                // console.log(index)
                return (index + 1) * segmentWidth;
            })
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('x', 100)
            .attr('y', 50 + 60 * i);


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
                .attr('x', 95)
                .attr('y', 10);

                // bars = new Bars(response.bars_data, 'vis3')
                // console.log(bars)

                },
            });
        }
    }, 150)
});