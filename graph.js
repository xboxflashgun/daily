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

			console.log(ref);

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
	
		svg.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

		svg.append("g")
		.attr("transform", `translate(0, ${height})`)
		.attr("class", "XAxis");

		svg.append("g")
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

	g.x.domain([ utimemin, utimemax ]);

	svg.selectAll(".XAxis")
		.transition()
		.duration(3000)
		.call(g.xAxis);

	g.y.domain([ 0, g.playersmax ] );
	svg.selectAll(".YAxis")
		.transition()
		.duration(3000)
		.call(g.yAxis);

	Object.keys(g.graph).forEach(t => {

		var u = svg.selectAll(".lineGraph")
				.data( [ Object.keys(g.graph[t]) ] );

		console.log(t);

		u.join( enter => {
			enter.append("path")
			.classed("lineGraph", true)
			.transition()
			.duration(3000)
			.attr("d", 
				d3.line( d => g.x(+d), d => g.y(g.graph[t][+d]) ) 
			)
			.attr("stroke", "red")
			.attr("stroke-width", 1.5)
			.attr("fill", "none");
		}, update => {
			update.select("path")
			.transition()
			.duration(3000)
			.attr("d",
				d3.line( d => g.x(+d), d => g.y(g.graph[t][+d]) )
			)
			.attr("stroke", "green")
			.attr("stroke-width", 1.5)
			.attr("fill", "none");
			console.log(update);
		}, exit => {
			exit.remove();
		});

	});

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


