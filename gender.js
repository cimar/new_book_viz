(function() {

	//VARS
	var genderData = null;
	var scales = {};
	var stack = d3.stack();
	var margin = { top:10, bottom:25, left:28, right:10 }
	var ratio = 1.5;

	var original_state = 'percent';
	var state = original_state;
	var other_state = 'count';
	
	var chart = d3.select('.chart__gender');
	var svg = chart.select('svg');
    var vertical = null
	var tooltip = d3.select("body")
    		.append("div") 
      		.attr("class", "tooltip")  
      		.style("z-index", "19")     
      		.style("opacity", 0);

    const bisectDate = d3.bisector(d => d.date).left;
    

	
	// TRANSITION
	function transition() {
		console.log("insideTransition!")
		var temp = state
		state = other_state
		other_state = temp
		console.log(state)
		updateChart()
	}

	// CLEANING FNS

	function cleaRow(row) {
		var female = +row.Female;
		var male = +row.Male;
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
			.domain(['male_percent', 'female_percent']);

		scales.percent = { x: percentX,  y: percentY, color: percentColor };
	}

	function setupElements() {
		var g = svg.select('.container');

		g.append('g')
			.attr('class', 'axis axis--x');

		g.append('g')
			.attr('class', 'axis axis--y');

		vertical = g.append("g")
    		.append("rect")
      		.attr("class", "vertical")
      		.attr("width", 1)
      		.attr("x", 0)
      		.style("stroke", "#e7e7e7")
      		.style("opacity", 0);
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
	}

	function updateChart() {
		console.log(state)
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

		var area = d3.area()
		    .x(function(d) { return scales[state].x(d.data.date); })
		    .y0(function(d) { return scales[state].y(d[0]); })
		    .y1(function(d) { return scales[state].y(d[1]); });

		stack.keys(['female_' + state, 'male_' + state])

		var stackedData = stack(genderData)

		console.log(stackedData)

		var layer = g.selectAll('.area')
			.data(stackedData)

		layer.exit().remove()
		
		var enterLayer = layer.enter()
			.append('path')
			.attr('class', 'area')

		setupElements()
		drawAxes(g, height)

		vertical.attr("height", height)
      		.attr("y", margin.top)

		enterLayer.on("mousemove", function(d) {
			console.log("the mouse is moving! OH GOD")
			k = d.key
		    mousex = d3.mouse(this)
		    mousex = mousex[0]
		/*    var invertedx = x.invert(mousex)
		    var i = bisectDate(d_array, invertedx, 1)

			d0 = d_array[i - 1],
			d1 = d_array[i],
			d = invertedx - d0.date > d1.date - invertedx ? d1 : d0;
		*/
			console.log("d",d)
			console.log("key",k)
		})

	    layer.merge(enterLayer)
	    	.transition()
	    	.duration(1000)
	    	.attr('d', area)
	      	.style('fill', function(d) { return scales[state].color(d.key); })



		svg.on('click', function(d){
			console.log('hey hey hey!')
			transition()
		})
	}

	function setup() {
		setupScales()
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
