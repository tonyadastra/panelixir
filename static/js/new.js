map = {
  aInternal: 10,
  aListener: function (val) { },
  set continent(val) {
    this.aInternal = val;
    this.aListener(val);
  },
  get continent() {
    return this.aInternal;
  },
  registerListener: function (listener) {
    this.aListener = listener;
  }
}
/**
 * @class Template
 */
class Worldmap {

  // Elements
  svg = null;
  g = null;
  world = [];
  names = [];
  vac_country = [];
  vac_stage = [];

  // Configs
  svgW = 700;
  svgH = 500;
  gMargin = { top: 0, right: 0, bottom: 0, left: 0 };
  gW = this.svgW - (this.gMargin.right + this.gMargin.left);
  gH = this.svgH - (this.gMargin.top + this.gMargin.bottom);

  // Tools
  projection = d3.geoOrthographic()
    .scale(250)
    .rotate([100.5728366920307, -48])
    // .duration(1000)
    .translate([this.svgW / 2, this.svgH / 2])
    .clipAngle(90)
    .precision(0.7);
  path = d3.geoPath()
    .projection(this.projection);
  graticule = d3.geoGraticule();
  colors = {
    clickable: '#e3e2df', hover: '#bab2b5', clicked: "peachpuff",
    clickhover: '#bab2b5', p0: '#c1c8e4', p1: '#84ceeb',
    p2: '#5ab9ea', p3: '#88bdbc', p4: '#3aafa9'
  };

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

    vis.vac_country = vis.data.map(d => d.country);
    vis.vac_stage = vis.data.map(d => d.stage);

    // filter unique countries with highest stage
    let vac_map = new Map();
    for (let i = 0; i < vis.vac_country.length; i++) {
      if (vis.vac_country[i].includes(",")) {
        let arr = vis.vac_country[i].split(",")
        arr.forEach(function (elem) {
          if (!vac_map.get(elem.trim()) || vac_map.get(elem.trim()) < vis.vac_stage[i]) {
            vac_map.set(elem.trim(), vis.vac_stage[i]);
          }
        });
      } else {
        if (!vac_map.get(vis.vac_country[i]) || vac_map.get(vis.vac_country[i]) < vis.vac_stage[i]) {
          vac_map.set(vis.vac_country[i], vis.vac_stage[i]);
        }
      }
    }
    // console.log(vac_map);

    // console.log(vis.data);

    var files = ["/data/map.json", "/data/world-country-names.tsv", "/data/custom_geo.json"];

    Promise.all(files.map(url => d3.json(url))).then(function (values) {
      vis.world = values[0]
      // console.log("map", values[0])
      vis.names = values[1]
      vis.world_continent = values[2].features
      // console.log(vis.world)
      // console.log("custom", vis.world_continent)
      var globe = { type: "Sphere" },
        land = topojson.feature(vis.world, vis.world.objects.land),
        countries = topojson.feature(vis.world, vis.world.objects.countries).features,
        borders = topojson.mesh(vis.world, vis.world.objects.countries, function (a, b) { return a !== b; });
      // var continent = topojson.feature(vis.world_continent, vis.world_continent).features;
      // console.log(continent)
      // console.log("countries", vis.world.objects.countries)
      // console.log(vis.world_continent.features[200].properties.continent)
      // console.log(vis.world_continent.features[200].properties.name)
      // console.log(vis.world.objects.properties.name)

      // countries = countries.filter(function (d) {
      //   return vis.names.some(function (n) {
      //     if (d.id == n.id) return d.name = n.name;
      //   });
      // }).sort(function (a, b) {
      //   return a.name.localeCompare(b.name);
      // });

      vis.map.insert("path", ".graticule")
        .datum(topojson.feature(vis.world, vis.world.objects.land))
        .attr("class", "land")
        .attr("d", vis.path);


      for (let i = 0; i < Object.values(vis.names).length; i++) {
        for (let j = 0; j < countries.length; j++) {

          let continent;
          if (countries[j].id == Object.values(vis.names)[i].id) {
            // get continent
            vis.world_continent.forEach(function (elem) {
              if (elem.properties.name == Object.values(vis.names)[i].name) {
                continent = elem.properties.continent;
              }
            });

            // console.log(continent);

            let curr_color = vis.colors.clickable;
            let curr_stage = -1;
            if (vac_map.get(Object.values(vis.names)[i].name) !== undefined) {
              curr_stage = vac_map.get(Object.values(vis.names)[i].name);
              // console.log(curr_stage);
              // console.log(Object.values(vis.names)[i].name);
            }

            if (curr_stage === 0) {
              curr_color = vis.colors.p0;
            } else if (curr_stage === 1) {
              curr_color = vis.colors.p1;
            } else if (curr_stage === 2) {
              curr_color = vis.colors.p2;
            } else if (curr_stage === 3) {
              curr_color = vis.colors.p3;
            } else if (curr_stage === 4) {
              curr_color = vis.colors.p4;
            }
            // console.log(j, Object.values(vis.names)[i].name);


            vis.map.insert("path", ".graticule")
              .datum(countries[j])
              .attr("fill", curr_color)
              .attr("d", vis.path)
              .attr("class", "clickable")
              .attr("data-country-id", j)
              .attr("continent", continent)
              .attr("countryname", Object.values(vis.names)[i].name)

              .on("click", function () {
                let prev_color = vis.colors.clickable;
                let prev_stage = -1;
                let temp;

                d3.selectAll(".clicked")
                  .classed("clicked", false)
                  .select(function () {
                    // console.log(this)
                    // console.log(d3.select(this).attr("countryname"));
                    temp = vac_map.get(d3.select(this).attr("countryname"));
                    prev_stage = temp === undefined ? -1 : temp;

                    if (prev_stage == 0) {
                      prev_color = vis.colors.p0;
                    } else if (prev_stage == 1) {
                      prev_color = vis.colors.p1;
                    } else if (prev_stage == 2) {
                      prev_color = vis.colors.p2;
                    } else if (prev_stage == 3) {
                      prev_color = vis.colors.p3;
                    } else if (prev_stage == 4) {
                      prev_color = vis.colors.p4;
                    }
                    d3.select(this).attr("fill", prev_color);
                    // console.log("unselected", prev_stage, prev_color, d3.select(this).attr("countryname"));
                  })


                // console.log("clicked", clicked, Object.values(vis.names)[i].name, prev_stage, prev_color);

                map.continent = continent;
                d3.selectAll("path").filter(function (d) {
                  // console.log(d3.select(this).attr("continent"))
                  return d3.select(this).attr("continent") == continent;
                })
                  // .attr("fill", vis.colors.hover);
                    .classed("clicked", true);

                d3.select(this)
                  .select(function () {
                    d3.select(this).attr("fill", curr_color);
                    console.log("unselected", prev_stage, prev_color, d3.select(this).attr("countryname"));
                  });
                // .attr("fill", vis.colors.clicked);

                (function transition() {

                  // // Store the current rotation and scale:
                  // var currentRotate = projection.rotate();
                  // var currentScale = projection.scale();

                  // // Calculate the future bounding box after applying a rotation:
                  // projection.rotate([-p[0], -p[1]]);
                  // path.projection(projection);

                  // // calculate the scale and translate required:
                  // var b = path.bounds(d);
                  // var nextScale = currentScale * 1 / Math.max((b[1][0] - b[0][0]) / (width / 2), (b[1][1] - b[0][1]) / (height / 2));
                  // var nextRotate = projection.rotate();

                  d3.select(".clicked").transition()
                    .duration(1000)
                    .tween("rotate", function () {
                      var p = d3.geoCentroid(countries[d3.select(this).attr("data-country-id")]);
                      var r = d3.interpolate(vis.projection.rotate(), [-p[0], -p[1]]);
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
                  d3.selectAll("path").filter(function (d) {
                    console.log(d3.select(this).attr("continent"))
                    return d3.select(this).attr("continent") == continent;

                  })
                    .attr("fill", vis.colors.hover);
                            // && d3.select(this).attr("data-country-id") != countries[j].id;
                    // .classed("clicked", true);
                  // c.attr("fill", vis.colors.hover);
                }
                // console.log("mouse move", Object.values(vis.names)[i].name);
              })

              .on("mouseout", function () {
                var c = d3.select(this);

                if (c.classed("clicked")) {
                  // c.attr("fill", vis.colors.clicked);
                  d3.selectAll("path").filter(function (d) {
                    return d3.select(this).attr("continent") == continent;
                  })
                    .attr("fill", vis.colors.clicked);
                  // console.log("clicked mouse out", Object.values(vis.names)[i].name)
                } else {
                  // console.log("unclicked mouse out", Object.values(vis.names)[i].name)
                  d3.select(this).attr("fill", curr_color);
                }
                // console.log("mouse out");
              });
          }
        }
      }
      vis.map.insert("path", ".graticule")
        .datum(topojson.mesh(vis.world, vis.world.objects.countries, function (a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", vis.path);

      // return (vis.world, vis.names)

    });

    d3.select(self.frameElement).style("height", vis.svgH + "px");

    // window.addEventListener(window.continent, function (e) {
    //   // map_continent = localStorage.getItem('continent');
    //   map_continent = window.continent;
    //   console.log("update", map_continent);
    // });
    

  }
}

