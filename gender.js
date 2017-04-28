(function() {

	//VARS
	var genderData = null;
	var scales = {};
	var stack = d3.stack();
	var margin = { top:10, bottom:25, left:50, right:10 };
	var width = 0;
	var height = 0;
	var ratio = 1.5;
	var transitionDuration = 1000;
	var mouseTransitionDuration = 50
	var tooltipTransitionDuration = 500

	var state = 'percent';
	var labels = {'count':'Count of books', 'percent':'Percent of books'}
	
	var chart = d3.select('.chart__gender');
	var svg = chart.select('svg');

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

		g.append('g').attr('class', 'area-container');

		g.append('g').attr('class', 'axis axis--x');

		g.append('g').attr('class', 'axis axis--y');

		g.append("rect")
	  		.attr("class", "vertical")
  			.attr("width", 1)
  			.attr("x", 0)
  			.style("stroke", "white")

  		svg.append("text")
			.attr("class","label--y")
			.attr("text-anchor","middle")

		svg.append("text")
			.attr("class","label--x")
			.attr("text-anchor","middle")

		g.append("text")
			.attr("class","area__label__men")
			.style("text-anchor", "end")
			.text("Men");

		g.append("text")
			.attr("class","area__label__women")
			.style("text-anchor", "end")
			.text("Women");
	}
	
	//UPDATE
	function updateScales(width, height){
		scales.count.x.range([0, width]);
		scales.percent.x.range([0, width]);
		scales.count.y.range([height, 0]);
		scales.percent.y.range([height, 0]);
	}


	function drawAxes(g, height){
		g.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(scales[state].x))

		g.select(".axis--y")
			.transition()
			.duration(transitionDuration)
			.call(d3.axisLeft(scales[state].y).ticks(10))
	}

	function drawLabels(g, width, height) {
		svg.select('.label--y')
			.text(labels[state])
		.transition()
			.duration(transitionDuration)
			.attr("transform", "translate("+ (margin.left/4) +","+(height/2)+")rotate(-90)")

		g.select(".area__label__women")
			.transition()
			.duration(transitionDuration)
			.attr("x", .95 * width)
			.attr("y", .95 * height)

		g.select(".area__label__men")
			.transition()
			.duration(transitionDuration)
			.attr("x", .95 * width)
			.attr("y", .45 * height)
			.style("text-anchor", "end")
	}

	function drawFiftyPercent(g) {
		var line = d3.line()
			.x(function(d) {
				return scales[state].x(d.date)
			})
			.y(function(d) {
				if (state == 'percent'){
					return scales[state].y(.5)
				} else {
					return scales[state].y((d["total"])/2)
				}
			})

		var fif = g.select(".fiftyper")

		if (fif.empty()) {
			fif = g.append("path")
				.attr("class","fiftyper")
				.attr("fill","none")
				.attr("stroke", "white")
				.attr("stroke-width",2)
		}

		fif.datum(genderData)
			.transition()
			.duration(transitionDuration)
			.attr("d",line)
		return fif
	}

	function handleMouseMove(d) {
		var key = d.key
	    var mouse = d3.mouse(this)
	    var mouseX = mouse[0]
	    var mouseY = mouse[1]
	    var invertedX = scales[state].x.invert(mouseX)

	    var bisectDate = d3.bisector(d => d.date).left;

	    var index = bisectDate(genderData, invertedX, 1)

		var d0 = genderData[index - 1];
		var d1 = genderData[index];
		
		var d = invertedX - d0.date > d1.date - invertedX ? d1 : d0;
		
		chart.select(".vertical")
			.attr("x",(scales[state].x(d.date)));

		var val = d[key];
		var displayValue = state === 'percent' ? d3.format(".0%")(val) : val;
		var displayYear = +d3.timeFormat("%Y")(d.date);
		var displayGender = key.split('_')[0];
		
		chart.select(".tooltip--gender").text(displayGender);
		chart.select(".tooltip--year").text(displayYear);
		chart.select(".tooltip--value").text(displayValue);
       	
       	var isLeft = mouseX < width / 2
       	var xOff = scales[state].x(d.date)
       	var yOff = mouseY + margin.top
       	chart.select('.tooltip')
       		.style("right", isLeft ? 'auto' : width - xOff + margin.right + 'px')
       		.style("left", isLeft ? xOff + margin.left + 'px' : "auto")
       		.style("top",  yOff + "px");
	}

	function handleMouseOut() {
		// chart.select(".vertical")
		// 	.transition()
		// 	.duration(transitionDuration)
		// 	.style("opacity",0)

		// chart.select(".tooltip")
		// 	.transition()
		// 	.duration(tooltipTransitionDuration)
		// 	.style("opacity",0)
	}

	function updateChart() {
		var w = chart.node().offsetWidth;
		var h = Math.floor(w / ratio);
		
		width = w - margin.left - margin.right;
		height = h - margin.top - margin.bottom;
		
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
		    .y1(function(d) { return scales[state].y(d[1]); })
		    .curve(d3.curveMonotoneX)

		stack.keys(['female_' + state, 'male_' + state])

		var stackedData = stack(genderData)

		console.log(stackedData)

		var container = chart.select('.area-container')

		var layer = container.selectAll('.area')
			.data(stackedData)

		layer.exit().remove()
		
		var enterLayer = layer.enter()
			.append('path')
			.attr('class', 'area')

		drawAxes(g, height)
		drawLabels(g, width, height)

		var fif = drawFiftyPercent(g)

		vertical = g.select(".vertical")
			.attr("height", height)
      		.attr("y", 0)

	    layer.merge(enterLayer)
	    	.transition()
	    	.duration(transitionDuration)
	    	.attr('d', area)
	      	.style('fill', function(d) { return scales[state].color(d.key); })

	}



	function handleToggle() {
		if (this.value != state) {
			state = this.value
			updateChart()
		}
	}

	function setupEvents() {
		chart.selectAll('.toggle__button').on('click', handleToggle)
		
		chart.selectAll('.area')
			.on('mousemove',handleMouseMove)
			.on('mouseout',handleMouseOut)
	}

	function resize() {
		updateChart()
	}

	function init() {
		loadData(function() {
			setupElements()
			setupScales()
			resize() // draw chart
			setupEvents()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
