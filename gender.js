(function() {

	//VARS
	var genderData = null;
	var width = 0;
	var height = 0;
	var scales = {};
	var stack = null;
	var area = null;
	var columns = ["dateStr","date","male","female","total","malePercent","femalePercent"]
	var countColumns = ["female","male"]
	var percentColumns = ["femalePercent","malePercent"]
	var chart = d3.select('.chart__gender');
	var tooltip = d3.select("body")
    		.append("div") 
      		.attr("class", "tooltip")  
      		.style("z-index", "19")     
      		.style("opacity", 0);

    var active_gen = "percent"
    var other_gen = "count"
	
	// TRANSITION
	function transition() {
		console.log("insideTransition!")
		var temp = active_gen
		active_gen = other_gen
		other_gen = temp
		setupChart(active_gen)
		updateChart(active_gen)
	}

	// CLEANING FNS

	function cleaRow(row) {
		var male = +row.Male;
		var female = +row.Female;
		var total = male + female;

		return {
			dateStr: row.date,
			date: d3.timeParse('%Y')(row.date),
			male: male,
			female: female,
			total: total,
			malePercent: male / total,
			femalePercent: female / total
		}
	}

	// LOAD THE DATA
	function loadData(cb) {
		d3.tsv('assets/gender_count.tsv', cleaRow, function(err, data) {
			genderData = data
			cb()
		});
	}
	
	//SETUP
	//GENDER HELPERS

	function setupScales(keys, cp) {
		maxy=0
		if (cp=='count') {
			maxy = d3.max(genderData,function(d) { return d.total; })
		} else {
			if (cp=='percent') {
				maxy = 1;
			}
		}
		scales.x = d3.scaleTime()
			.domain(d3.extent(genderData, function(d) { return d.date; }));
		scales.y = d3.scaleLinear()
			.domain([0,maxy]);
		scales.z = d3.scaleOrdinal(d3.schemeCategory20)
		scales.z.domain(keys)
	}

	function makeChartElements(svg) {
		var g = svg.select('.container'); //should this be select?

		var layer = g.selectAll(".area")
			.data(stack(genderData))
			.enter()

		//layer.exit().remove();

		layer.append("path")
		      .attr("class", "area")	

		g.select(".x-axis").remove();
		g.select(".y-axis").remove();

		g.append('g')
			.attr('class', 'axis axis--x');
		g.append('g')
			.attr('class', 'axis axis--y');
	}

	function getKeys(cp) {
		if(cp == "count"){
			return countColumns
		} else {
			return percentColumns
		}
	}

	//SET UP GENDER

	function setupChart(cp) {
		console.log("cp",cp)
		// set up the DOM elements
  		var keys = getKeys(cp)//data.columns.slice(1);
		stack = d3.stack()
		stack.keys(keys)
		console.log('keys',keys)
		console.log('stack',stack(genderData))
		var svg = chart.select('svg');

		// setup scales
		setupScales(keys,cp)

		area = d3.area()
		    .x(function(d, i) { return scales.x(d.data.date); })
		    .y0(function(d) { return scales.y(d[0]); })
		    .y1(function(d) { return scales.y(d[1]); });

		makeChartElements(svg)

	}
	
	//UPDATE

	//HELPERS

	function updateScales(width,height){
		scales.x.range([0, width]);
		scales.y.range([height,0]);
	}


	function drawAxes(svg, height){
		var xaxis = svg.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(scales.x))

		var yaxis = svg.select(".axis--y")
			.call(d3.axisLeft(scales.y).ticks(10))
		// If axisBottom and axisLeft, the ticks get cut off by 
		// the svg's boundaries. If I add padding on the svg
		// in the CSS it looks funny -- I probably should be 
		// fetching that element from the dom somewhere
	}

	function updateChart() {
		margin = {top:10,bottom:25,left:28,right:10}
		const ratio = 1.5;
		svg_width = chart.node().offsetWidth
		svg_height =  Math.floor(svg_width / ratio)
		width = svg_width - margin.left - margin.right;
		height = svg_height - margin.top - margin.bottom;
		
		var svg = chart.select('svg')
			.attr('width', svg_width)
			.attr('height', svg_height);

		var g = svg.select('.container')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		g.attr('width', width)
			.attr('height', height);

		updateScales(width,height)

		// redraw elements
		drawAxes(g,height)

		var layer = g.selectAll(".area")
				.attr("d", area)
		      	.style("fill", function(d) { return scales.z(d.key); })



		svg.on("click", function(d){
			console.log("hey!")
			transition()
		})

	}

	function setup() {
		setupChart('percent')
	}

	function resize() {
		updateChart()
	}

	function init() {
		loadData(function() {
			console.log("gender",genderData)
			setup()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
