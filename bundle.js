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

	var smultWidth = 0;
	var smultHeight = 0;
	var smultScales = {};
	var smultStack = null;
	var smultArea = null;
	var chartSmult = d3.select('.chart__smult');


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

 	function cleanSmultRow(row) {
 		console.log(row)
 		var target = {}
		count_women = +row.count;
		genre_total = count_women/(+row.percent);
	  	if ((row.genre!="zz_needs label") && (genre_total > 10)) {
	    	target["percent_w"] = +row.percent;
	    	target["percent_m"] = 1 - +row.percent;
			target["decade"] = d3.timeParse('%Y')(row.decade);
			target["genre"] = row.genre;
	  		console.log("tar",target)
	  		return target
	  	}
	}


// LOAD THE DATA

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

	function loadSmultData(cb) {
		d3.tsv('assets/smult_data.tsv', cleanSmultRow, function(err, data) {
			cb(null, data)
		});
	}

	function loadData(cb) {
		var q = d3.queue();

		q.defer(loadGenderData);
		q.defer(loadGenreData);
		q.defer(loadSmultData)
		// q.defer(loadGenreData);
		// q.defer(loadSmultData);

		q.awaitAll(function(error, response) {
			if (error) throw error;
			console.log(response)
			genderData = response[0]
			genderData.columns = genderColumns
			genreData = response[1]
			smultData = response[2]
			cb()
		});
	}


//SETUP
	
	//GENDER HELPERS

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

	function getKeys(cp) {
		if(cp == "count"){
			return genderCountColumns
		} else {
			return genderPercentColumns
		}
	}

	//SET UP GENDER

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

	// GENRE HELPERS

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

	// SET UP GENRE

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

	function setupSmultScales() {
		smultScales.y = d3.scaleTime().domain([d3.timeParse("%Y")("1950"),d3.timeParse("%Y")("2020")]);
  		smultScales.x = d3.scaleLinear().domain(d3.extent([-1, 1]));
	}

	function setupSmultChart() {
		var genres = d3.nest().key(function(d){ return d.genre}).entries(smultData);
		setupSmultScales()
		console.log("genres",genres)	
		makeChartElementsSmult(genres)
		
	}

	function makeChartElementsSmult(genres) {
		var svg = chartSmult.selectAll("svg.mult")
 			.data(genres)
			.enter()
			.append("svg")
			.attr("class","mult")
			.append("g")
			.attr("class","container")


		var bars = svg.selectAll(".bar")
      		.data(function(d) { return d.values;})
    		.enter();

		bars.append("rect")
      		.attr("class", "bar women")
      	bars.append("rect")
    		.attr("class", "bar men")
	}


//UPDATE

	//HELPERS

	function updateGenderScales(width,height){
		genderScales.x.range([0, width]);
		genderScales.y.range([height,0]);
	}

	function updateGenreScales(width,height){
		genreScales.x.range([0, width]);
		genreScales.y.range([height,0]);
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

	function getBandwidth() {
		var dom = smultScales.y
		console.log(smultScales)
      	r = dom(d3.timeParse("%Y")("2020")) - dom(d3.timeParse("%Y")("1950"));
    
      	console.log(r)
      	return Math.abs(r/7.0);
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

	function updateSmultScales(width,height){
		smultScales.x.range([0, width]);
		smultScales.y.range([height,0]);
	}

	function updateSmultChart() {
		var margin = {"left":.5, "top":0}; //figure out how to get these from the css/dom
		const ratio = 1.5;
		width = (chartSmult.node().offsetWidth)/4;
		height = width;
		
		var svg = chartSmult.selectAll('svg.mult');
		svg.attr('width', width-margin.left) // not sure how margin works, still...
			.attr('height', height)

      	console.log("hot potato")
      	updateSmultScales((width-margin.left),height)

		var g = svg.selectAll('g')
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		var bars = g.selectAll(".bar")
			.attr("y", function(d) { return smultScales.y(d.decade);})
      		.attr("height", getBandwidth()) // MAKE A BANDWIDTH FN

      	console.log("bars",bars)
      	var wbars = svg.selectAll(".bar.women")
      		.attr("x", function(d) { return smultScales.x(0); })
      		.attr("width", function(d) { return Math.abs(smultScales.x(0) - smultScales.x(d.percent_w)); });
	
      	var mbars = svg.selectAll(".bar.men")
	      	.attr("x", function(d) { return smultScales.x(-1*d.percent_m); })
    		.attr("width", function(d) { return Math.abs(smultScales.x(0) - smultScales.x(d.percent_m)); });
	}

	function setup() {
		setupGenderChart('count')
		setupGenreChart()
		setupSmultChart()	
	}

	function resize() {
		updateGenderChart()
		updateGenreChart()
		updateSmultChart()
	}

	function init() {
		loadData(function() {
			console.log("genre",genreData)
			console.log("gender",genderData)
			console.log("smult",smultData)
			setup()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
