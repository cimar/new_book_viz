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


// GENDER TRANSITION

/*	function genderTransition() {
		value = d3.select('input[name="genre__scale"]:checked').node().value;
		setupGenderChart(value)
		updateGenderChart(value)
	}	*/

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
		var g = svg.append('g')
			.attr("class","container"); //should this be select?

		var layer = g.selectAll(".area")
			.data(genderStack(genderData))
			.enter()
		  	.append("path")
		      .attr("class", "area")	

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
		var g = svg.append('g')
			.attr("class","container");

		var layer = g.selectAll(".area")
			.data(genreStack(genreData))
			.enter()
		  	.append("path")
		      .attr("class", "area")	

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

	//SMULT HELPERS

	function setupSmultScales() {
		smultScales.y = d3.scaleTime().domain([d3.timeParse("%Y")("1945"),d3.timeParse("%Y")("2025")]);
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


    	//ADD LABEL FOR EACH SVG

    	svg.append("text")
			.attr("class","genre__label")
			.style("text-anchor", "end")
			.style("font-weight","bold")
			.text(function(d) { 
				console.log(d)
				return d.key; 
			});


    	//ADD VALUE LABELS
    	bars.append("text")
		    .attr("class", "smult__value")
		    .text(function(d){
		        if (d.percent_w >= d.percent_m){
		          return d3.format(".0%")(d.percent_w);
		        } else {
		          return d3.format(".0%")(d.percent_m);
		        }
		    })
		    .attr("text-anchor", function(d){
		      	if (d.percent_w >= d.percent_m){
		          return "end";
		        } else {
		          return "start";
		        }
		    })


		//ADD AXES
		svg.append("g")
    		.attr("class", "axis axis--y")

    	svg.append("g")
 			.attr("class", "axis axis--x")

 		svg.append("line")
 			.attr("class", "zero")

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
			.call(d3.axisBottom(genderScales.x))

		var yaxis = svg.select(".axis--y")
			.call(d3.axisLeft(genderScales.y).ticks(10))
		// If axisBottom and axisLeft, the ticks get cut off by 
		// the svg's boundaries. If I add padding on the svg
		// in the CSS it looks funny -- I probably should be 
		// fetching that element from the dom somewhere
	}

	function drawGenreAxes(svg){
		var xaxis = svg.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(genreScales.x))

		var yaxis = svg.select(".axis--y")
			.call(d3.axisLeft(genreScales.y).ticks(10))

		console.log(yaxis)
		// If axisBottom and axisLeft, the ticks get cut off by 
		// the svg's boundaries. If I add padding on the svg
		// in the CSS it looks funny -- I probably should be 
		// fetching that element from the dom somewhere
	}

	function getBandwidth() {
		var dom = smultScales.y
		console.log(smultScales)
      	r = dom(d3.timeParse("%Y")("2025")) - dom(d3.timeParse("%Y")("1945"));
    
      	console.log(r)
      	return Math.abs(r/8.5);
  	}


	function updateGenderChart() {
		margin = {top:10,bottom:25,left:25,right:10}
		const ratio = 1.5;
		svg_width = chartGender.node().offsetWidth
		svg_height =  Math.floor(svg_width / ratio)
		width = svg_width - margin.left - margin.right;
		height = svg_height - margin.top - margin.bottom;
		
		var svg = chartGender.select('svg')
			.attr('width', svg_width)
			.attr('height', svg_height);

		var g = svg.select('.container')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		g.attr('width', width)
			.attr('height', height);

		updateGenderScales(width,height)

		// redraw elements
		drawGenderAxes(g,height)

		var layer = g.selectAll(".area")
				.attr("d", genderArea)
		      	.style("fill", function(d) { return genderScales.z(d.key); })

	}

	function updateGenreChart() {
		margin = {top:10,bottom:25,left:25,right:10}
		const ratio = 1.5;
		svg_width = chartGender.node().offsetWidth
		svg_height =  Math.floor(svg_width / ratio)
		width = svg_width - margin.left - margin.right;
		height = svg_height - margin.top - margin.bottom;
		
		var svg = chartGenre.select('svg')
			.attr('width', svg_width)
			.attr('height', svg_height);

		var g = svg.select('.container')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		g.attr('width', width)
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
		smultScales.y.range([0, height]);
	}

	function drawSmultAxes(g){
		g.select('.axis--y')
	    	.call(d3.axisLeft(smultScales.y).ticks(7));

  		g.select('.axis--x')
		    .call(d3.axisTop(smultScales.x).ticks(6, "%"));
	}

	function updateSmultChart() {
		var margin = {top:25,bottom:10,left:33,right:20} //figure out how to get these from the css/dom
		const ratio = 1.5;
		svg_width = (chartSmult.node().offsetWidth)/4.5;
		svg_height = svg_width;
		width = svg_width - margin.left - margin.right
		height = svg_height - margin.top - margin.bottom

		
		var svg = chartSmult.selectAll('svg.mult');
		svg.attr('width', svg_width) // not sure how margin works, still...
			.attr('height', svg_height)

		var g = svg.select(".container")
		.attr("height",height)
		.attr("width",width)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		console.log("hot potato")
      	updateSmultScales(width,height)

		var bars = g.selectAll(".bar")
			.attr("y", function(d) { return smultScales.y(d.decade);})
      		.attr("height", getBandwidth()) // MAKE A BANDWIDTH FN

      	console.log("bars",bars)
      	var wbars = g.selectAll(".bar.women")
      		.attr("x", function(d) { return smultScales.x(0); })
      		.attr("width", function(d) { return Math.abs(smultScales.x(0) - smultScales.x(d.percent_w)); });
	
      	var mbars = g.selectAll(".bar.men")
	      	.attr("x", function(d) { return smultScales.x(-1*d.percent_m); })
    		.attr("width", function(d) { return Math.abs(smultScales.x(0) - smultScales.x(d.percent_m)); });

    	g.selectAll(".smult__value")
    		.attr("y", function(d) { return (smultScales.y(d.decade) + getBandwidth()/2 +5);})
		    .attr("x", function(d) {
		        if (d.percent_w >= d.percent_m){
		          return smultScales.x((+d.percent_w - .04));
		        } else {
		          return smultScales.x(-1*(+d.percent_m - .04));
		        }
		    })

		drawSmultAxes(g)

		g.selectAll(".genre__label")
			.attr("y", height)
			.attr("x", width)

		g.select(".zero")
			.attr("y1", smultScales.y(d3.timeParse("%Y")("1945")))
			.attr("x1", smultScales.x(0))
			.attr("y2", smultScales.y(d3.timeParse("%Y")("2025")))
			.attr("x2", smultScales.x(0))
			.style("stroke", "black");

	}

	function setup() {
		setupGenderChart('percent')
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
