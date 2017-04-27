(function() {

	//VARS
	var genreData = null;
	var width = 0;
	var height = 0;
	var scales = {};
	var stack = null;
	var area = null;
	var chart = d3.select('.chart__genre');

	// CLEANING FNS

	function cleanRow(row, i, cols) {
		var columns = cols.slice(1, cols.length)

		var values = columns.map(function(columName) {
			return +row[columName];
		})

		var total = d3.sum(values)

		var things = columns.map(function(columName, i) {
			var out = {};
			out[columName + 'Count'] = values[i];
			out[columName + 'Percent'] = values[i] / total;
			return out;
		});

		
		// var target = {}
 	// 	var total = 0
		// // 		target.dateStr = row.date
		// target.date = d3.timeParse('%Y')(row.date)
		// for (var i = 1, n = cols.length; i < n; ++i){
		// 	field = cols[i]
		// 	target[field] = +row[field]
		// 	total = total + +row[field]
		// }
		// target["total"] = total
		// /*		target["count"]["total"] = total
		// target["count"]["columns"] = count_cols
		// for (var i = 1, n = cols.length; i < n; ++i){
		// 	field = cols[i]
		// 	target["percent"][field] = +row[field]/total
		// }
		// console.log("target")*/
		// return target;
 	}


	// LOAD THE DATA
	function loadData(cb) {
		d3.tsv('assets/genre_count.tsv', cleanRow, function(err, data) {
			console.log(data)
			genreData = data
			cb()
		});
	}


	//SETUP
	// GENRE HELPERS

	function setupScales(keys){//, cp) {
		maxy=0
		// if (cp=='count') {
		maxy = d3.max(genreData,function(d) { return d.total; })
		// } else {
			// if (cp=='percent') {
				// maxy = 1;
			// }
		// }
		scales.x = d3.scaleTime()
			.domain(d3.extent(genreData, function(d) { return d.date; }));
		scales.y = d3.scaleLinear()
			.domain([0,maxy]);
		scales.z = d3.scaleOrdinal(d3.schemeCategory20)
		scales.z.domain(keys)
	}

	function makeChartElements(svg) {
		var g = svg.append('g')
			.attr("class","container");

		var layer = g.selectAll(".area")
			.data(stack(genreData))
			.enter()
		  	.append("path")
		      .attr("class", "area")	

		g.append('g')
			.attr('class', 'axis axis--x');
		g.append('g')
			.attr('class', 'axis axis--y');
	}

	// SET UP GENRE

	function setupChart() {
		// set up the DOM elements
  		var keys = genreData.columns.slice(1);
		stack = d3.stack()
		stack.keys(keys)
		// console.log('keys',keys)
		// console.log('stack',stack(genreData))
		var svg = chart.select('svg');

		// setup scales
		setupScales(keys)//,cp)

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

	function drawAxes(svg){
		var xaxis = svg.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(scales.x))

		var yaxis = svg.select(".axis--y")
			.call(d3.axisLeft(scales.y).ticks(10))

		// console.log(yaxis)
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
		drawAxes(svg)

		var layer = svg.selectAll(".area")
				.attr("d", area)
		      	.style("fill", function(d) { return scales.z(d.key); })
	}

	function setup() {
		setupChart()
	}

	function resize() {
		updateChart()
	}

	function init() {
		loadData(function() {
			// console.log("genre",genreData)
			setup()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
