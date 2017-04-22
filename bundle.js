(function() {

	var genderData = null;
	var genreData = null;
	var smultData = null;
	var genderWidth = 0;
	var genderHeight = 0;
	var genderScales = {};
	var genderStack = null;
	var genderColumns = ["dateStr","date","male","female","total","malePercent","femalePercent"]
	var countColumns = ["male","female"]
	var percentColumns = ["malePercent","femalePercent"]

	var chartGender = d3.select('.chart__gender');

	function cleanGenderRow(row) {
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

	// function cleanGenreRow(row) {
	// 	var male = +row.Male;
	// 	var female = +row.Female;
	// 	var total = male + female;

	// 	return {
	// 		dateStr: row.date,
	// 		date: d3.timeParse('%Y')(row.date),
	// 		male: male,
	// 		female: female,
	// 		total: total,
	// 		malePercent: male / total,
	// 		femalePercent: female / total,
	// 	}
	// }

	function loadGenderData(cb) {
		d3.tsv('assets/gender_count.tsv', cleanGenderRow, function(err, data) {
			cb(null, data)
		});
	}

	function loadGenreData(cb) {
		d3.tsv('assets/genre_count.tsv', cleanGenreRow, function(err, data) {
			cb(null, data)
		});
	}

	function loadData(cb) {
		var q = d3.queue();

		q.defer(loadGenderData);
		// q.defer(loadGenreData);
		// q.defer(loadSmultData);

		q.awaitAll(function(error, response) {
			if (error) throw error;
			genderData = response[0]
			genderData.columns = genderColumns
			cb()
		});
	}

	function setupGenderChart() {
		// set up the DOM elements
  		var keys = countColumns//genderData.columns.slice(1);
		genderStack = d3.stack()
		genderStack.keys(keys)
		console.log('keys',keys)
		console.log(genderStack(genderData))
		var svg = chartGender.select('svg');
		var g = svg.append('g');

		g.append('g')
			.attr('class', 'axis axis--x');
		g.append('g')
			.attr('class', 'axis axis--y');

		// setup scales
		genderScales.x = d3.scaleTime()
			.domain(d3.extent(genderData, function(d) { return d.date; }));
		genderScales.y = d3.scaleLinear()
			.domain([0,d3.max(genderData,function(d) { return d.male + d.female; })]);
		genderScales.z = d3.scaleOrdinal(d3.schemeCategory20)
		genderScales.z.domain(keys)
	
	}

	function updateGenderChart() {
		console.log(genderScales)
		const ratio = 1.5;
		width = chartGender.node().offsetWidth;
		height = Math.floor(width / 1.5);
		
		var svg = chartGender.select('svg');

		svg
			.attr('width', width)
			.attr('height', height);

		genderScales.x.range([0, width]);
		genderScales.y.range([height,0]);

			// If axisBottom and axisLeft, the ticks get cut off by 
			// the svg's boundaries. If I add padding on the svg
			// in the CSS it looks funny -- I probably should be 
			// fetching that element from the dom somewhere

		var area = d3.area()
		    .x(function(d, i) { return genderScales.x(d.data.date); })
		    .y0(function(d) { return genderScales.y(d[0]); })
		    .y1(function(d) { return genderScales.y(d[1]); });


		var layer = svg.selectAll(".area")
			.data(genderStack(genderData))

		layer.exit().remove()
		console.log(layer);
		var enterLayer = layer.enter()
		  	.append("path")
		      .attr("class", "area")
		      .attr("d", area)
		      .style("fill", function(d) { return genderScales.z(d.key); })
		// redraw elements

		// svg.selectAll('.bar')
		// 	.attr('x', function(d) {

		// 	})
		layer.merge(enterLayer)
	      .transition().duration(1000)
	      .style("fill", function(d) { return genderScales.z(d.key); })
	      .attr("d", area);

	    xaxis = svg.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisTop(genderScales.x))

		yaxis = svg.select(".axis--y")
			.call(d3.axisRight(genderScales.y).ticks(10))
	}

	function resize() {
		updateGenderChart()
	}

	function init() {
		loadData(function() {
			console.log(genderData)
			setupGenderChart()	
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
