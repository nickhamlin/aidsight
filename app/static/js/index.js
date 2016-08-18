// MODIFIED BENCHMARK HISTOGRAM
// BENCHMARK HISTOGRAM
d3.json("/quality_data_example", draw_histogram);

function draw_histogram(input) {
  var score=input.distance;
  d3.json(
    '/benchmark_data',
    function(data) {
  //Width and height
  var w = 450;
  var h = 325;
  var padding=50;
  var barPadding = 1;

  var x = d3.scale.ordinal()
      .rangeBands([0, w]);

  var xAxis = d3.svg.axis().scale(x)
      .orient("bottom").ticks(7);

  //Create SVG element
  var svg = d3.select("#benchmark_histogram")
        .append("svg")
        .attr("width", w)
        .attr("height", h+padding);

  var div = d3.select("#benchmark_histogram")
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "main_page_tooltip")
      .html("Overall Data Quality Grade: <b>B</b><br>Better result than <b>79%</b> of peers")
      .style("left", "80px")
      .style("top", "100px")
      .style("opacity", .9);;

  // If we wanted to add a Y axis (static) it would go here
  //var y = d3.scale.linear().range([h, 0]);
  //var yAxis = d3.svg.axis().scale(y).orient("left").ticks(7);
  //Convert strings to numbers
  data.forEach(function(d) {d.count = +d.count;}) ;
  data.forEach(function(d) {d.bin = +d.bin;}) ;

  // Defining X axis in the function so it can pull from data
  x.domain(data.map(function(d) { return d.bin; }));

  // Add Axis - THIS IS NOT WORKING NOW FOR SOME WEIRD REASON
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,300)")
    .call(xAxis);

  // Create Bars
  svg.selectAll("rect")
     .data(data)
     .enter()
     .append("rect")
     .attr("x", function(d, i) {
        return i * (w / data.length);
        })
     .attr("y", function(d) {
        return h - (d.count * 7);
        })
     .attr("width", w / data.length - barPadding)
     .attr("height", function(d) {
        return d.count * 7;
        })
      .attr("fill","#178BCA")

      //highlight the bar for the org
      .each(function(d, i) {
        if(d.bin+2 >= score) {
          d3.select(this)
              .attr("fill", "orange");
              }
       })
       .each(function(d, i) {
         if(d.bin > score) {
           d3.select(this)
               .attr("fill", "#178BCA");
               }
        });
    ;

  // Add Data Labels
  /*svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .text(function (d) {return d.count;})
    .attr("class", "label")
    .attr("x", function(d, i) {
       return i * (w / data.length) + (w / data.length - barPadding) / 2;
       })
    .attr("y", function(d) {
       return h - (d.count * 4) -1;
       })
    .attr("text-anchor","middle")
  ;*/
// end Draw function
})};
