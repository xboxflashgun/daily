var utimemin, utimemax;

var graph = [
	{
		div: "players",
		req: "titleid"
	},
	{
		div: "country",
		req: "country"
	},
	{
		div: "lang",
		req: "lang"
	}
];

var ref = {};

function regraph()	{

	var pr = [];

	utimemin = undefined;
	utimemax = undefined;

	graph.forEach( g => {
		
		pr.push(readgraph(g));

	});

	pr.push(fetch("api/getcsv.php?f=getgraphref")
		.then( res => res.text() )
		.then( res => {

			res.split('\n').forEach( s => {

				if(s.length === 0)
					return;

				var [ utime, players ] = s.split('\t');

				ref[utime] = +players;

			});

		}));

	Promise.all(pr)
	.then( () => {

		graph.forEach( g => {
		
			drawgraph(g);

		});

	});


}

var margin = {
	top: 10, 
	right: 30, 
	bottom: 30, 
	left: 50
};

function drawgraph(g)	{

	var svg = d3.select("#" + g.div + "graph svg");

	var width = 930 - margin.left - margin.right;
	var height = 200 - margin.top - margin.bottom;

	if( svg.select(".XAxis").empty() )	{
	
		svg
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		svg.append("g")
		.attr("transform", `translate(0, ${height})`)
		.attr("class", "XAxis");

		svg.append("g")
		.attr("transform", `translate(${width},0)`)
		.attr("class","YAxis");
	}

	g.x = d3.scaleLinear().range([0,width]);
	g.xAxis = d3.axisBottom().scale(g.x);

	g.y = d3.scaleLinear().range([height, 0]);
	g.yAxis = d3.axisLeft().scale(g.y);

	graphupdate(g);

}

function graphupdate(g)	{

	var svg = d3.select("#" + g.div + "graph svg");

	g.items ??= [];
	g.items = g.items.filter( i => ! Object.keys(g.graph).includes(i) );

	g.x.domain([ utimemin, utimemax ]);

	svg.selectAll(".XAxis")
		// .transition()
		// .duration(3000)
		.call(g.xAxis);

	g.y.domain([ 0, g.playersmax ] );
	svg.selectAll(".YAxis")
		// .transition()
		// .duration(3000)
		.call(g.yAxis);

	g.color = d3.scaleOrdinal(Object.keys(g.graph), d3.schemeObservable10);

	Object.keys(g.graph).forEach(t => {

		var tt = (t === '\\N') ? 'all' : t;
		
		if(tt === 'all' && Object.keys(g.graph).length > 1)
			return;

		console.log('draw ', tt, ' num: ', Object.keys(g.graph).length);

		var u = svg.selectAll(".lineGraph" + tt)
				.data( [ Object.keys(g.graph[t]) ] );

		u.join( enter => {
			enter.append("path")
			.classed("lineGraph"+tt, true)
			// .transition()
			// .duration(3000)
			.attr("d", 
				d3.line( d => g.x(+d), d => g.y(g.graph[t][+d]) ) 
			)
			.attr("stroke", d => g.color(d) )
			.attr("stroke-width", 1.5)
			.attr("fill", "none");
		}, update => {
			update.select("path")
			.classed("lineGraph"+tt, true)
			// .transition()
			// .duration(3000)
			.attr("d",
				d3.line( d => g.x(+d), d => g.y(g.graph[t][+d]) )
			)
			.attr("stroke", "green")
			.attr("stroke-width", 1.5)
			.attr("fill", "none");
		}, exit => {
			exit.select("path").remove();
		});

	});

	if(Object.keys(g.graph).length > 1)
		svg.selectAll(".lineGraph" + "all").remove();

	g.items.forEach( t => {

		svg.selectAll(".lineGraph" + t).remove();

	});

	g.items = Object.keys(g.graph);

}

function readgraph(g)	{

	var req = makereqstr();

	return fetch("api/getcsv.php?f=getgraph&what=" + g.req + req)
	.then( res => res.text() )
	.then( res => {

		g.graph = {};
		g.playersmax = undefined;

		console.log("api/getcsv.php?f=getgraph&what=" + g.req + req);

		res.split('\n').forEach( s => {

			if(s.length === 0)
				return;

			var [ utime, id, players ] = s.split('\t');

			players = +players;
			utime = +utime;

			g.graph[id] ??= {};
			g.graph[id][utime] = players;

			utimemax = d3.max([utimemax, utime]);
			utimemin = d3.min([utimemin, utime]);

			g.playersmax = d3.max( [ g.playersmax, players ] );

		});

	});

}


