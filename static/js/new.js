/**
 * @class Template
 */
class Worldmap {
  /*
  Constructor
   */
  constructor(_data, _target) {
    // Elements
    svg = null;
    g = null;

    // Configs
    svgW = 950;
    svgH = 700;
    gMargin = { top: 0, right: 0, bottom: 0, left: 0 };
    gW = this.svgW - (this.gMargin.right + this.gMargin.left);
    gH = this.svgH - (this.gMargin.top + this.gMargin.bottom);

    // Tools
    projection = d3.geoOrthographic()
      .scale(300)
      .translate([this.svgW / 2, this.svgH / 2])
      .clipAngle(90)
      .precision(10);
    path = d3.geoPath()
      .projection(this.projection);
    graticule = d3.geoGraticule();
    colors = { clickable: 'darkgrey', hover: 'grey', clicked: "red", clickhover: "darkred" };

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
    vis.map = d3.select(`#${vis.target}`)
      .append('svg')
      .attr('width', vis.svgW)
      .attr('height', vis.svgH)
      .attr('class', "map")
    // vis.g = vis.svg.append('g')
    //     .attr('class', 'container')
    //     .style('transform', `translate(${vis.gMargin.left}px, ${vis.gMargin.top}px)`);
    vis.map.append("defs").append("path")
      .datum({ type: "Sphere" })
      .attr("id", "sphere")
      .attr("d", vis.path);

    vis.map.append("use")
      .attr("class", "stroke")
      .attr("xlink:href", "#sphere");

    vis.map.append("use")
      .attr("class", "fill")
      .attr("xlink:href", "#sphere");

    vis.map.append("path")
      .datum(vis.graticule)
      .attr("class", "graticule")
      .attr("d", vis.path);

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
    //     var width = 950,
    // height = 700;



    var files = ["/data/map.json", "/data/world-country-names.tsv"];

    Promise.all(files.map(url => d3.json(url))).then(function (values) {
      console.log(values)
    });

    // queue()
    //     .defer(d3.json, "/data/map.json")
    //     .defer(d3.tsv, "/data/world-country-names.tsv")
    //     .await(ready);

    function ready(error, world, names) {
      if (error) throw error;

      var globe = { type: "Sphere" },
        land = topojson.feature(world, world.objects.land),
        countries = topojson.feature(world, world.objects.countries).features,
        borders = topojson.mesh(world, world.objects.countries, function (a, b) { return a !== b; });

      countries = countries.filter(function (d) {
        return names.some(function (n) {
          if (d.id == n.id) return d.name = n.name;
        });
      }).sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

      vis.map.insert("path", ".graticule")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", vis.path);

      for (i = 0; i < names.length; i++) {
        for (j = 0; j < countries.length; j++) {
          if (countries[j].id == names[i].id) {
            vis.map.insert("path", ".graticule")
              .datum(countries[j])
              .attr("fill", vis.colors.clickable)
              .attr("d", vis.path)
              .attr("class", "clickable")
              .attr("data-country-id", j)
              .on("click", function () {
                d3.selectAll(".clicked")
                  .classed("clicked", false)
                  .attr("fill", vis.colors.clickable);
                d3.select(this)
                  .classed("clicked", true)
                  .attr("fill", vis.colors.clicked);

                (function transition() {
                  d3.select(".clicked").transition()
                    .duration(1250)
                    .tween("rotate", function () {
                      var p = d3.geoCentroid(countries[d3.select(this).attr("data-country-id")]),
                        r = d3.interpolate(vis.projection.rotate(), [-p[0], -p[1]]);
                      return function (t) {
                        vis.projection.rotate(r(t));
                        vis.map.selectAll("path").attr("d", vis.path);
                      }
                    });
                })();
              })
              .on("mousemove", function () {
                var c = d3.select(this);
                if (c.classed("clicked")) {
                  c.attr("fill", vis.colors.clickhover);
                } else {
                  c.attr("fill", vis.colors.hover);
                }
              })
              .on("mouseout", function () {
                var c = d3.select(this);
                if (c.classed("clicked")) {
                  c.attr("fill", vis.colors.clicked);
                } else {
                  d3.select(this).attr("fill", vis.colors.clickable);
                }
              });
          }
        }
      }
      vis.map.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function (a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", vis.path);

    };

    d3.select(self.frameElement).style("height", vis.svgH + "px");

  }
}