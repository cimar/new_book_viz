(function() {

//VARS

	var genderData = null;
	var genreData = null;
	var smultData = null;
	var genderWidth = 0;
	var genderHeight = 0;
	var genderScales = {};
	var genderStack = null;
	var genderArea = null;
	var genderColumns = ["dateStr","date","male","female","total","malePercent","femalePercent"]
	var genderCountColumns = ["female","male"]
	var genderPercentColumns = ["femalePercent","malePercent"]
	var chartGender = d3.select('.chart__gender');

	var genreWidth = 0;
	var genreHeight = 0;
	var genreScales = {};
	var genreStack = null;
	var genreArea = null;
	var chartGenre = d3.select('.chart__genre');



// CLEANING FNS

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

	function cleanGenreRow(row, i, cols) {
		var target = {}
 		var total = 0
// 		target.dateStr = row.date
		target.date = d3.timeParse('%Y')(row.date)
		for (var i = 1, n = cols.length; i < n; ++i){
			field = cols[i]
			target[field] = +row[field]
			total = total + +row[field]
		}
		target["total"] = total
/*		target["count"]["total"] = total
		target["count"]["columns"] = count_cols
		for (var i = 1, n = cols.length; i < n; ++i){
			field = cols[i]
			target["percent"][field] = +row[field]/total
		}
		console.log("target")*/
		return target;
 	}

 	function cleanSmultRow(d) {
 		var target = {}
		count_women = +d.count;
		genre_total = count_women/(+d.percent);
	  	if ((d.genre!="zz_needs label") && (genre_total > 10)) {
	    	target["percent"] = +d.percent;
	    	target["decade"] = parseDate(d.decade);
	    	target["genre"] = d.genre;
	    	return target
	  }
	}

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
		q.defer(loadGenreData);
		// q.defer(loadGenreData);
		// q.defer(loadSmultData);

		q.awaitAll(function(error, response) {
			if (error) throw error;
			//console.log(response)
			genderData = response[0]
			genderData.columns = genderColumns
			genreData = response[1]
			cb()
		});
	}

	function setupGenderScales(keys, cp) {
		maxy=0
		if (cp=='count') {
			maxy = d3.max(genderData,function(d) { return d.total; })
		} else {
			if (cp=='percent') {
				maxy = 1;
			}
		}
		genderScales.x = d3.scaleTime()
			.domain(d3.extent(genderData, function(d) { return d.date; }));
		genderScales.y = d3.scaleLinear()
			.domain([0,maxy]);
		genderScales.z = d3.scaleOrdinal(d3.schemeCategory20)
		genderScales.z.domain(keys)
	}

	function setupGenreScales(keys){//, cp) {
		maxy=0
//		if (cp=='count') {
			maxy = d3.max(genreData,function(d) { return d.total; })
//		} else {
//			if (cp=='percent') {
//				maxy = 1;
//			}
//		}
		genreScales.x = d3.scaleTime()
			.domain(d3.extent(genreData, function(d) { return d.date; }));
		genreScales.y = d3.scaleLinear()
			.domain([0,maxy]);
		genreScales.z = d3.scaleOrdinal(d3.schemeCategory20)
		genreScales.z.domain(keys)
	}

	function updateGenderScales(width,height){
		genderScales.x.range([0, width]);
		genderScales.y.range([height,0]);
	}

	function drawGenderAxes(svg, height){
		var xaxis = svg.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisTop(genderScales.x))

		var yaxis = svg.select(".axis--y")
			.call(d3.axisRight(genderScales.y).ticks(10))
		// If axisBottom and axisLeft, the ticks get cut off by 
		// the svg's boundaries. If I add padding on the svg
		// in the CSS it looks funny -- I probably should be 
		// fetching that element from the dom somewhere
	}

	function makeChartElementsGender(svg) {
		var layer = svg.selectAll(".area")
			.data(genderStack(genderData))
			.enter()
		  	.append("path")
		      .attr("class", "area")	

		var g = svg.append('g');

		g.append('g')
			.attr('class', 'axis axis--x');
		g.append('g')
			.attr('class', 'axis axis--y');
	}

	function makeChartElementsGenre(svg) {
		var layer = svg.selectAll(".area")
			.data(genreStack(genreData))
			.enter()
		  	.append("path")
		      .attr("class", "area")	

		var g = svg.append('g');
		g.append('g')
			.attr('class', 'axis axis--x');
		g.append('g')
			.attr('class', 'axis axis--y');
	}

	function getKeys(cp) {
		if(cp == "count"){
			return genderCountColumns
		} else {
			return genderPercentColumns
		}
	}

	function setupGenderChart(cp) {
		// set up the DOM elements
  		var keys = getKeys(cp)//genderData.columns.slice(1);
		genderStack = d3.stack()
		genderStack.keys(keys)
		console.log('keys',keys)
		console.log('stack',genderStack(genderData))
		var svg = chartGender.select('svg');

		// setup scales
		setupGenderScales(keys,cp)

		genderArea = d3.area()
		    .x(function(d, i) { return genderScales.x(d.data.date); })
		    .y0(function(d) { return genderScales.y(d[0]); })
		    .y1(function(d) { return genderScales.y(d[1]); });

		makeChartElementsGender(svg)
	}

	function updateGenderChart() {
		const ratio = 1.5;
		width = chartGender.node().offsetWidth;
		height = Math.floor(width / ratio);
		
		var svg = chartGender.select('svg');

		svg.attr('width', width)
			.attr('height', height);

		updateGenderScales(width,height)

		// redraw elements
		drawGenderAxes(svg,height)

		var layer = svg.selectAll(".area")
				.attr("d", genderArea)
		      	.style("fill", function(d) { return genderScales.z(d.key); })

	}

	function setupGenreChart() {
		// set up the DOM elements
  		var keys = genreData.columns.slice(1);
		genreStack = d3.stack()
		genreStack.keys(keys)
		console.log('keys',keys)
		console.log('stack',genreStack(genreData))
		var svg = chartGenre.select('svg');

		// setup scales
		setupGenreScales(keys)//,cp)

		genreArea = d3.area()
		    .x(function(d, i) { return genreScales.x(d.data.date); })
		    .y0(function(d) { return genreScales.y(d[0]); })
		    .y1(function(d) { return genreScales.y(d[1]); });

		makeChartElementsGenre(svg)		
	}

	function updateGenreScales(width,height){
		genreScales.x.range([0, width]);
		genreScales.y.range([height,0]);
	}

	function drawGenreAxes(svg){
		var xaxis = svg.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisTop(genreScales.x))

		var yaxis = svg.select(".axis--y")
			.call(d3.axisRight(genreScales.y).ticks(10))

		console.log(yaxis)
		// If axisBottom and axisLeft, the ticks get cut off by 
		// the svg's boundaries. If I add padding on the svg
		// in the CSS it looks funny -- I probably should be 
		// fetching that element from the dom somewhere
	}

	function updateGenreChart() {
		const ratio = 1.5;
		width = chartGenre.node().offsetWidth;
		height = Math.floor(width / ratio);
		
		var svg = chartGenre.select('svg');

		svg.attr('width', width)
			.attr('height', height);

		updateGenreScales(width,height)

		// redraw elements
		drawGenreAxes(svg)

		var layer = svg.selectAll(".area")
				.attr("d", genreArea)
		      	.style("fill", function(d) { return genreScales.z(d.key); })
	}

	function setup() {
		setupGenderChart('count')
		setupGenreChart('count')	
	}

	function resize() {
		updateGenderChart()
		updateGenreChart()
	}

	function init() {
		loadData(function() {
			console.log("genre",genreData)
			console.log("gender",genderData)
			setup()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
