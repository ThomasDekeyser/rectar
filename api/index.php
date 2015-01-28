<?php
include_once '../config.php';
include_once '../libs/EpiException.php';
include_once '../libs/EpiDatabase.php';
EpiDatabase::employ('mysql',constant('DB_NAME'),constant('DB_HOST'),constant('DB_USER'),constant('DB_PASSWORD'));

require '../libs/slim/Slim/Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

$app->get('/hello', function() {
		echo "Hello!";
});

$app->get('/list', function() use ($app) {
$myQuery = <<<EOD
SELECT r.receptid,r.titel,c.naam categorie,r.temp,r.soort from recepten r
join recepten_categorie rc on rc.receptid = r.receptid
join categorie c on c.categorieid = rc.categorieid
order by r.titel asc;
EOD;
//where receptid in (479,473,481)
		
		$recepten = getDatabase()->all($myQuery);	

		$app->contentType('application/json');
		header("Content-Disposition: attachment; filename=json.data");
		header("Pragma: no-cache");
		header("Expires: 0");
		echo json_encode($recepten);					
});

$app->get('/list/:receptid', function($receptid) use ($app) {
	
$myQuery = <<<EOD
SELECT r.*,c.naam categorie from recepten r
join recepten_categorie rc on rc.receptid = r.receptid
join categorie c on c.categorieid = rc.categorieid
where r.receptid = :receptid;
EOD;
		$recept = getDatabase()->all($myQuery, array(':receptid' =>$receptid));
		
		$app->contentType('application/json');
		header("Content-Disposition: attachment; filename=json.data");
		header("Pragma: no-cache");
		header("Expires: 0");

		echo json_encode($recept[0]);			
});

$app->get('/delete/:receptid', function($receptid) use ($app) {
	
$myDeleleteQuery1 = <<<EOD
DELETE from recepten_categorie where receptid = :receptid;
EOD;
$myDeleleteQuery2 = <<<EOD
DELETE from recepten where receptid = :receptid;
EOD;

		getDatabase()->execute($myDeleleteQuery1, array(':receptid' =>$receptid));
		getDatabase()->execute($myDeleleteQuery2, array(':receptid' =>$receptid));
		
		$app->contentType('application/json');
		header("Content-Disposition: attachment; filename=json.data");
		header("Pragma: no-cache");
		header("Expires: 0");
		
		print("{\"action\":\"OK\",\"receptid\":".$receptid."}");
		
});


$app->post('/save',function() use($app) {
	$receiptJsonDate = $app->request->post('recept');
	$receptid = intval($receiptJsonDate['receptid']);
	
	if ($receptid == -1) {
		//Toevoegen Blank recept
$getNextReceptId = <<<EOD
select max(receptid)+1 as nextreceptid from recepten;
EOD;
$addNewRecept = <<<EOD
INSERT INTO recepten (receptid) values(:newReceptId);
EOD;
$addNewReceptInCategorie = <<<EOD
INSERT INTO recepten_categorie (receptid,categorieid) values(:newReceptId,1);
EOD;

		$selectNextReceptIdResult = getDatabase()->one($getNextReceptId);
		$receptid = $selectNextReceptIdResult['nextreceptid'];
		getDatabase()->execute($addNewRecept,array(':newReceptId' => $receptid));
		getDatabase()->execute($addNewReceptInCategorie,array(':newReceptId' => $receptid));		
	}
	//Update bestaand recept
$updateReceptQuery = <<<EOD
UPDATE recepten SET
titel = :titel,
temp = :temp,
soort = :soort,
ingred = :ingred,
personen = :personen,
tijd = :tijd,
diff = :diff,
uitgeprobeerd = :uitgeprobeerd,
vooraf = :vooraf,
vriezen = :vriezen,
wijn = :wijn,
trefwoord = :trefwoord,
bereiding = :bereiding,
bron = :bron,
tip = :tip
where receptid = :receptid
EOD;
	getDatabase()->execute($updateReceptQuery,
				array(':titel' => $receiptJsonDate['titel'],
				':temp' => $receiptJsonDate['temp'],
				':soort' => $receiptJsonDate['soort'],
				':ingred' => $receiptJsonDate['ingred'],
				':personen' => $receiptJsonDate['personen'],					
				':tijd' => intval($receiptJsonDate['tijd']),
				':diff' => intval($receiptJsonDate['diff']),
				':uitgeprobeerd' => $receiptJsonDate['uitgeprobeerd'],
				':vooraf' => $receiptJsonDate['vooraf'],
				':vriezen' => $receiptJsonDate['vriezen'],
				':wijn' => $receiptJsonDate['wijn'],
				':trefwoord' => $receiptJsonDate['trefwoord'],
				':bereiding' => $receiptJsonDate['bereiding'],
				':bron' => $receiptJsonDate['bron'],
				':tip' => $receiptJsonDate['tip'],					
				':receptid' => $receptid)
	);
$updateReceptCategorieQuery = <<<EOD
update recepten_categorie rc
set rc.categorieid = (select categorieid from categorie c where c.naam = :categorie)
where rc.receptid = :receptid;
EOD;
	getDatabase()->execute($updateReceptCategorieQuery,
				array(':categorie' => $receiptJsonDate['categorie'],
				':receptid' => $receptid)
	);

	$app->contentType('application/json');
	print("{\"action\":\"OK\",\"receptid\":".$receptid."}");
});

$app->run();
