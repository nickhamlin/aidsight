// COMPLIANCE BAR CHART
var url_params=location.search;
if (url_params == "") {
    url_params = "?";
} else {
    url_params = url_params + "&";
}

var compliance_x;
var compliance_svg;
var compliance_w;
var compliance_h;
var compliance_barPadding;
var compliance_data;


function set_compliance_data(input) {
  compliance_data={};
  compliance_data.budget=[];
  for(let i=0; i < 10; ++i) {
    i_str=i.toString();
    key='benford_compliance_budget_distribution_'+i_str;
    compliance_data.budget.push({
      'digit': i,
      'score': input[key].toFixed(1)
    })
  }
  compliance_data.score_budget=input['benford_compliance_budget']

  compliance_data.transaction=[];
  for(let i=0; i < 10; ++i) {
    i_str=i.toString();
    key='benford_compliance_transaction_distribution_'+i_str;
    compliance_data.transaction.push({
      'digit': i,
      'score': input[key].toFixed(1)
    })
  }
  compliance_data.score_transaction=input['benford_compliance_transaction']
}

var width;

function draw_compliance_bars(input, type) {
  set_compliance_data(input);
  data=compliance_data[type];
  //Width and height
  width = parseInt(d3.select("#compliance_chart").style("width"));
  if (width>500){width=500;}
  compliance_w=width
  compliance_h = 180;
  var padding=20;
  compliance_barPadding = 1;
  compliance_x = d3.scale.ordinal()
      .rangeBands([0, width]);

  var xAxis = d3.svg.axis().scale(compliance_x)
      .orient("bottom").ticks(7);

  //Create SVG element
  compliance_svg = d3.select("#compliance_chart")
        .append("svg")
        .attr("width", width)
        .attr("height", compliance_h+padding);

  // If we wanted to add a Y axis (static) it would go here
  //var y = d3.scale.linear().range([h, 0]);
  //var yAxis = d3.svg.axis().scale(y).orient("left").ticks(7);

  // Defining X axis in the function so it can pull from data
  compliance_x.domain(data.map(function(d) { return d.digit; }));

  // Add Axis
  compliance_svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,"+compliance_h+")")
    .call(xAxis);

  var div = d3.select("#compliance_chart").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // Create Bars
  compliance_svg.selectAll("rect")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "compliance_bar")
     .attr("x", function(d, i) {
        return i * (width / data.length);
        })
     .attr("y", function(d) {
        return compliance_h - (d.score * 4);
        })
     .attr("width", width / data.length - compliance_barPadding)
     .attr("height", function(d) {
        return d.score * 4;
        })
      .attr("fill","#178BCA")
      .on("mouseover", function(d) {
          div.transition()
              .duration(200)
              .style("opacity", .9);
          div .html("<b>"+d.score+"%</b> of the leading digits in this dataset are <b>"+d.digit+"s</b>")
              .style("left", (d3.event.pageX - 400) + "px")
              .style("top", (d3.event.pageY - 500) + "px");
          })
      .on("mouseout", function(d) {
          div.transition()
              .duration(500)
              .style("opacity", 0);
      });
    ;

  // Add Data Labels
  compliance_svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .text(function (d) {return d.score;})
    .attr("class", "label")
    .attr("text-anchor","middle")
    .attr("x", function(d, i) {
       return i * (width / data.length) + (compliance_w / data.length - compliance_barPadding) / 2;
     })
    .attr("y", function(d) {
       return compliance_h - (d.score * 4) -1;
     })

  score=input.benford_compliance_budget
  caption="<b>"+score+"%</b> of the activities reported have <b> budget</b> datasets that comply with Benford's Law";
  d3.select("#compliance_caption").html(caption);

  label="Leading digit across all budget datasets";
  d3.select("#compliance_label").html(label);

  d3.select(window).on('resize', resize);

  resize();

// end Draw function
};


//Based on code available at http://plnkr.co/edit/eaMj1eqOMlIiwOlq9ywK?p=preview
function resize() {
    width = parseInt(d3.select("#compliance_chart").style("width"));
    if (width>500){width=500;}
    compliance_x = d3.scale.ordinal()
        .rangeBands([0, width]);

    xAxis = d3.svg.axis().scale(compliance_x)
        .orient("bottom").ticks(7);

    /* Force D3 to recalculate and update the bars and axis */
    compliance_svg.selectAll('.compliance_bar')
        .attr("x", function(d, i) {
           return i * (width / 10);
           })
        .attr("width", width / 10  - compliance_barPadding)

    compliance_svg.selectAll(".label")
      .attr("x", function(d, i) {
         return i * (width / 10) + (width / 10 - compliance_barPadding) / 2;
         })
    compliance_x.domain([0,1,2,3,4,5,6,7,8,9]);
    compliance_svg.selectAll(".axis")
       .call(xAxis);
 };

function updateData(value) {
    width = parseInt(d3.select("#compliance_chart").style("width"));
    if (width>500){width=500;}
    var data = compliance_data[value];
    compliance_x.domain([0,1,2,3,4,5,6,7,8,9]);

    // Select the section we want to apply our changes to
    var trans = d3.select("#compliance_chart").transition();

    // Make the changes
    var transition = compliance_svg.transition().duration(750),
        delay = function(d, i) { return i * 50; };

   compliance_svg.selectAll(".compliance_bar")
     .data(data)
     .transition().duration(750)
     .attr("x", function(d, i) {
        return i * (width / data.length);
        })
     .attr("y", function(d) {
        return compliance_h - (d.score * 4);
        })
     .attr("height", function(d) {
        return d.score * 4;
        })

    compliance_svg.selectAll(".label")
      .data(data)
      .transition().duration(750)
      .text(function (d) {return d.score;})
      .attr("x", function(d, i) {
         return i * (width / data.length) + (width / data.length - compliance_barPadding) / 2;
         })
      .attr("y", function(d) {
         return compliance_h - (d.score * 4) -1;
         })
      ;

    score=compliance_data["score_".concat(value)]
    caption="<b>"+score+"%</b> of the activities reported have <b>"+value+"</b> datasets that comply with Benford's Law";
    d3.select("#compliance_caption").html(caption)

    label="Leading digit across all "+value+" datasets";
    d3.select("#compliance_label").html(label);

    resize();
    };

var histogram_w;
var histogram_x;
var benchmark_svg;
var histogram_length;
var benchmark_domain;
var barPadding = 1;
// BENCHMARK HISTOGRAM
function draw_histogram(input) {
  var score=input.distance;
  d3.json(
    '/benchmark_data'+url_params+'format=json',
    function(data) {
      //Width and height
      histogram_w=parseInt(d3.select("#benchmark_histogram").style("width"));
      if (histogram_w>500){w=500;}else{w = histogram_w;}

      var h = 110;
      var padding=50;
      var barPadding = 1;

      var x = d3.scale.ordinal()
	  .rangeBands([0, w]);

      var xAxis = d3.svg.axis().scale(x)
	  .orient("bottom").ticks(7);

      //Create SVG element
      benchmark_svg = d3.select("#benchmark_histogram")
	  .append("svg")
	  .attr("width", w)
	  .attr("height", h+padding);

      var div = d3.select("#benchmark_histogram")
	  .append("div")
	  .attr("class", "tooltip")
	  .style("opacity", 0);

      // If we wanted to add a Y axis (static) it would go here
      //var y = d3.scale.linear().range([h, 0]);
      //var yAxis = d3.svg.axis().scale(y).orient("left").ticks(7);
      //Convert strings to numbers
      data.forEach(function(d) {d.count = +d.count;}) ;
      data.forEach(function(d) {d.bin = +d.bin;}) ;

      // Defining X axis in the function so it can pull from data
      x.domain(data.map(function(d) { return d.bin; }));

      // Add Axis
      benchmark_svg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(0,"+h+")")
	.call(xAxis);

      // Create Bars
      benchmark_svg.selectAll("rect")
	.data(data)
	.enter()
	.append("rect")
	.attr("x", function(d, i) {
	  return i * (w / data.length);
	})
	.attr("y", function(d) {
	  return h - (d.count * 4);
	})
	.attr("width", w / data.length - barPadding)
	.attr("height", function(d) {
	  return d.count * 4;
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
	  })
	    .on("mouseover", function(d) {
              div.transition()
                .duration(200)
                .style("opacity", .9);
              div .html("There are <b>"+d.count+"</b> organizations with a score between <b>"+d.bin+" and "+(parseInt(d.bin)+3)+"</b>")
                .style("left", (d3.event.pageX)-510 + "px")
                .style("top", (d3.event.pageY - 170) + "px");
            })
        .on("mouseout", function(d) {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });


      // Add Data Labels
      benchmark_svg.selectAll(".label")
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

    benchmark_svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", w/2)
        .attr("y", h + 40)
        .text("Data quality score");
      ;


  d3.select(window).on('resize', resize_histogram);
  resize_histogram();
    });

// end Draw function
};


function resize_histogram() {
    histogram_w = parseInt(d3.select("#benchmark_histogram").style("width"));
    if (histogram_w>500){w=500;}else{w = histogram_w;}

    histogram_x = d3.scale.ordinal()
        .rangeBands([0, w]);
    histogram_x.domain(benchmark_domain);
    xAxis = d3.svg.axis().scale(histogram_x)
        .orient("bottom").ticks(7);

    /* Force D3 to recalculate and update the bars and axis */
    benchmark_svg.selectAll(".histogram_bar")
        .attr("x", function(d, i) {
          return i * (w / histogram_length);
        })
        .attr("width", w / histogram_length - barPadding);

    benchmark_svg.selectAll(".label")
       .attr("x", function(d, i) {
         return i * (w /histogram_length) + (w / histogram_length - barPadding) / 2;
       })
         ;

    benchmark_svg.selectAll(".axis")
       .call(xAxis);
 };
//WAFFLE CHART
// http://bl.ocks.org/XavierGimenez/8070956

var total = 0;
var width,
    height,
    widthSquares = 32,
    heightSquares = 32,
    squareSize = 6,
    squareValue = 0,
    gap = 1,
    theData = [];

// RGB to Hexadecimal color converter
// https://gist.github.com/lrvick/2080648

function RGBToHex(r,g,b){
    var bin = r << 16 | g << 8 | b;
    return '#' + (function(h){
        return new Array(7-h.length).join("0")+h
    })(bin.toString(16).toUpperCase())
}

// Color scale from conservative 7-color palette (8 including black) documented at
// http://mkweb.bcgsc.ca/colorblind/

var color = d3.scale.ordinal().range([
	RGBToHex(0, 0, 0),
	RGBToHex(230, 159, 0),
	RGBToHex(86, 180, 233),
	RGBToHex(0, 158, 115),
	RGBToHex(240, 228, 66),
	RGBToHex(0, 114, 178),
	RGBToHex(213, 94, 0),
	RGBToHex(204, 121, 167)
]);

function draw_waffle(input) {
    clean_headers=new Map([['relative_size_other',   'Other'],
		       ['relative_size_transaction', 'Transactions'],
                       ['relative_size_title',       'Title'],
                       ['relative_size_description', 'Description'],
		       ['relative_size_result',      'Results'],
                       ['relative_size_participating_org', 'Participants'],
                       ['relative_size_document_link', 'Documentation'],
                       ['relative_size_budget',      'Budgets']
		      ]);
    data=[];
    for(let [in_name,out_name] of clean_headers) {
	data.push({
	    'field': out_name,
	    'percentage': input[in_name],
	});
    }
  //total
  total=1

  //value of a square
  squareValue = total / (widthSquares*heightSquares);

  //remap data
  data.forEach(function(d, i)
  {
      d.percentage = +d.percentage;
      d.units = Math.floor(d.percentage/squareValue);
      theData = theData.concat(
        Array(d.units+1).join(1).split('').map(function()
          {
            return {  squareValue:squareValue,
                      units: d.units,
                      population: d.percentage,
                      groupIndex: i};
          })
        );
  });

  width = (squareSize*widthSquares) + widthSquares*gap + 160;
  height = (squareSize*heightSquares) + heightSquares*gap + 25;

  var waffle = d3.select("#waffle")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

      waffle.append("g")
      .selectAll("div")
      .data(theData)
      .enter()
      .append("rect")
      .attr("width", squareSize)
      .attr("height", squareSize)
      .attr("fill", function(d)
      {
        return color(d.groupIndex);
      })
      .attr("x", function(d, i)
        {
          //group n squares for column
          col = Math.floor(i/heightSquares);
          return (col*squareSize) + (col*gap);
        })
      .attr("y", function(d, i)
      {
        row = i%heightSquares;
        return (heightSquares*squareSize) - ((row*squareSize) + (row*gap))
      })
      .append("title")
      ;

   //add legend with categorical data
   var legend =
    waffle.append('g')
    .selectAll("div")
    .data(data)
    .enter()
      .append("g")
      .attr('transform', function(d,i){ return "translate(230," + i*20 + ")";});
  legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", function(d, i) { return color(i)});
  legend.append("text")
    .attr("x", 25)
    .attr("y", 13)
    .text( function(d) { return d.field});

};

// MAIN

d3.json('/quality_data'+url_params+'format=json', function(input) {
  jQuery(document).ready(function() {
      draw_compliance_bars(input, 'budget');
      draw_histogram(input);
      draw_waffle(input);
  });
});
