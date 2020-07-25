/**
 * @class Bars
 */
class Bars {

    // Vars
    data_bins = [];

    // Elements
    svg = null;
    g = null;
    xAxisG = null;
    yAxisG = null;

    // Configs
    svgW = 360;
    svgH = 360;
    gMargin = {top: 50, right: 25, bottom: 75, left: 75};
    gW = this.svgW - (this.gMargin.right + this.gMargin.left);
    gH = this.svgH - (this.gMargin.top + this.gMargin.bottom);

    // Tools
    scX = d3.scaleLinear()
            .range([0, this.gW]);
    scY = d3.scaleLinear()
            .range([this.gH, 0]);
    histogram = d3.histogram();
    yAxis = d3.axisLeft().ticks(5);
    xAxis = d3.axisBottom();

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

        // Append axes
        vis.xAxisG = vis.g.append('g')
            .attr('class', 'axis axisX')
            .style('transform', `translateY(${vis.gH + 15}px)`);
        vis.xAxisG.append('text')
            .attr('class', 'label labelX')
            .style('transform', `translate(${vis.gW / 2}px, 40px)`)
            .text('Age');
        vis.yAxisG = vis.g.append('g')
            .attr('class', 'axis axisY')
            .style('transform', 'translateX(-15px)');
        vis.yAxisG.append('text')
            .attr('class', 'label labelY')
            .style('transform', `rotate(-90deg) translate(-${vis.gH / 2}px, -30px)`)
            .text('Total Number of People');


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
        const flagMap = vis.data.map(d => d.flag);
        console.log(flagMap)
        //
        // // Use histogram() to place in bins
        // vis.data_bins = vis.histogram(ageMap);
        //
        // // Update scales
        // vis.scX.domain(d3.extent(ageMap,d => d));
        // vis.scY.domain([0, d3.max(vis.data_bins,d => d.length)]);
        // vis.xAxis.scale(vis.scX).ticks(vis.data_bins.length);
        // vis.yAxis.scale(vis.scY);
        // console.log(d3.max(vis.data_bins,d => d.length))


        // Now render
        vis.render();
    }

    /** @function wrangle()
     * Builds, updates, removes elements in vis
     *
     * @returns void
     */
    render() {
        // Define this vis
        const vis = this;

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
        // vis.xAxisG.call(vis.xAxis);
        // vis.yAxisG.call(vis.yAxis);

    }
}