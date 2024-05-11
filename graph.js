
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

	svg.append("g")
	.attr("transform", `translate(${margin.left},${margin.top})`);

	g.x = d3.scaleLinear().range([0,width]);
	g.xAxis = d3.axisBottom().scale(g.x);

	svg.append("g")
	.attr("transform", `translate(0, ${height})`)
	.attr("class", "XAxis");

	g.y = d3.scaleLinear().range([height, 0]);
	g.yAxis = d3.axisLeft().scale(g.y);

	svg.append("g")
	.attr("class","myYaxis");

	console.log(g);
	graphupdate(g);

}

function graphupdate(g)	{

	var svg = d3.select("#" + g.div + "graph svg");

	g.x.domain([0, d3.max(Object.keys(g.graph), function(d) { return d }) ]);

	svg.selectAll(".XAxis")
		.transition()
		.duration(3000)
		.call(g.xAxis);

	g.y.domain([0, d3.max(Object.keys(g.graph), d => d3.max(Object.keys(g.graph[d]), t => g.graph[d][t] ) ) ] );
	svg.selectAll(".YAxis")
		.transition()
		.duration(3000)
		.call(g.yAxis);

	Object.keys(g.graph).forEach( t => {

		console.log(t);

	});

}

function readgraph(g)	{

	var req = makereqstr();

	return fetch("api/getcsv.php?f=getgraph&what=" + g.req + req)
	.then( res => res.text() )
	.then( res => {

		g.graph = {};

		res.split('\n').forEach( s => {

			if(s.length === 0)
				return;

			var [ utime, id, players ] = s.split('\t');

			g.graph[utime] ??= {};
			g.graph[utime][id] = +players;

		});

	});

}


