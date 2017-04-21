(function() {

	var genderData = null;
	var genreData = null;
	var smultData = null;
	var genderWidth = 0;
	var genderHeight = 0;
	var genderScales = {};

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
			femalePercent: female / total,
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
			cb()
		});
	}

	function setupGenderChart() {
		// set up the DOM elements
		var svg = chartGender.select('svg');

		var g = svg.append('g');

		g.append('g')
			.attr('class', 'axis');

		var bars = g.append('g')
			.attr('class', 'bars');

		bars.selectAll('.bar')
			.data(genderData)
		.enter().append('rect')
			.attr('class', 'bar');

		// setup scales
		// genderScales.x = d3.scaleLinear().domain()
	}

	function updateGenderChart() {
		const ratio = 1.5;
		width = chartGender.node().offsetWidth;
		height = Math.floor(width / 1.5);
		
		var svg = chartGender.select('svg');

		svg
			.attr('width', width)
			.attr('height', height);

		scaleX.range([0, height])

		// redraw elements

		// svg.selectAll('.bar')
		// 	.attr('x', function(d) {

		// 	})
	}

	function resize() {
		updateGenderChart()
	}

	function init() {
		loadData(function() {
			setupGenderChart()	
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
