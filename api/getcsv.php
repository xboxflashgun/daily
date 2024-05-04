<?php

header('Content-type: text/csv');
header("Cache-control: private");

foreach ($_GET as $k => $v)     {

	if(preg_match('/[^0-9a-z_-]/', $k) ||
		preg_match('/[^,0-9A-Za-z \/=-]/', $v))

		die("Oops: $k, $v");

}

$db = pg_pconnect("port=6432 dbname=global user=readonly password=masha27uk")
	or die("could not connect to DB");

$rows = array();
$timeout = 5;

if( substr( $_GET['f'], 0, 3) == 'get' )
    $_GET['f']();

$rep = implode($rows);

header("Cache-control: max-age=$timeout");

echo $rep;

// usage: GET http://host/api/getcsv.php?f=func&par=parameters

function getgamenames()	{

	global $rows, $db;

	$rows = pg_copy_to($db, "(select * from hourlytotals)", chr(9));

}

function getmaintable()	{

	global $rows, $db;

	$req = makewhere2("titleid is not null");
	error_log($req);

	if(isset($_GET['utime']))
		$subreq = "
select
    titleid,
    lang,
    country,
    max(players) as players
from hourlytab
where
	$req
	and utime=" . $_GET['utime'] . "
group by 1,2,3
";

	else
		$subreq = "
select
    titleid,
    lang,
    country,
    players
from hourlycached
where
	$req
";

	$rows = pg_copy_to($db, "(

with tab as (
	$subreq
) select 
	titleid,
	max(players),
	count(distinct country) as countries,
	count(distinct lang) as langs
from tab
group by 1


	)", chr(9));

}

function getmaxplayers()	{

	global $rows, $db;

	if(isset($_GET['utime']))
		$req = "utime=" . $_GET['utime'];
	else
		$req = "true";

	if(isset($_GET['titleids']))
		$req .= " and titleid=any(array[" . $_GET['titleids'] . "])";
	else
		$req .= " and titleid is null";

	if(isset($_GET['countries']))
		$req .= " and country=any(array['" . str_replace(',', "','", $_GET['countries']) . "'])";
	else
		$req .= " and country is not null";

	if(isset($_GET['langs']))
		$req .= " and lang=any(array['" . str_replace(',', "','", $_GET['langs']) . "'])";
	else
		$req .= " and lang is not null";

	$rows = pg_copy_to($db, "(

select 
	max(players) as players,
	country,
	lang 
from hourlytab 
where 
	$req 
	and country is not null
    and lang is not null
group by cube(2,3)

	)", chr(9));

}

function getcountries()	{

	global $rows, $db;

	$rows = pg_copy_to($db, "(

select 
	country,name,region,subregion
from isocountry

	)", chr(9));

}


function getlangs()	{

	global $rows, $db;

	$rows = pg_copy_to($db, "(

select 
	lang,name
from isolang

	)", chr(9));

}

function makewhere1()	{

	if(isset($_GET['titleids']))
		$req = "titleid=any(array[" . $_GET['titleids'] . "])";
	else
		$req = "titleid is null";

	return $req;

}

function makewhere2($req)	{

	if(isset($_GET['utime']))
		$req .= " and utime=" . $_GET['utime'];

	if(isset($_GET['countryadd']))
		$req .= " and country=any(array['" . str_replace(',', "','", $_GET['countryadd']) . "'])";

	if(isset($_GET['countrydel']))
		$req .= " and country<>all(array['" . str_replace(',', "','", $_GET['countrydel']) . "'])";

	if(isset($_GET['langadd']))
		$req .= " and lang=any(array['" . str_replace(',', "','", $_GET['langadd']) . "'])";

	if(isset($_GET['langdel']))
		$req .= " and lang<>all(array['" . str_replace(',', "','", $_GET['langdel']) . "'])";

	return $req;

}

function getcountryadd()	{

	global $rows, $db;

	$req = makewhere1();

	$rows = pg_copy_to($db, "(

select 
    max(players) as players,
    country
from hourlytab 
where 
    $req 
    and country is not null
    and lang is not null
group by cube(2)

	)", chr(9));

}

function getcountrydel()	{

	global $rows, $db;

	$req = makewhere2(makewhere1());

	if(isset($_GET['lang']))
		$req .= " and lang=any(array[" . $_GET['lang'] . "])";
	else
		$req .= " and lang is not null";

	$rows = pg_copy_to($db, "(

select 
    max(players) as players,
    country
from hourlytab 
where 
    $req
    and country is not null
group by cube(2)

	)", chr(9));

}

function getlangadd()	{

	global $rows, $db;

	$req = makewhere1();

	$rows = pg_copy_to($db, "(

select 
    max(players) as players,
    lang
from hourlytab 
where 
    $req 
    and country is not null
    and lang is not null
group by cube(2)

	)", chr(9));

}

function getlangdel()	{

	global $rows, $db;

	$req = makewhere2(makewhere1());

	if(isset($_GET['country']))
		$req .= " and country=any(array[" . $_GET['country'] . "])";
	else
		$req .= " and country is not null";

	$rows = pg_copy_to($db, "(

select 
    max(players) as players,
    lang
from hourlytab 
where 
    $req 
    and lang is not null
group by cube(2)

	)", chr(9));

}








