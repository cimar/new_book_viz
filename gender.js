(function() {

	//VARS
	var genderData = null;
	var scales = {};
	var stack = d3.stack();
	var margin = { top:10, bottom:25, left:50, right:10 }
	var ratio = 1.5;
	var transitionDuration = 1000;
	var mouseTransitionDuration = 50
	var tooltipTransitionDuration = 500

	var state = 'percent';
	var labels = {'count':'Count of books', 'percent':'Percent of books'}
	
	var chart = d3.select('.chart__gender');
	var svg = chart.select('svg');

    const bisectDate = d3.bisector(d => d.date).left;
    	//I think the "left" means I can't access the very last column of the stacked area chart?


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

		g.append('g').attr('class', 'axis axis--x');

		g.append('g').attr('class', 'axis axis--y');

		g.append("rect")
	  		.attr("class", "vertical")
  			.attr("width", 1)
  			.attr("x", 0)
  			.style("stroke", "white")
  			.style("opacity", 0);

  		svg.append("text")
			.attr("class","label--y")
			.attr("text-anchor","middle")

		svg.append("text")
			.attr("class","label--x")
			.attr("text-anchor","middle")

      	chart.append("div") 
      		.attr("class", "tooltip")  
      		.style("z-index", "19")     
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
		g.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(scales[state].x))

		g.select(".axis--y")
			.transition()
			.duration(transitionDuration)
			.call(d3.axisLeft(scales[state].y).ticks(10))
	}

	function drawLabels(g, width, height){
		svg.select('.label--y')
			.text(labels[state])
		.transition()
			.duration(transitionDuration)
			.attr("transform", "translate("+ (margin.left/4) +","+(height/2)+")rotate(-90)")

		// rosie fix these labels to only be created on setup like above
		var wable = g.select(".area__label__women")

		if (wable.empty()){
			g.append("text")
				.attr("class","area__label__women")
				.attr("x", .9*width)
				.attr("y", .75*height)
				.style("text-anchor", "end")
				.text("Women");
		}
		var mable = g.select(".area__label__men")

		if (mable.empty()){
			g.append("text")
				.attr("class","area__label__men")
				.attr("x", .9*width)
				.attr("y", .25*height)
				.style("text-anchor", "end")
				.text("Men");
		}
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
		key = d.key
		console.log("moving mouse",key)
		d_array = genderData
	    mousex = d3.mouse(this)
	    mousex = mousex[0]
	    var invertedx = scales[state].x.invert(mousex)
	    var i = bisectDate(d_array, invertedx, 1)

		d0 = d_array[i - 1],
		d1 = d_array[i],
		d = invertedx - d0.date > d1.date - invertedx ? d1 : d0;
		
		chart.select(".vertical")
			.transition()
			.duration(mouseTransitionDuration)
			.attr("x",(scales[state].x(d.date)))
			.style("opacity",1)

		var val = d[key]
		if(state == 'percent'){
			val = d3.format(".0%")(d[key])
		}

		chart.select(".tooltip")
			.style("opacity", .9)
    		.html(key+" selected!<br/>"+val+"<br/><h3>"+d3.timeFormat("%Y")(d.date)+"</h3>")
       		.style("left", (d3.event.pageX + 7) + "px")
       		.style("top", (d3.event.pageY - 80) + "px")
	}

	function handleMouseOut() {
		chart.select(".vertical")
			.transition()
			.duration(transitionDuration)
			.style("opacity",0)

		chart.select(".tooltip")
			.transition()
			.duration(tooltipTransitionDuration)
			.style("opacity",0)
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
