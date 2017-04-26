(function() {

	//VARS
	var genderData = null;
	var scales = {};
	var stack = d3.stack();
	var margin = { top:10, bottom:25, left:28, right:10 }
	var ratio = 1.5;

	var state = 'percent';
	
	var chart = d3.select('.chart__gender');
	var svg = chart.select('svg');
	var tooltip = d3.select("body")
    		.append("div") 
      		.attr("class", "tooltip")  
      		.style("z-index", "19")     
      		.style("opacity", 0);

    
	
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
			male_count: male,
			female_count: female,
			total: total,
			male_percent: male / total,
			female_percent: female / total
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
	function setupScales() {
		var maxCount = d3.max(genderData,function(d) { return d.total; });

		var countX = d3.scaleTime()
			.domain(d3.extent(genderData, function(d) { return d.date; }));

		var countY = d3.scaleLinear()
			.domain([0, maxCount]);

		var countColor = d3.scaleOrdinal(d3.schemeCategory20)
			.domain(['male_count', 'female_count']);

		scales.count = { x: countX,  y: countY, color: countColor };

		var percentX = d3.scaleTime()
			.domain(d3.extent(genderData, function(d) { return d.date; }));

		var percentY = d3.scaleLinear();

		var percentColor = d3.scaleOrdinal(d3.schemeCategory20)
			.domain(['male_count', 'female_count']);

		scales.percent = { x: percentX,  y: percentY, color: percentColor };
	}

	function setupElements() {
		var g = svg.select('.container');

		g.append('g')
			.attr('class', 'axis axis--x');

		g.append('g')
			.attr('class', 'axis axis--y');
	}
	
	//UPDATE
	function updateScales(width, height){
		scales.count.x.range([0, width]);
		scales.percent.x.range([0, width]);
		scales.count.y.range([height, 0]);
		scales.percent.y.range([height, 0]);
	}


	function drawAxes(g, height){
		var xAxis = g.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(scales[state].x))

		var yAxis = g.select(".axis--y")
			.call(d3.axisLeft(scales[state].y)
				.ticks(10)
			)
		// If axisBottom and axisLeft, the ticks get cut off by 
		// the svg's boundaries. If I add padding on the svg
		// in the CSS it looks funny -- I probably should be 
		// fetching that element from the dom somewhere
	}

	function updateChart() {
		var w = chart.node().offsetWidth;
		var h = Math.floor(w / ratio);
		
		var width = w - margin.left - margin.right;
		var height = h - margin.top - margin.bottom;
		
		svg
			.attr('width', w)
			.attr('height', h);

		var translate = "translate(" + margin.left + "," + margin.top + ")";

		var g = svg.select('.container')
		
		g.attr("transform", translate)

		updateScales(width, height)

		// redraw elements
		drawAxes(g, height)

		// todo russell
		var area = d3.area()
		    .x(function(d) { return scales[state].x(d.data.date); })
		    .y0(function(d) { return scales[state].y(d[0]); })
		    .y1(function(d) { return scales[state].y(d[1]); });

		stack.keys(['male_' + state, 'female_' + state])

		var stackedData = stack(genderData)

		var layer = g.selectAll('.area')
			.data(stackedData)
		.enter().append('path')
			.attr('class', 'area')

		layer
			.attr('d', area)
	      	.style('fill', function(d) { return scales[state].color(d.key); })

		svg.on('click', function(d){
			console.log('hey hey hey!')
			transition()
		})
	}

	function setup() {
		setupScales()
		setupElements()
	}

	function resize() {
		updateChart()
	}

	function init() {
		loadData(function() {
			setup()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
