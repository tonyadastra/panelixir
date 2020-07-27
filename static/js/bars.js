/**
 * @class Bars
 */
class Bars {

    // Variables
    flagMap = [];
    companyMap = []
    stageMap = [];

    // Elements
    svg = null;
    g = null;
    xAxisG = null;
    yAxisG = null;
    progress = null;
    Rank2 = null;
    Rank3 = null;
    Rank4 = null;
    Rank5 = null;

    // Configs
    svgW = 700;
    svgH = 360;
    gMargin = {top: 50, right: 25, bottom: 75, left: 75};
    gW = this.svgW - (this.gMargin.right + this.gMargin.left);
    gH = this.svgH - (this.gMargin.top + this.gMargin.bottom);

    // Progress Configs
    progressStart = 130;
    segmentWidth = 95;


    // Tools
    t = d3.transition()
        .ease(d3.easeLinear)

    // Colors

    states = ['Pre-Clinical', 'Phase I', 'Phase II', 'Phase III', 'Approval'];
    currentState = 'Pre-Clinical'


	colorScale = d3.scaleOrdinal()
		.domain(this.states)
		.range(['#c1c8e4', '#84ceeb', '#5ab9ea',
                '#88bdbc', '#3aafa9']);

    /*
    Constructor
     */
    constructor(_data, _target) {
        // Assign parameters as object fields
        this.data = _data;
        this.target = _target;

        // Now init
        this.init();
    }

    /** @function init()
     * Perform one-time setup function
     *
     * @returns void
     */
    init() {
        // Define this vis
        const vis = this;

        // Set up the svg/g work space
        vis.svg = d3.select(`#${vis.target}`)
            .append('svg')
            .attr('width', vis.svgW)
            .attr('height', vis.svgH);
        vis.g = vis.svg.append('g')
            .attr('class', 'container')
            .style('transform', `translate(${vis.gMargin.left}px, ${vis.gMargin.top}px)`);
        // Now wrangle
        vis.wrangle();
    }

    /** @function wrangle()
     * Preps data for vis
     *
     * @returns void
     */
    wrangle() {
        // Define this vis
        const vis = this;

        // Map ages
        vis.flagMap = vis.data.map(d => d.flag);
        vis.companyMap = vis.data.map(d => d.company)
        vis.stageMap = vis.data.map(d => d.stage)
        console.log(vis.stageMap)


        for (let i = 0; i < vis.stageMap.length; i++) {
            if (vis.stageMap[i] === 0) {
                    vis.currentState = 'Pre-Clinical'
                        // moveProgressBar(vis.currentState)
                } else if (vis.stageMap[i] === 1){
                    vis.currentState = 'Phase I'
                        // moveProgressBar(vis.currentState)
                } else if (vis.stageMap[i] === 2){
                    vis.currentState = 'Phase II'
                        // moveProgressBar(vis.currentState)
                } else if (vis.stageMap[i] === 3){
                    vis.currentState = 'Phase III'
                        // moveProgressBar(vis.currentState)
                } else if (vis.stageMap[i] === 4) {
                    vis.currentState = 'Approval'
                        // moveProgressBar(vis.currentState)
                }

            vis.progress = vis.svg.append('rect')
                .attr('class', 'progress-rect')
                .attr('fill', function () {
                    return vis.colorScale('Pre-Clinical');
                })
                .attr('height', 15)
                .attr('width', function () {
                    const index = vis.states.indexOf('Pre-Clinical');
                    // console.log(index)
                    return (index + 1) * vis.segmentWidth;
                })
                .attr('rx', 10)
                .attr('ry', 10)
                .attr('x', vis.progressStart)
                .attr('y', 50 + 60 * i)
                .transition()
                .duration(2000)
                .attr('fill', function () {
                    return vis.colorScale(vis.currentState);
                })
                .attr('width', function () {
                    var index = vis.states.indexOf(vis.currentState);
                    return (index + 1) * vis.segmentWidth;
                })
                .delay(function (d, i) {
                    return i * 200;
                });
            

            let yTrack = 45;
            
            
            vis.svg.append("text")
              .attr("x", 60)
              .attr("y", yTrack + i * 60)
              .attr("text-anchor", "middle")
              .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
              .text(vis.companyMap[i])
              .call(wrap, 120);
            
            let height = parseInt(vis.svg.select('text').node().getBoundingClientRect().height);
            
            vis.svg.select('text').attr('transform', 'translate(0, ' + (-height / 2) + ')');
            
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

            // moveProgressBar(vis.currentState)

            }

            // for (let i = 0; i < vis.stageMap.length; i++){
            //
            //
            //
            //
            //     console.log(vis.currentState)
            // }

        vis.svg.append('rect')
            .attr('class', 'border')
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('fill', 'orange')
            .attr('height', 350)
            .attr('width', 10)
		    .attr('x', vis.progressStart - 5)
            .attr('y', 10);




        function moveProgressBar(state){
		d3.selectAll('.progress-rect').transition()
            .delay(function(d, i) { return i * 500; })
			.duration(2000)
			.attr('fill', function(){
				return vis.colorScale(state);
			})
			.attr('width', function(){
				var index = vis.states.indexOf(state);
				return (index + 1) * vis.segmentWidth;
			})
	}
        // Now render
        vis.render();
    }

    /** @function render()
     * Builds, updates, removes elements in vis
     *
     * @returns void
     */
    render() {
        // Define this vis
        const vis = this;
        // if (this.hasAttribute('data-img')) {
        //     const imgUrlArr = this.getAttribute('data-img').split(',')
        //     imgUrlArr.forEach((imgUrl) => {
        //         imgUrl = imgUrl.replace(/\s|\'|\]|\[/g, '');
        //         const img = document.createElement('img');
        //         img.setAttribute('height', '60px');
        //         img.src = imgUrl;
        //         wrapper.appendChild(img);
        //     })
        // } else {
        //     let imgUrl = '../static/img/Untitled.png';
        //     const img = document.createElement('img');
        //     img.setAttribute('height', '40px');
        //     img.src = imgUrl;
        //     wrapper.appendChild(img);
        // }





    //     vis.Rank1.transition()
    //         .duration(1000)
    //         .attr('width', function(){
    //             var index = vis.states.indexOf(vis.currentState);
    //             return (index + 1) * vis.segmentWidth;
    //         });
    //     function moveRank1(state){
	// 	vis.Rank1.transition()
	// 		.duration(1000)
	// 		.attr('fill', function(){
	// 			return vis.colorScale(state);
	// 		})
	// 		.attr('width', function(){
	// 			var index = vis.states.indexOf(state);
	// 			return (index + 1) * vis.segmentWidth;
	// 		});
	// }
	// moveRank1(3)


        // Build bars
        // vis.g.selectAll('.barG')
        //     .data(vis.data_bins)
        //     .join(
        //         enter => enter
        //             .append('g')
        //             .attr('class', 'barG')
        //             .each(function(d, i) {
        //                 // Define this
        //                 // console.log(d)
        //                 const g = d3.select(this);
        //
        //                 // Get dims
        //                 const w = vis.gW / vis.data_bins.length;
        //                 const h = vis.scY(d.length);
        //                 // console.log(w)
        //                 // Position
        //                 g.style('transform', `translate(${i * w}px, ${h}px)`);
        //
        //                 // Append rect
        //                 g.append('rect')
        //                     .attr('width', Math.floor(w * 0.8))
        //                     .attr('height', vis.gH - h)
        //                     .attr('x', Math.floor(w * 0.1))
        //                     .attr('fill', 'rgb(255,103,0)');

            //         })
            // );

        // Update axis

    }
}

