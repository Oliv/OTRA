<?php

/*
here we go !

voila les infos pour l'inventaire :

a chaque modif de l'inventaire, je t'envoie trois choses :
	inventaire : sac a dos du personnage : tableau simple avec les objets présents
	equipement : objets équipés (chaque clé correspond a un emplacement)
	objetEnMain: objet tenu par l'utilisateur (pendant les deplacements par exemple)

pour prendre ou poser un objet, il faut que tu m'envoie un message avec :
	message.action = 'actionInventaire'
	message.parametres.nomInventaire = 'inventaire' || 'equipement' || 'coffre'
	message.parametres.emplacement = emplacement visé (soit l'index du tableau pour l'inventaire, soit la clé de l'emplacement pour l'équipement)

je t'envoie la mise à jour de l'inventaire à chaque action

normalement, les objets présents ont un nom, une tile et une liste de modificateurs de compétences, caracs, stats

je rajouterai plus tard les objets qui servent au crafting etc, faut qu'on décide de la mécanique du jeu avat de se jeter dans le code :D

*/

require('bdd.php');
require('fonctions.php');

$bdd = new bdd('localhost','otraNew','root', '00d70c56');
$token = false;

if (isset($_POST['pseudo']) && trim($_POST['pseudo'])!="")
	{
	$user = $bdd -> read("select * from `persos` where pseudo = ".$bdd-> quote($_POST['pseudo'])."");
	if (count($user) > 0)
		{
		$user = $user[0];
		if ($user['enligne'] == 1)
			{
			$erreur = "Vous êtes déjà connecté.";
			}
		else
			{
			$token = sha1(microtime()).sha1($user['pseudo'].microtime());
			$bdd -> update('persos',array('token' => $token), $user['cle']);
			$valid = true;
			}
		}
	else
		{
		$user = array();
		$user['pseudo'] = $_POST['pseudo'];
		$token = sha1(microtime()).sha1($user['pseudo'].microtime());
		$user['token'] = $token;

		$user['force'] = "100";
		$user['constitution'] = "100";
		$user['agilite'] = "100";
		$user['intelligence'] = "100";
		$user['charisme'] = "100";

		$test = $bdd -> insert('persos',$user);
		if (!is_file('img/chars/j'.$test.'.png'))
			{
			copy('img/chars/j1.png', 'img/chars/j'.$test.'.png');
			}
		}
	}

if (!$token)
	{

?>
<!doctype html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<title>Jeu En Ligne - Dev</title>
    	<link rel="stylesheet" type="text/css" href="style.css" />
	</head>
	<body>
		<form method='POST'>
			<label for='pseudo'>Pseudo</label><input type='text' name='pseudo' id='pseudo' />
			<input type='submit' value='Connexion'>
		</form>
	</body>
</html>
<?php
	die;
	}
?>

<!doctype html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<title>Jeu En Ligne - interface de test</title>
		<link type="text/css" href="css/normalize-2.0.1.css" rel="stylesheet"></link>
		<link type="text/css" href="css/style.css" rel="stylesheet"></link>

		<script src="js/mootools/mootools-core-1.4.5-full-nocompat.js"></script>
		<script src="js/mootools/mootools-more-1.4.0.1.js"></script>

		<script src="js/websocket.js"></script>
		<script src="js/buffer.js"></script>
		<script src="js/chat.js"></script>
		<script src="js/info.js"></script>
		<script src="js/inventory.js"></script>

		<script src="js/animation/animationManager.js"></script>
		<script src="js/animation/animationStatic.js"></script>
		<script src="js/animation/animationCanvas.js"></script>
		<script src="js/animation/animationAnimated.js"></script>

		<script src="js/observer/observer.js"></script>
		<script src="js/observer/ui.js"></script>

		<script src="js/breed/breed.js"></script>

		<script src="js/entity/entity.js"></script>
		<script src="js/entity/character.js"></script>
		<script src="js/entity/player.js"></script>
		<script src="js/entity/mob.js"></script>
		<script src="js/entity/item.js"></script>
		<script src="js/entity/building.js"></script>
		<script src="js/entity/chest.js"></script>

		<script src="js/client.js"></script>
	</head>
	<body>
	</body>
		<div id="game"></div>
		<script type='text/javascript'>
			var hostname = window.location.hostname,
				port = window.location.port !== '' ? window.location.port : 443

			window.OTRA = window.OTRA || {}
			OTRA.observers = OTRA.observers || {}

			OTRA.client = new Client({
				token: '<?php echo $token; ?>',
				webSocket: 'ws:' + hostname + ':' + port + '/'
			})
		</script>
</html>
