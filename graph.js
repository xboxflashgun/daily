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

	g.x.domain([ utimemin, utimemax ]);

	svg.selectAll(".XAxis")
		// .transition()
		// .duration(3000)
		.call(g.xAxis);

	var lines = (new Set(g.graph.map( d => d.id )).size);
	const grouped = d3.group( g.graph.filter( d => (lines > 1) ? d.id !== 'all' : true), d => d.id );

	g.y.domain([ 0, d3.max( g.graph.filter( d => (lines > 1) ? d.id !== 'all' : true), d => d.players ) ] );
	svg.selectAll(".YAxis")
		// .transition()
		// .duration(3000)
		.call(g.yAxis);


	const color = d3.scaleOrdinal(Array.from(grouped.keys()).sort(), d3.schemeObservable10);

	svg.selectAll('.line')
	.data(grouped)
	.join(enter => {
		enter.append("path")
		.attr("class", "line")
		.attr("fill", "none")
		.attr("stroke", d => color(d[0]))
		.attr("stroke-width", 1.5)
		.attr("d", d => d3.line()
			.x( d => g.x(d.utime) )
			.y( d => g.y(d.players) )
			(d[1])
		)
	}, update => {
		update.attr("fill", "none")
		.attr("stroke", d => color(d[0]))
		.attr("stroke-width", 1.5)
		.attr("d", d => d3.line()
			.x( d => g.x(d.utime) )
			.y( d => g.y(d.players) )
			(d[1])
		)
	}, exit => {
		exit.remove();
	}
	);

}

function readgraph(g)	{

	var req = makereqstr();

	return fetch("api/getcsv.php?f=getgraph&what=" + g.req + req)
	.then( res => res.text() )
	.then( res => {

		g.graph = [];

		// console.log("api/getcsv.php?f=getgraph&what=" + g.req + req);

		res.split('\n').forEach( s => {

			if(s.length === 0)
				return;

			var [ utime, id, players ] = s.split('\t');

			g.graph.push( { utime: +utime, id: (id === '\\N') ? 'all' : id, players: +players } );

			utimemax = d3.max([utimemax, utime]);
			utimemin = d3.min([utimemin, utime]);

		});

	});

}


