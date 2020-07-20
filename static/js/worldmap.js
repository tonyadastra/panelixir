
@Component({
  selector: 'app-worldmap',
  templateUrl: './worldmap.component.html',
  styleUrls: ['./worldmap.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  providers: [ApService, FbsService, TclpService]
})
export class WorldmapComponent implements OnInit, OnDestroy {

  /*
  TODO :
   */

  // Inputs
  @Input() geoD;
  @Input() foodD;
  @Input() currentContext;

  // File
  filepath = '/assets/data/world-countries.json';

  // From HTML
  @ViewChild('target', {static: true}) target: ElementRef;

  // Subscriptions
  currentSubscription: any;
  worldServiceSubscription = null;

  // Init selections
  mapSel = null;
  pie1Sel = null;
  pie2Sel = null;
  pie3Sel = null;
  clickSel = null;

  // Vars
  data: [any];
  mapD: any;
  map: any;
  domainD: [any];
  domainDDisplay = [];
  pie1D: [any];
  pie1DDisplay = [];
  pie2D: [any];
  pie2DDisplay = [];
  pie3D: [any];
  pie3DDisplay = [];
  clickSelD = null;
  pie1Nest = [];
  pie2Nest = [];
  pie3Nest = [];

  // Els
  svg: any;
  g: any;
  mapG: any;
  pie1G: any;
  pie2G: any;
  pie3G: any;
  selMapG: any;
  labelG: any;
  detailsLabelTP: any;
  valueLabelTP: any;
  valueLegendG: any;
  elemLabelG: any;
  tooltipG: any;

  // Configs
  w = 630;
  h = 630;
  gM = {top: 20, right: 20, bottom: 20, left: 20};
  gW = this.w - (this.gM.right + this.gM.left);
  gH = this.h - (this.gM.top + this.gM.bottom);
  scale = Math.round(this.gH * 0.47);
  tooltipBigR = Math.round(this.h * 0.04);
  tooltipLilR = Math.round(this.h * 0.01);
  tooltipOffset = this.tooltipBigR / Math.sqrt(2);
  pieWeight = 0.5;
  pieGrabWeight = 20;
  pie1R = this.gH / 2 * 0.77;
  padAngle1 = 0.04;
  minPieAngle1 = 0.01;
  pie2R = this.gH / 2 * 0.86;
  padAngle2 = 0.03;
  minPieAngle2 = 0.0075;
  pie3R = this.gH / 2 * 0.95;
  padAngle3 = 0.02;
  minPieAngle3 = 0.005;
  radialTextOffset = -4;
  radialTextOffsetSel = -15;
  labelR = this.gH / 2 * 1.04;
  legendW = 10;
  colorBetween = 0.25;
  legendMarkW = 12;

  // Tools
  projection = d3.geoOrthographic()
    .translate([this.gW / 2, this.gH / 2])
    .scale(this.scale)
    .center([0, 0])
    .rotate([-18, -3]);
  path = d3.geoPath(this.projection);
  colorScale = d3.scalePow<string>()
    .exponent(1)
    .range(['rgb(255,213,0)', 'rgb(255,132,25)', 'rgb(255,0,59)']);
  rScale = d3.scaleSqrt()
    .range([3, 9]);
  arcLabel = d3.arc();
  legendScale = d3.scaleLinear()
    .range([Math.PI * 0.65, Math.PI * 0.85]);
  arc1 = d3.arc();
  arc2 = d3.arc();
  arc3 = d3.arc();
  pie1 = d3.pie()
    .value((d: any) => Math.abs(d.value.value))
    .sort((a: any, b: any) => b.value.value - a.value.value)
    .padAngle(this.padAngle1);
  pie2 = d3.pie()
    .value((d: any) => Math.abs(d.value.value))
    .sort((a: any, b: any) => b.value.value - a.value.value)
    .padAngle(this.padAngle2);
  pie3 = d3.pie()
    .value((d: any) => Math.abs(d.value.value))
    .sort((a: any, b: any) => b.value.value - a.value.value)
    .padAngle(this.padAngle3);

  /*
  CONSTRUCTOR
   */
  constructor(private worldmapService: WorldmapService) {
    // Pass to header thru service
    this.worldServiceSubscription = this.worldmapService.contextComObserve.subscribe(context => {
      this.currentContext = context;
      this.set_current_selections();
      // Load
      this.launch_data_queries(false);
    });
  }

  /*
  onINIT
   */
  ngOnInit(): void {
    // Set selections
    this.set_current_selections();
    // Load
    this.launch_data_queries(true);
  }

  /*
  onDESTROY
   */
  ngOnDestroy(): void {
    this.currentSubscription.unsubscribe();
  }

  /*
  1. Init: static setup
   */
  init(): void {
    // Capture this vis
    const vis = this;

    // Append svg, g
    vis.svg = d3.select(this.target.nativeElement).append('svg')
      .attr('class', 'mapSvg')
      .attr('width', vis.w).attr('height', vis.h);
    vis.g = vis.svg.append('g').attr('class', 'rootG')
      .style('transform', `translate(${vis.gM.left}px, ${vis.gM.top}px)`);

    // Append labels
    vis.labelG = vis.g.append('g')
      .attr('class', 'labelG')
      .style('transform', `translate(${vis.gW / 2}px, ${vis.gH / 2}px)`);

    // Interior labels
    vis.elemLabelG = vis.labelG.append('g')
      .attr('class', 'elemLabelG');
    vis.elemLabelG.append('defs')
      .append('path')
      .attr('id', `elemLabel`);
    vis.elemLabelG.append('text')
      .attr('class', `labelText`)
      .append('textPath')
      .attr('xlink:href', `#elemLabel`);

    // Exterior labels
    vis.clickSelD = vis.domainD.find(d => d.area_code === vis.clickSel.areaCode);
    vis.arcLabel
      .innerRadius(this.labelR)
      .outerRadius(this.labelR)
      .startAngle(Math.PI * 1.25)
      .endAngle(Math.PI * 2.25);
    vis.labelG.append('defs')
      .append('path')
      .attr('id', `filterLabel`)
      .attr('d', this.arcLabel);
    vis.detailsLabelTP = vis.labelG.append('text')
      .attr('class', `labelText`)
      .append('textPath')
      .attr('startOffset', '25%')
      .attr('xlink:href', `#filterLabel`);
    vis.arcLabel
      .innerRadius(this.labelR * 1.02)
      .outerRadius(this.labelR * 1.02)
      .startAngle(0)
      .endAngle(Math.PI * 0.5);
    vis.labelG.append('defs')
      .append('path')
      .attr('id', `valueLabel`)
      .attr('d', this.arcLabel);
    vis.valueLabelTP = vis.labelG.append('text')
      .attr('class', `labelText labelTextBig`)
      .append('textPath')
      .attr('startOffset', '25%')
      .attr('xlink:href', `#valueLabel`);

    // Add legend
    vis.valueLegendG = vis.labelG.append('g')
      .attr('class', 'valueKeyG');
    const legendGrad = vis.valueLegendG.append('defs')
      .append('linearGradient')
      .attr('id', 'legendGrad')
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', '100%')
      .attr('y2', '0%');
    legendGrad.append('stop');
    legendGrad.append('stop');
    legendGrad.append('stop');
    vis.arcLabel.startAngle(vis.legendScale.range()[0]).endAngle(vis.legendScale.range()[1])
      .innerRadius(this.labelR * 1.02 - vis.legendW / 2)
      .outerRadius(this.labelR * 1.02 + vis.legendW / 2);
    vis.valueLegendG.append('path')
      .attr('class', 'valueLegendPath')
      .attr('d', vis.arcLabel)
      .attr('fill', 'url(#legendGrad)');
    vis.arcLabel.innerRadius(vis.labelR * 1.02 - vis.legendMarkW)
      .outerRadius(this.labelR * 1.02 + vis.legendW / 2);
    vis.valueLegendG.append('path')
      .attr('class', 'valueLegendMarkPath');
    // TODO - kinda janky flip fix
    vis.valueLegendG.append('defs')
      .append('path')
      .style('transform', `scale(1, -1) rotate(270deg)`)
      .attr('id', `valueLegend`);
    vis.valueLegendG.append('text')
      .attr('class', `labelText labelTextSmall`)
      .attr('dy', 13)
      .append('textPath')
      .attr('startOffset', '25%')
      .attr('xlink:href', `#valueLegend`);

    // Build mapG
    vis.mapG = vis.g.append('g').attr('class', 'mapG');
    vis.mapG.append('circle').attr('class', 'mapCirc')
      .attr('r', vis.gH / 2)
      .style('transform', `translate(${vis.gW / 2}px, ${vis.gH / 2}px)`);

    // Build pieG's
    vis.pie1G = vis.g.append('g').attr('class', 'pie1G pieG')
      .style('transform', `translate(${vis.gW / 2}px, ${vis.gH / 2}px)`);
    vis.pie2G = vis.g.append('g').attr('class', 'pie2G pieG')
      .style('transform', `translate(${vis.gW / 2}px, ${vis.gH / 2}px)`);
    vis.pie3G = vis.g.append('g').attr('class', 'pie3G pieG')
      .style('transform', `translate(${vis.gW / 2}px, ${vis.gH / 2}px)`);

    // Build tooltip
    vis.tooltipG = vis.svg.append('g').attr('class', 'tooltipG');
    vis.tooltipG.append('circle').attr('class', 'tooltipCircA').attr('r', vis.tooltipBigR);
    vis.tooltipG.append('circle').attr('class', 'tooltipCircB')
      .attr('r', vis.tooltipLilR)
      .style('cx', -vis.tooltipOffset)
      .style('cy', vis.tooltipOffset);
    vis.tooltipG.append('text').attr('class', 'tooltipText');

    // Wrangle!
    this.wrangle();
  }

  /*
  2. Wrangle: client-side data mgmt
   */
  wrangle(): void {
    // Capture this vis
    const vis = this;

    // Filter data to display
    const fbsBlacklist = ['5000', '5100', '5101', '5102', '5103', '5104', '5105'];
    vis.domainDDisplay = vis.domainD.filter(d => !fbsBlacklist.includes(d.area_code) && d.value > 0);
    vis.clickSelD = vis.domainD.find(d => d.area_code === vis.clickSel.areaCode);
    const elementBlacklist = ['664', '674', '684'];
    vis.pie1DDisplay = vis.pie1D.filter(d => !elementBlacklist.includes(d.element_code) && d.value > 0);
    const itemGroupBlacklist = [];
    vis.pie2DDisplay = vis.pie2D.filter(d => !itemGroupBlacklist.includes(d.item_code) && d.value > 0);
    const itemBlacklist = [];
    vis.pie3DDisplay = vis.pie3D.filter(d => !itemBlacklist.includes(d.item_code) && d.value > 0);

    // Convert topojson to geojson
    const key = 'features';
    vis.map = topojson.feature(vis.mapD, vis.mapD.objects.countries1)[key];
    // Append country data
    vis.map.forEach(d => {
      // Check db results
      let country = this.geoD.db.find(g => g.iso3_code === d.id);
      if (country) {
        d.geoD = country;
        const countryFBS = this.domainDDisplay.find(g => g.area_code === country.country_code);
        if (countryFBS) {
          d.fbsD = countryFBS;
        } else {
          delete d.fbsD;
        }
      } else {
        // Check hard-coded exceptions
        const exception = this.geoD.exceptions.find(e => e.id === d.id);
        if (exception) {
          d.geoDException = exception;
          if (exception.add_to_code !== '') {
            // Check db results
            country = this.geoD.db.find(g => g.iso3_code === exception.add_to_code);
            if (country) {
              d.geoD = country;
              const countryFBS = this.domainDDisplay.find(g => g.area_code === country.country_code);
              if (countryFBS) {
                d.fbsD = countryFBS;
              } else {
                delete d.fbsD;
              }
            }
          }
        }
      }
    });

    // Setup pie charts
    vis.pie1Nest = d3.nest()
      .key((d: any) => d.element_code)
      .rollup((v: any) => v[0])
      .entries(vis.pie1DDisplay);
    vis.pie1Nest = vis.pie1(vis.pie1Nest);
    vis.pie2Nest = d3.nest()
      .key((d: any) => d.item_code)
      .rollup((v: any) => v[0])
      .entries(vis.pie2DDisplay);
    vis.pie2Nest = vis.pie2(vis.pie2Nest);
    vis.pie3Nest = d3.nest()
      .key((d: any) => d.item_code)
      .rollup((v: any) => v[0])
      .entries(vis.pie3DDisplay);
    vis.pie3Nest = vis.pie3(vis.pie3Nest);

    // Config
    const extent = d3.extent(vis.domainDDisplay, (d: any) => +d.value);
    vis.colorScale.domain([extent[0], extent[0] + (extent[1] - extent[0]) * vis.colorBetween, extent[1]]);
    vis.legendScale.domain([extent[1], extent[0]]);

    // Render!
    this.render();
  }

  /*
  3. Render: enter-update-exit pattern
   */
  render(): void {
    // Capture this vis
    const vis = this;

    // Update labels
    vis.detailsLabelTP.text(vis.clickSelD.area + ' | ' + vis.clickSelD.element + ' | ' + vis.clickSelD.item + ' | '
      + vis.clickSelD.year);
    vis.valueLabelTP.text(d3.format(',')(vis.clickSelD.value * vis.currentContext.measure.multiplier) + ' '
      + vis.currentContext.measure.unit);

    // Update legend
    vis.valueLegendG.selectAll('stop')
      .each(function(d, i) {
        const stop = d3.select(this);
        const domain = vis.colorScale.domain();
        // If / else first stop
        if (i === 0) {
          stop
            .attr('offset', '0%')
            .attr('stop-color', vis.colorScale(domain[0]));
        } else if (i === 1) {
          stop
            .attr('offset', `${vis.colorBetween * 100}%`)
            .attr('stop-color', vis.colorScale(domain[1]));
        } else {
          stop
            .attr('offset', '100%')
            .attr('stop-color', vis.colorScale(domain[2]));
        }
      });

    // Build map
    vis.mapG.selectAll('.mapG')
      .data(vis.map, d => d.id)
      .join(
        enter => enter
          .append('g')
          .attr('class', 'mapG')
          .each(function(d) {
            // This
            const mapG = d3.select(this);
            // Append path
            mapG.append('path')
              .attr('class', () => {
                if (d.hasOwnProperty('geoD')) {
                  return 'mapPath mapPathAfrica';
                } else if (d.hasOwnProperty('geoDException')) {
                  return 'mapPath mapPathAfricaException';
                }
                return 'mapPath mapPathWorld';
              })
              .attr('d', vis.path)
              .attr('fill', () => {
                if (d.fbsD && d.fbsD.hasOwnProperty('value')) {
                  return vis.colorScale(d.fbsD.value);
                }
                return 'rgba(0, 0, 0, 1)';
              });
            // Append centroid
            /*if (d.hasOwnProperty('geoD')) {
              const mapG = d3.select(this);
              // Get centroid
              const centroid = vis.path.centroid(d)
              // Pos circle
              const cx = Math.round(centroid[0]);
              const cy = Math.round(centroid[1]);
              // Append circle
              mapG.append('circle')
                .attr('class', 'centroidCirc')
                .attr('r', vis.rScale(d.fbsD.value))
                .attr('cx', cx)
                .attr('cy', cy);
            }*/
          })
          .on('mouseover', e => vis.event_map_mouse(e, 'over'))
          .on('mousemove', e => vis.event_map_mouse(e, 'move'))
          .on('mouseout', e => vis.event_map_mouse(e, 'out'))
          .on('click', e => vis.event_map_click(e)),
        update => update
          .each(function(d) {
            // This
            const mapG = d3.select(this);
            // Append path
            mapG.selectAll('.mapPathAfrica')
              .transition()
              .attr('fill', () => {
                if (d.fbsD && d.fbsD.hasOwnProperty('value')) {
                  return vis.colorScale(d.fbsD.value);
                }
                return 'rgba(0, 0, 0, 1)';
              });
          }),
        exit => exit.remove()
      );

    // Place map sel on top
    if (vis.selMapG) {
      vis.selMapG.parentNode.append(vis.selMapG);
    }

    // Build pies
    vis.pie1G.selectAll('.piece1G')
      .data(vis.pie1Nest, d => d.index)
      .join(
        enter => enter
          .append('g')
          .attr('class', 'piece1G pieceG')
          .each(function(d, i) {
            pie_enter(this, d, 1, 'element', arcTween1);
            // Check if selected
            if (d.data.value.element_code === vis.clickSel.elemCode) {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', true);
            } else {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', false);
            }
          })
          .on('mouseover', e => vis.event_pie_mouse(e, 'over', 1))
          .on('mouseout', e => vis.event_pie_mouse(e, 'out', 1))
          .on('click', e => vis.event_pie_click(e, 'element')),
        update => update
          .each(function(d, i) {
            pie_update(this, d, 1, 'element', arcTween1);
            // Check if selected
            if (d.data.value.element_code === vis.clickSel.elemCode) {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', true);
            } else {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', false);
            }
          }),
        exit => exit.remove()
      )
    ;

    vis.pie2G.selectAll('.piece2G')
      .data(vis.pie2Nest, d => d.index)
      .join(
        enter => enter
          .append('g')
          .attr('class', 'piece2G pieceG')
          .each(function(d, i) {
            pie_enter(this, d, 2, 'item', arcTween2);
            // Check if selected
            if (d.data.value.item_code === vis.clickSel.itemRelCode) {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', true);
            } else {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', false);
            }
          })
          .on('mouseover', e => vis.event_pie_mouse(e, 'over', 2))
          .on('mouseout', e => vis.event_pie_mouse(e, 'out', 2))
          .on('click', e => vis.event_pie_click(e, 'itemRel')),
        update => update
          .each(function(d, i) {
            pie_update(this, d, 2, 'item', arcTween2);
            // Check if selected
            if (d.data.value.item_code === vis.clickSel.itemRelCode) {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', true);
            } else {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', false);
            }
          }),
        exit => exit.remove()
      );

    vis.pie3G.selectAll('.piece3G')
      .data(vis.pie3Nest, d => d.index)
      .join(
        enter => enter
          .append('g')
          .attr('class', 'piece3G pieceG')
          .each(function(d, i) {
            pie_enter(this, d, 3, 'item', arcTween3);
            // Check if selected
            if (d.data.value.item_code === vis.clickSel.itemCode) {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', true);
            } else {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', false);
            }
          })
          .on('mouseover', e => vis.event_pie_mouse(e, 'over', 3))
          .on('mouseout', e => vis.event_pie_mouse(e, 'out', 3))
          .on('click', e => vis.event_pie_click(e, 'item')),
        update => update
          .each(function(d, i) {
            pie_update(this, d, 3, 'item', arcTween3);
            // Check if selected
            if (d.data.value.item_code === vis.clickSel.itemCode) {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', true);
            } else {
              d3.select(this).select('.piePathShow').classed('piePathShowSel', false);
            }
          }),
        exit => exit.remove()
      );

    /* pie_enter */
    function pie_enter(g, d, num, code, arcTween) {
      // Define this
      const pieceG = d3.select(g);
      // Append grab path
      const pathGrab = pieceG.append('path')
        .attr('class', () => `piePathGrab piePath`);
      pathGrab.transition().attrTween('d', arcTween);
      // Append path
      const pathA = pieceG.append('path')
        .attr('class', () => `piePathShow piePath`);
      pathA.transition().attrTween('d', arcTween);
      // Create text pie path
      const pathB = pieceG.append('defs')
        .append('path')
        .attr('id', `pTP_${num + '-' + d.index}`)
        .attr('class', () => `piePathDefs piePath`);
      pathB.transition().attrTween('d', arcTween);
      pieceG.append('text')
        .attr('class', `pieText${num} pieText`)
        .attr('dy', vis.radialTextOffset)
        .append('textPath')
        .attr('xlink:href', `#pTP_${num + '-' + d.index}`)
        .text(() => vis.aux_get_text(d, code));
    }

    /* pie_update */
    function pie_update(g, d, num, code, arcTween) {
      // Define this
      const pieceG = d3.select(g);
      // Update grab path
      pieceG.select('.piePathGrab')
        .transition().attrTween('d', arcTween);
      // Update path
      pieceG.select(`.piePathShow`)
        .transition()
        .attrTween('d', arcTween);
      // Create text pie path
      pieceG.select('defs')
        .select('path')
        .transition()
        .attrTween('d', arcTween);
      pieceG.select('text')
        .select('textPath').text(() => {
        // Return
        return vis.aux_get_text(d, code);
      });
    }

    /* arcTween1 */
    function arcTween1(a) {
      const i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function(t) {
        if (this.classList.contains('piePathGrab')) {
          vis.arc1
            .innerRadius(vis.pie1R)
            .outerRadius(vis.pie1R + vis.pieGrabWeight)
            .startAngle(i(t).startAngle - vis.minPieAngle1 * 2)
            .endAngle(i(t).endAngle + vis.minPieAngle1 * 2);
        } else if (this.classList.contains('piePathShow')) {
          vis.arc1
            .innerRadius(vis.pie1R)
            .outerRadius(vis.pie1R + vis.pieWeight)
            .startAngle(i(t).startAngle - vis.minPieAngle1)
            .endAngle(i(t).endAngle + vis.minPieAngle1);
        } else {
          vis.arc1
            .innerRadius(vis.pie1R)
            .outerRadius(vis.pie1R)
            .startAngle(i(t).startAngle - vis.minPieAngle1)
            .endAngle(i(t).endAngle + vis.minPieAngle1);
        }
        return vis.arc1(i(t));
      };
    }

    /* arcTween2 */
    function arcTween2(a) {
      const i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function(t) {
        if (this.classList.contains('piePathGrab')) {
          vis.arc2
            .innerRadius(vis.pie2R)
            .outerRadius(vis.pie2R + vis.pieGrabWeight)
            .startAngle(i(t).startAngle - vis.minPieAngle2 * 2)
            .endAngle(i(t).endAngle + vis.minPieAngle2 * 2);
        } else if (this.classList.contains('piePathShow')) {
          vis.arc2
            .innerRadius(vis.pie2R)
            .outerRadius(vis.pie2R + vis.pieWeight)
            .startAngle(i(t).startAngle - vis.minPieAngle2)
            .endAngle(i(t).endAngle + vis.minPieAngle2);
        } else {
          vis.arc2
            .innerRadius(vis.pie2R)
            .outerRadius(vis.pie2R)
            .startAngle(i(t).startAngle - vis.minPieAngle2)
            .endAngle(i(t).endAngle + vis.minPieAngle2);
        }
        return vis.arc2(i(t));
      };
    }

    /* arcTween3 */
    function arcTween3(a) {
      const i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function(t) {
        if (this.classList.contains('piePathGrab')) {
          vis.arc3
            .innerRadius(vis.pie3R)
            .outerRadius(vis.pie3R + vis.pieGrabWeight)
            .startAngle(i(t).startAngle - vis.minPieAngle3 * 2)
            .endAngle(i(t).endAngle + vis.minPieAngle3 * 2);
        } else if (this.classList.contains('piePathShow')) {
          vis.arc3
            .innerRadius(vis.pie3R)
            .outerRadius(vis.pie3R + vis.pieWeight)
            .startAngle(i(t).startAngle - vis.minPieAngle3)
            .endAngle(i(t).endAngle + vis.minPieAngle3);
        } else {
          vis.arc3
            .innerRadius(vis.pie3R)
            .outerRadius(vis.pie3R)
            .startAngle(i(t).startAngle - vis.minPieAngle3)
            .endAngle(i(t).endAngle + vis.minPieAngle3);
        }
        return vis.arc3(i(t));
      };
    }

  }

  /*
  aux_get_text
   */
  aux_get_text(d: any, code: string): string {
    // Ck text length
    const radPerLetter = 0.03;
    const length = d.data.value[code].length;
    const radSpace = d.endAngle - d.startAngle;
    const maxLength = Math.floor(radSpace / radPerLetter) - 1;
    if (length > maxLength) {
      if (radSpace > radPerLetter) {
        if (d.data.value[code].substring(0, maxLength).length > 1) {
          return d.data.value[code].substring(0, maxLength) + '.';
        }
      }
    } else {
      return d.data.value[code];
    }
  }

  /*
  event_map_click
   */
  event_map_click(e) {
    // Capture this vis
    const vis = this;
    // Get new area
    if (e.hasOwnProperty('geoD') && e.hasOwnProperty('fbsD')) {
      // Update selections
      if (vis.pie1Sel.areaCode === e.geoD.country_code && vis.pie2Sel.areaCode === e.geoD.country_code &&
        vis.pie3Sel.areaCode === e.geoD.country_code) {
        // Update map selection
        vis.selMapG = null;
        vis.clickSel.areaCode = '5100';
        // Update styles
        d3.select(d3.event.target).classed('mapPathAfricaSel', false);
        // If clicked twice revert to Africa TODO - change to domain data
        vis.pie1Sel.areaCode = '5100';
        vis.pie2Sel.areaCode = '5100';
        vis.pie3Sel.areaCode = '5100';
      } else {
        // Update map selection
        vis.selMapG = d3.event.currentTarget;
        vis.clickSel.areaCode = e.geoD.country_code;
        // Update styles
        d3.select(vis.target.nativeElement).selectAll('.mapPathAfricaSel').classed('mapPathAfricaSel', false);
        d3.select(d3.event.target).classed('mapPathAfricaSel', true);
        d3.event.currentTarget.parentNode.append(d3.event.currentTarget);
        // Update data
        vis.pie1Sel.areaCode = e.geoD.country_code;
        vis.pie2Sel.areaCode = e.geoD.country_code;
        vis.pie3Sel.areaCode = e.geoD.country_code;
      }
      // Load
      this.launch_data_queries(false);
    }
  }

  /*
  event_map_mouse
   */
  event_map_mouse(e, action) {
    // Capture this vis
    const vis = this;
    // if 'over', if 'move'
    if (action === 'over' || action === 'move') {
      // Make vis and move
      vis.tooltipG
        .classed('tooltipVis', true)
        .style('transform', () => {
          const x = d3.event.offsetX + vis.tooltipOffset;
          const y = d3.event.offsetY - vis.tooltipOffset - vis.tooltipLilR / 2;
          return `translate(${x}px, ${y}px)`;
        });
      // If over
      if (action === 'over') {
        vis.tooltipG.select('text')
          .text(() => {
            if (e.hasOwnProperty('geoD')) {
              return e.geoD.iso3_code;
            }
            return e.id;
          });
        // Update legend
        if (e.hasOwnProperty('fbsD')) {
          vis.arcLabel
            .startAngle(vis.legendScale(e.fbsD.value) - 0.003)
            .endAngle(vis.legendScale(e.fbsD.value) + 0.003);
          vis.valueLegendG.select('.valueLegendMarkPath')
            .classed('valueLegendMarkPathVis', true)
            .transition()
            .attr('d', vis.arcLabel);
          vis.arcLabel
            .startAngle(vis.legendScale(vis.legendScale.domain()[0] - e.fbsD.value) - 1)
            .endAngle(vis.legendScale(vis.legendScale.domain()[0] - e.fbsD.value) + 1);
          vis.valueLegendG.select('#valueLegend')
            .transition()
            .attr('d', vis.arcLabel);
          vis.valueLegendG.select('textPath')
            .text(d3.format(',')(e.fbsD.value * vis.currentContext.measure.multiplier));
        }
      }
    } else {
      vis.tooltipG.classed('tooltipVis', false);
      vis.valueLegendG.select('.valueLegendMarkPath')
        .classed('valueLegendMarkPathVis', false);
      vis.valueLegendG.select('textPath')
        .text('');
      // d3.select(d3.event.target).classed('mapPathSel', false); TODO - maybe remove
    }

    /* arcTween TODO - transition not working */
    function arcTween(a) {
      const i = d3.interpolate(this._current, a);
      this._current = i(0);
      return t => {
        vis.arcLabel
          .startAngle(vis.legendScale(e.fbsD.value) - 0.003)
          .endAngle(vis.legendScale(e.fbsD.value) + 0.003);
        return vis.arcLabel(i(t));
      };
    }
  }

  /*
  event_pie_click
   */
  event_pie_click(e, domain) {
    // Capture this vis
    const vis = this;
    // Update selections
    if (domain === 'element') {
      this.clickSel.elemCode = e.data.value.element_code;
      this.mapSel.elemCode = e.data.value.element_code;
      this.pie2Sel.elemCode = e.data.value.element_code;
      this.pie3Sel.elemCode = e.data.value.element_code;
    } else if (domain === 'itemRel') {
      this.clickSel.itemRelCode = e.data.value.item_code;
      this.mapSel.itemCode = e.data.value.item_code;
      this.pie1Sel.itemCode = e.data.value.item_code;
      this.pie3Sel.itemRelCode = e.data.value.item_code;
    } else if (domain === 'item') {
      if (this.mapSel.itemCode === e.data.value.item_code) {
        // If clicked twice revert to Grand Total
        this.clickSel.itemCode = '';
        this.mapSel.itemCode = this.clickSel.itemRelCode;
        this.mapSel.itemCat = 'group';
        this.pie1Sel.itemCode = this.clickSel.itemRelCode;
        this.pie1Sel.itemCat = 'group';
        this.pie2Sel.itemRelCode = 'zote';
      } else {
        this.clickSel.itemCode = e.data.value.item_code;
        this.mapSel.itemCode = e.data.value.item_code;
        this.mapSel.itemCat = 'item';
        this.pie1Sel.itemCode = e.data.value.item_code;
        this.pie1Sel.itemCat = 'item';
        this.pie2Sel.itemRelCode = e.data.value.item_code;
      }
    }
    // Load
    this.launch_data_queries(false);
  }

  /*
  event_pie_mouse
   */
  event_pie_mouse(e, action, loc) {
    // Capture this vis
    const vis = this;
    // Define arc
    const arc = loc === 1 ? vis.arc1 : (loc === 2 ? vis.arc2 : vis.arc3);
    const pieR = loc === 1 ? vis.pie1R : (loc === 2 ? vis.pie2R : vis.pie3R);
    const minPieAngle = loc === 1 ? vis.minPieAngle1 : (loc === 2 ? vis.minPieAngle2 : vis.minPieAngle3);
    const key = loc === 1 ? 'element' : 'item';
    // Discover type of
    const show = action !== 'out';
    // Get the g
    const g = d3.select(d3.event.currentTarget);
    // if 'over', if 'move', else if 'out'
    if (action === 'over' || action === 'move') {
      g.select('.piePathDefs')
        .transition()
        .attrTween('d', arcTween);
      g.select('.pieText')
        .transition()
        .duration(100)
        .attr('dy', vis.radialTextOffsetSel);
      g.select('textPath').text((d: any) => {
        return d.data.value[key] + ': ' + d3.format(',')(d.data.value.value * vis.currentContext.measure.multiplier);
      });
    } else {
      g.select('.piePathDefs')
        .transition()
        .attrTween('d', arcTween);
      g.select('.pieText')
        .transition()
        .duration(100)
        .attr('dy', vis.radialTextOffset);
      g.select('textPath').text((d: any) => {
        // Return
        return vis.aux_get_text(d, key);
      });
    }

    /* arcTween */
    function arcTween(a) {
      const i = d3.interpolate(this._current, a);
      this._current = i(0);
      return t => {
        arc
          .innerRadius(pieR)
          .outerRadius(pieR)
          .startAngle(i(t).startAngle - minPieAngle)
          .endAngle(i(t).endAngle + (show ? Math.PI : minPieAngle));
        return arc(i(t));
      };
    }
  }

  /*
  launch_data_queries
   */
  launch_data_queries(init): void {
    // Load data
    const promises = [this.load_map_data(), this.load_current_data(this.mapSel), this.load_current_data(this.pie1Sel),
      this.load_current_data(this.pie2Sel), this.load_current_data(this.pie3Sel)];
    Promise.all(promises).then(d => {
      this.mapD = d[0];
      this.domainD = d[1];
      this.pie1D = d[2];
      this.pie2D = d[3];
      this.pie3D = d[4];
      // Init!
      if (init) {
        this.init();
      } else {
        this.wrangle();
      }
    }).catch(err => console.log(err));
  }

  /*
  load_map_data(): static setup
   */
  async load_map_data(): Promise<any> {
    // Capture this vis
    const vis = this;
    // Load json files
    return d3.json(vis.filepath);
  }

  /*
  load_current_data():
   */
  load_current_data(sel: any): Promise<any> {
    // Subscribe
    return new Promise(res => {
      this.currentSubscription = this.currentContext.service.getBy(sel)
        .subscribe((d: [any]) => {
          res(d);
        });
    });
  }

  /*
  set_current_selections
   */
  set_current_selections() {
    this.mapSel = JSON.parse(JSON.stringify(this.currentContext.selections.mapSel));
    this.pie1Sel = JSON.parse(JSON.stringify(this.currentContext.selections.pie1Sel));
    this.pie2Sel = JSON.parse(JSON.stringify(this.currentContext.selections.pie2Sel));
    this.pie3Sel = JSON.parse(JSON.stringify(this.currentContext.selections.pie3Sel));
    this.clickSel = JSON.parse(JSON.stringify(this.currentContext.selections.clickSel));
  }

}

/*
Ref.
https://github.com/d3/d3-geo/tree/v1.12.0
https://github.com/deldersveld/topojson
https://observablehq.com/@d3/world-map-svg
https://github.com/d3/d3-shape/blob/v1.3.7/README.md#pies
https://jonsadka.com/blog/how-to-create-adaptive-pie-charts-with-transitions-in-d3
 */
