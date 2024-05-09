
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

	graph.forEach( g => {
		
		console.log(g.div, g.req);

	});

}
