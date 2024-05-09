
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

function regraph()	{

	var pr = [];

	graph.forEach( g => {
		
		pr.push(drawgraph(g.div, g.req));

	});

	pr.push(fetch("api/getcsv.php?f=getgraphref")
		.then( res => res.text() )
		.then( res => {

			console.log('ref');

		}));

	Promise.all(pr)
	.then( () => {

		console.log('well done');

	});


}

function drawgraph(div, what)	{

	var req = makereqstr();

	return fetch("api/getcsv.php?f=getgraph&what=" + what + req)
	.then( res => res.text() )
	.then( res => {

		console.log(div, what, req, res);

	});

}
