
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
		
		pr.push(drawgraph(g));

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

		console.log(graph);

	});


}

function drawgraph(g)	{

	var req = makereqstr();

	return fetch("api/getcsv.php?f=getgraph&what=" + g.req + req)
	.then( res => res.text() )
	.then( res => {

		g.grapth = {};

		res.split('\n').forEach( s => {

			if(s.length === 0)
				return;

			var [ utime, id, players ] = s.split('\t');

			g[utime] ??= {};
			g[utime][id] = +players;

		});

	});

}
