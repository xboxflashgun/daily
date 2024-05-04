//
var total;				// total gamers
var gamenames = {};		// titleid, players, countries, langs, name overall
var gametable = {};		// titleid, players, countries, langs, perc
var countrylang = {};	// countrylang[country][lang] = players

// selected items:
var selgames = {};
var seltitleids = {};
var gamefilter = '';
var utimefilter = '';
var absflag;			// =1 if absolute values used

var selcountries = {};
var sellangs = {};

var table = [];			// table pointer
var tabsorter = playerSorter;
var sortord = 1;

function namesorter(a, b)	{
	return a.localeCompare(b);
}

function namesorter_r(a, b)	{
	return b.localeCompare(a);
}

function casorter(a, b)	{
	return lc['country']['add'][b] - lc['country']['add'][a];
}

function casorter_r(a, b)	{
	return lc['country']['add'][a] - lc['country']['add'][b];
}

function cdsorter(a, b)	{
	return lc['country']['del'][b] - lc['country']['del'][a];
}

function cdsorter_r(a, b)	{
	return lc['country']['del'][a] - lc['country']['del'][b];
}

function lasorter(a, b)	{
	return lc['lang']['add'][b] - lc['lang']['add'][a];
}

function lasorter_r(a, b)	{
	return lc['lang']['add'][a] - lc['lang']['add'][b];
}

function ldsorter(a, b)	{
	return lc['lang']['del'][b] - lc['lang']['del'][a];
}

function ldsorter_r(a, b)	{
	return lc['lang']['del'][a] - lc['lang']['del'][b];
}


var lcsort = {
	country: {
		add:  {
			sorter: [ [ namesorter, namesorter_r], [ casorter, casorter_r ] ],
			sortord: 0,
			sortcol: 1
		},
		del:  {
			sorter: [ [ namesorter, namesorter_r ], [ cdsorter, cdsorter_r ] ],
			sortord: 0,
			sortcol: 1
		}
	},
	lang: {
		add:  {
			sorter: [ [ namesorter, namesorter_r], [ lasorter, lasorter_r ] ],
			sortord: 0,
			sortcol: 1
		},
		del:  {
			sorter: [ [ namesorter, namesorter_r], [ ldsorter, ldsorter_r ] ],
			sortord: 0,
			sortcol: 1
		}
	}
};

function main()	{

	redraw(0);
	selecters("country");
	selecters("lang");
	reloadsels();

}

var lc = {};		// language-country selectors lc[lang/country][add/del] = {}
var lcnames = {};	// lcnames['RU'], lcnames['ru']
var lcbox = {};		// lcnames[lang/country][add/del]['ru'] = 1/undef

function makesubselecters(sel, what, name, div)	{

	var tab = div.append('div').classed("subseldiv", true).append('table').attr("id", sel + what + "tab").classed("th" + what, true);
	var th = tab.append('thead');
	th.append('th').attr("data-sort", "0").text(name);
	th.append('th').attr("data-sort", "1").text('Players');
	tab.append('tbody');
	lc[sel][what] = {};

	// sort subsel tables
	th.selectAll("th").on('click', e => {
		var newcol = +e.target.dataset.sort;
		var [ oldcol, ord ] = [ lcsort[sel][what]['sortcol'], lcsort[sel][what]['sortord'] ];
		if(oldcol === newcol)
			ord = 1 - ord;
		else
			ord = 0;
		[ lcsort[sel][what]['sortcol'], lcsort[sel][what]['sortord'] ] = [ newcol, ord ];
		tab.select("tbody").selectAll("tr").sort( lcsort[sel][what]['sorter'][newcol][ord] );
	});

}

function selecters(sel)	{

	var div = d3.select("#" + sel + "seldiv");
	if( div.select('input').empty() )	{	// create block
		div.classed('seltab', true);
		var header = div.append('div').classed("selheader", true);
		header.append('input').attr('type', 'radio').attr('name', sel+'radio');
		header.append('span').text('Absolute');
		header.append('input').attr('type', 'radio').attr('name', sel+'radio');
		header.append('span').text('Percentage');
		var tabs = div.append("div");
		lc[sel] = {};
		var what = (sel === 'lang')? "Language" : "Country";
		makesubselecters(sel, "add", "Add " + what, tabs);
		makesubselecters(sel, "del", "Del " + what, tabs);
	}

}

function makereqstr()	{

	var str = '';

	if(utimefilter)
		str += '&utime=' + utimefilter;

	if(Object.keys(seltitleids).length > 0)
		str += "&titleids=" + Object.keys(seltitleids).join(',');

	Object.keys(lcbox).forEach(sel => {
		Object.keys(lcbox[sel]).forEach( what => {
			if(Object.keys(lcbox[sel][what]).length > 0)
				str += "&" + sel + what + "=" + Object.keys(lcbox[sel][what]).filter( d => (d !== '\\N') ).join(',');
		});
	});

	return str;

}

function reloadsels()	{

	var pr = [];

	// clear-up add=del:
	Object.keys(lcbox).forEach(sel => {
		Object.keys(lcbox[sel]['add']).forEach( name => {
			if( lcbox[sel]['del'] && lcbox[sel]['del'][name] )	{
				delete lcbox[sel]['del'][name];
				delete lcbox[sel]['add'][name];
			}
		});
	});
	
	Object.keys(lc).forEach(sel => {
		Object.keys(lc[sel]).forEach( what => {
			var req = "get" + sel + what + makereqstr();
			pr.push(fetch("api/getcsv.php?f=" + req)
			.then( res => res.text() )
			.then( res => {
				
				Object.keys(lc[sel][what]).forEach( k => delete lc[sel][what] );

				res.split('\n').forEach( s => {

					if(s.length === 0)
						return;

					var [ players, key ] = s.split('\t');
					lc[sel] ??= {};
					lc[sel][what] ??= {};
					lc[sel][what][key] = +players;

				});

				drawsel(sel, what);
			
			}));

		});

	});

	Promise.all(pr)
	.then( () => {
		//
	});

}



function drawsel(sel, what)	{

	lcbox[sel] ??= {};
	lcbox[sel][what] ??= {};
	var tbody = d3.select("#" + sel + what + "tab tbody");
	tbody.selectAll("tr")
	.data(Object.keys(lc[sel][what]).filter( d => (d !== '\\N') ))
	.join( enter => {
		var row = enter.append('tr');
		var td = row.append('td').append('label');
		td.append('input').attr("type", "checkbox").attr('data-name', d => d).property("checked", d => (d in lcbox[sel][what]));
		td.append('span').text(d => d);
		row.append('td').text(d => lc[sel][what][d]);
	}, update => {
		update.select('span').text(d => d);
		update.select('input').attr("type", "checkbox").attr('data-name', d => d).property("checked", d => (d in lcbox[sel][what]));
		update.select('td:nth-child(2)').text(d => lc[sel][what][d]);
	}, exit => {
		exit.remove()
	});

	var [ col, ord ] = [ lcsort[sel][what]['sortcol'], lcsort[sel][what]['sortord'] ];
	tbody.selectAll("tr").sort( lcsort[sel][what]['sorter'][col][ord] );

	// checkboxes
	tbody.selectAll('input').on('change', e => {
		var name = e.target.dataset.name;
		if( d3.select(e.target).property('checked') )	{
			lcbox[sel] ??= {};
			lcbox[sel][what] ??= {};
			lcbox[sel][what][name] = 1;
		} else
			delete lcbox[sel][what][name];
		reloadsels();
		redraw(0);
	});

}

//////////////////////////////

function playerSorter(a, b) {
	return sortord * (gametable[b].players - gametable[a].players);
}

function nameSorter(a, b)   {
	return sortord * gamenames[a].name.localeCompare(gamenames[b].name);
}

// Draw the game table
function drawgametable()	{

	var filter = d3.select("#namefilter").property('value').toLowerCase();
	table = Object.keys(gametable).filter( d => ( gamenames[d].name.toLowerCase().indexOf(filter) >= 0 ));

	d3.select("#gamestab tbody").selectAll('tr')
	.data(table)
	.join( enter => {
		var row = enter.append('tr');
		var td = row.append('td').append('label');
		td.append('input').attr("type", "checkbox").property("checked", d => (d in seltitleids));
		td.append('span').text(d => gamenames[d].name ).attr("title", d => d);
		row.append('td').text(d => gametable[d].players);
		row.append('td').text(d => compact_perc(gametable[d].perc * 100,total));
		row.append('td').text(d => gametable[d].countries);
		row.append('td').text(d => gametable[d].langs);
		row.attr('data-titleid', d => d);
	}, update => {
		update.select('input').property("checked", d => (d in seltitleids));
		update.select('span').text(d => gamenames[d].name ).attr("title", d => d );
		update.select('td:nth-child(2)').text(d => gametable[d].players);
		update.select('td:nth-child(3)').text(d => compact_perc(gametable[d].perc * 100,total));
		update.select('td:nth-child(4)').text(d => gametable[d].countries);
		update.select('td:nth-child(5)').text(d => gametable[d].langs);
		update.attr('data-titleid', d => d);
	}, exit => {
		exit.remove();
	});

	d3.select("#gamestab tbody").selectAll('tr').sort(tabsorter);

	d3.select("#namefilter").on('input', d => drawgametable());
	d3.selectAll("#gamestab th[data-sorter]").on('click', (e) => {

		if(e.target.tagName !== 'TH')
			return;
		var sorter = window[e.target.dataset.sorter];
		
		if(tabsorter === sorter)
			sortord = -sortord;
		else
			[ tabsorter, sortord ] = [ sorter, 1 ];

		d3.select("#gamestab tbody").selectAll('tr').sort(tabsorter);

	});

	// checkboxes
	function checkboxes()	{

		if( Object.keys(seltitleids).length === 0 )
			d3.select('#gamestab input[type="checkbox"]').property("disabled", true).property("checked", false).on('click', e => {
				Object.keys(seltitleids).forEach( t => {
					d3.select(`#gamestab tbody tr[data-titleid="${t}"] input`).property("checked", false);
					delete seltitleids[t];
				});
				checkboxes();
				redraw(1);
				reloadsels();
			});
		else
			d3.select('#gamestab input[type="checkbox"]').property("disabled", false).property("checked", true);

	}
	checkboxes();

	d3.selectAll("#gamestab tbody tr").on('click', e => {
		if(e.target.tagName === 'TD')	{
			var input = d3.select(e.target.parentNode).select("input");
			input.property("checked", ! input.property("checked"));
			input.dispatch('change');
		}
	});
	d3.selectAll("#gamestab tbody tr input").on('change', e => {
		var titleid = e.target.parentNode.parentNode.parentNode.dataset.titleid;
		if(e.target.checked)
			seltitleids[titleid] = 1;
		else
			delete seltitleids[titleid];
		checkboxes();
		redraw(0);
		reloadsels();
	});

}

// flag === 0:	reread everything
// flag | 1: 	except main title table
function redraw(flag)	{

	var promises = [];
	var str = makereqstr();

	if((flag & 1) === 0)	promises.push(fetch("api/getcsv.php?f=getmaintable"+str)
		.then( res => res.text() )
		.then( res => {

			gametable = [];		// clear table

			res.split('\n').forEach( s => {

				if(s.length === 0)
					return;

				var [ titleid, players, countries, langs ] = s.split('\t');
				gametable[titleid] = {
					players: +players,
					countries: +countries,
					langs: +langs
				};

			});

		}));

	if(Object.keys(gamenames).length === 0)

		promises.push(fetch("api/getcsv.php?f=getgamenames")
		.then( res => res.text() )
		.then( res => {

			res.split('\n').forEach( s => {

				if(s.length === 0)
					return;

				var [ titleid, players, countries, langs, name ] = s.split('\t');
				gamenames[titleid] = {
					name: name,
					players: +players,
					countries: +countries,
					langs: +langs
				};

			});

		}));

	if(Object.keys(lcnames).length === 0)	{
		promises.push(fetch("api/getcsv.php?f=getcountries")
			.then( res => res.text() )
			.then( res => {

				res.split('\n').forEach( s => {

					if(s.length === 0)
						return;

					var [ cc, name, region, subregion ] = s.split('\t');

					lcnames[cc] = name;
					lcnames[cc] += (region !== '') ? ', ' + region : '';
					lcnames[cc] += (subregion !== '') ? ', ' + subregion : '';

				});

			})
		);

		promises.push(fetch("api/getcsv.php?f=getlangs")
			.then( res => res.text() )
			.then( res => {

				res.split('\n').forEach( s => {

					if(s.length === 0)
						return;

					var [ lang, name ] = s.split('\t');

					lcnames[lang] = name;

				});

			})
		);
	}

	var titles = "";
	if(Object.keys(seltitleids).length > 0)
		titles = "&titleids=" + Object.keys(seltitleids).join(',');

	promises.push(fetch("api/getcsv.php?f=getmaxplayers"+ titles + str)
	.then( res => res.text() )
	.then( res => {

		Object.keys(countrylang).forEach( k => delete countrylang[k] );

		res.split('\n').forEach( s => {

			if(s.length === 0)
				return;

			var [ players, country, lang ] = s.split('\t');
			country = (country === '\\N') ? 'total' : country;
			lang = (lang === '\\N') ? 'total' : lang;
			countrylang[country] ??= {};
			countrylang[country][lang] = +players;

		});

	}));

	Promise.all( promises )
	.then( () => {

		// calc percentage according to lang/country
		total = 0;

		if(Object.keys(selcountries).length === 0)
			if(Object.keys(sellangs).length === 0)
				total = countrylang['total']['total'];
			else
				Object.keys(sellangs).forEach( l => total += countrylang['total'][l] );
		else
			Object.keys(selcountries).forEach( c => {
				if(Object.keys(sellangs).length === 0)
					total += countrylang[c]['total'];
				else
					Object.keys(sellangs).forEach( l => total += countrylang[c][l] );
			});

		Object.keys(gametable).forEach( t => gametable[t].perc = gametable[t].players/total );

		if( (flag & 1) === 0 )
			drawgametable();

	});

}

function compact_perc( num, base )  {

        var maxdig = (base >= 10) ? Math.log10(base) || 0 : 0;
        return (num).toFixed(maxdig) + '%';

}


