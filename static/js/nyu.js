function changeSize() {
            vis.svg.selectAll('rect.progress-rect').remove()
            console.log('removed')
            vis.data = window.bars_data_response
            console.log(window.bars_data_response)
            vis.flagMap = window.bars_data_response.map(d => d.flag);
            vis.companyMap = window.bars_data_response.map(d => d.company)
            vis.stageMap = window.bars_data_response.map(d => d.stage)
            // console.log(vis.stageMap)
            for (let i = 0; i < vis.stageMap.length; i++){
            if (vis.stageMap[i] === 0) {
                vis.currentState = 'Pre-Clinical'
            } else if (vis.stageMap[i] === 1){
                vis.currentState = 'Phase I'
            } else if (vis.stageMap[i] === 2){
                vis.currentState = 'Phase II'
            } else if (vis.stageMap[i] === 3){
                vis.currentState = 'Phase III'
            } else if (vis.stageMap[i] === 4) {
                vis.currentState = 'Approval'
            }

        vis.svg.append('rect')
            .attr('class', 'progress-rect')
            .attr('fill', function(){
                return vis.colorScale(vis.currentState);
            })
            .attr('height', 15)
            .attr('width', function(){
                const index = vis.states.indexOf(vis.currentState);
                // console.log(index)
                return (index + 1) * vis.segmentWidth;
            })
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('x', 100)
            .attr('y', 50 + 60 * i);


        // vis.svg.append('svg:image')
        //     .attr({
        //       'xlink:href': 'http://www.iconpng.com/png/beautiful_flat_color/computer.png',  // can also add svg file here
        //     })
        //     .attr('height', 20)
        //     .attr('x', function(){
        //         const index = vis.states.indexOf(vis.currentState);
        //         return (index + 1) * vis.segmentWidth + 5;
        //     })
        //     .attr('y', 50 + 60 * i);

            }
            console.log('updated')
        }
        // Add an event listener to the button created in the html part
        // d3.select("#World").on("click", changeSize)
        // d3.select("#NorthAmerica").on("click", changeSize)
        // d3.select("#Europe").on("click", changeSize)
        // d3.select("#Asia").on("click", changeSize)
        // d3.select("#Oceania").on("click", changeSize)