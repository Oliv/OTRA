// clé primaire des monstres
idMonstres = 0;
idCoffres = 0;

initCompesOk = false;
initMonstresOk = false;
initCarteOk = false;
initObjetsOk = false;
initCraftsOk = false;
initBatimentsOk = false;
initGenerateursOk = false;

var idPartie = 0;

// init websocket !
var WebSocketServer = require('websocket').server;
var http = require('http');

// base de données
var db = require("mysql-native").createTCPClient(); // localhost:3306 by default
db.auto_prepare = true;

// garde la connexion a la base de données active
setInterval(function()
	{
	db.query("select 1+1");
	}, 20000);

db.selectFunction = function(requete, fonction, fonctionFin)
	{
	this.query(requete).addListener('row',fonction);
	if (fonctionFin)
		{
		this.query(requete).addListener('end',fonctionFin);
		}
	}

function traite_mysql(cmd,fonction)
	{
	cmd.addListener('row',fonction);
	}

db.auth("otraNew", "root", "00d70c56");
db.execute("update persos set enligne = 0, token = null");

// db.close();

//////////////////// début du bordel :)

var cartes = new Array();

function init_carte(msg)
	{
	if (!initCarteOk && initMonstresOk && initCompesOk && initObjetsOk && initBatimentsOk && initCraftsOk && initGenerateursOk)
		{
		if (idPartie != 0)
			{
			db.selectFunction("select * from cartes where partie = "+idPartie+" order by cle" , function(ligne)
				{
				var pos = parseInt(ligne['position']);
				cartes[pos] = new carte();
				cartes[pos].position = pos;
				cartes[pos].initialiseTxt(ligne['txtMap']);
				if (ligne['generateurs'] != "")
					{
					var gens = ligne['generateurs'].split('::');
					for (var i in gens)
						{
						var tmp = new generateurPot(cartes[pos], gens[i]);
						}
					}
				if (ligne['spawners']!="")
					{
					var spawns = ligne['spawners'].split('::::');
					for (var i in spawns)
						{
						var infos = spawns[i].split("::");
						new spawner(cartes[pos], new coord(10,10), infos[0]);
						// new spawner(cartes[pos], new coord(parseFloat(infos[1]),parseFloat(infos[2])), infos[0]);
						}
					}
				}, function() // fin de traitement des cartes
				{
				for (var i in cartes)
					{
					var index = parseInt(i);
					if (cartes[index+1])
						{
						cartes[index].carteDroite = cartes[index+1];
						}
					if (cartes[index-1])
						{
						cartes[index].carteGauche = cartes[index-1];
						}
					}
					
				db.selectFunction("select * from batiments where partie = "+idPartie+" order by cle" , function(ligne)
					{
					var bat = new batiment();
					bat.load(ligne);
					}, function ()
					{
					});
				
				});
			}
		else
			{
			console.log("Initialisation d'une carte temporaire");
			var nCartes = 101;
			for (var x = 0; x < nCartes; x++)
				{
				txtCarte = x == 0 || x == nCartes-1 ? modeles[0] : modeles[Math.floor(Math.random()*modeles.length)];
				cartes[x] = new carte();
				cartes[x].position = x;
				cartes[x].carteGauche = x > 0 ? cartes[x-1] : false;
				if (x>0)
					{
					cartes[x-1].carteDroite = cartes[x];
					}
				cartes[x].initialiseTxt(txtCarte);
				
				var ratio = Math.min(x/(nCartes/2),(nCartes-x)/(nCartes/2));
				
				typeM = scoresMonstres[Math.floor(ratio*(scoresMonstres.length-1))].id;
				if (x!=0)
					{
					new spawner(cartes[x], new coord(Math.random()*cartes[x].tailleX,Math.random()*cartes[x].tailleY), typeM);
					}
				}
			
			// pour les tests
			new spawner(cartes[0], new coord(10,10), 'poule', 1);
			new spawner(cartes[1], new coord(10,10), 'kingRabbit', 1);
			// initialisation d'une nouvelle partie
			
			var hdv = new batiment();
			hdv.creation('hotelDeVille', cartes[0], 0, 1);
			hdv.construit('bois', 300);
			setTimeout(function(){hdv.save()},1000);

			// var wood = new batiment();
			// wood.creation('bucheron', cartes[0], 5, 1);
			// wood.construit('bois', 280);
			// setTimeout(function(){wood.save()},1000);

			// var iron = new batiment();
			// iron.creation('mine', cartes[0], 20, 1);
			// iron.construit('pierre', 295);
			// setTimeout(function(){iron.save()},1000);
			}
		}
	}

function init_carte_old()
	{
	if (!initCarteOk && initMonstresOk && initCompesOk && initObjetsOk)
		{
		console.log("Initialisation d'une carte temporaire");
		var nCartes = 30;

		txtCarte = modeles[0];
		cartes[0] = new carte();
		cartes[0].position = 0;
		cartes[0].initialiseTxt(txtCarte);
		
		var coffreTest = new coffre(cartes[0], new coord(5,5), 16);
		// new monstre('bee', cartes[0], new coord(Math.random()*cartes[0].tailleX, Math.random()*cartes[0].tailleY));
		new spawner(cartes[0], new coord(10,10), 'poule', 1);
		for (var i = 0 ; i < scoresMonstres.length ; i++)
			{
			// txtCarte = modeles[Math.floor(Math.random()*modeles.length)];
			txtCarte = modeles[i % modeles.length];
			
			cartes[i+1] = new carte();
			cartes[i+1].position = i+1;
			cartes[i+1].initialiseTxt(txtCarte);
			
			for (r = 0; r < 0; r++)
				{
				caseCible = cartes[i+1].cases[Math.round(Math.random()*cartes[i+1].tailleX)][Math.round(Math.random()*cartes[i+1].tailleY)]
				if (caseCible.type != 'eau')
					{
					caseCible.type = 'herbe';
					}
				}
			
			typeM = scoresMonstres[i].id;
			new spawner(cartes[i+1], new coord(Math.random()*cartes[i+1].tailleX,Math.random()*cartes[i+1].tailleY), typeM);
			if (i != 0 && Math.random() < 0.5)
				{
				typeM = scoresMonstres[i-1].id;
				new spawner(cartes[i+1], new coord(Math.random()*cartes[i+1].tailleX,Math.random()*cartes[i+1].tailleY), typeM);
				}
			if (i != scoresMonstres.length-1 && Math.random() < 0.5)
				{
				typeM = scoresMonstres[i+1].id;
				new spawner(cartes[i+1], new coord(Math.random()*cartes[i+1].tailleX,Math.random()*cartes[i+1].tailleY), typeM);
				}
			}

		// a modifier evidemment
		
		/* 
		for(var i=0; i<1; i++)
			{
			new monstre('chat', cartes[0], new coord(Math.random()*cartes[0].tailleX, Math.random()*cartes[0].tailleY));
			}
		*/	
		// new spawner(cartes[1], new coord(10,10), 'hamster', 10);
		// new spawner(cartes[1], new coord(10,10), 'chat', 10);
		// new spawner(cartes[1], new coord(10,10), 'dragonnet', 10);
		}
	}

var competences = {};

function init_competences()
	{
	competences = {};
	db.selectFunction("select * from types_competences", traite_retour_competences, fin_init_competences);
	}
	
function traite_retour_competences(ligne)
	{
	ratios = ligne['caracs'].split('::::');
	for (var i in ratios)
		{
		ratios[i] = ratios[i].split('::');
		ratios[i][1] = parseFloat(ratios[i][1])/100;
		}
	competences[ligne['id']] = {'nom':ligne['nom'], 'ratios':ratios, 'cooldown':ligne['cooldown'], 'chargement':ligne['chargement']};
	}
	
function fin_init_competences()
	{
	console.log("Chargement des competences OK");
	initCompesOk = true;
	init_carte("Chargement des competences OK");
	}

typesMonstres = {};
scoresMonstres = [];

function init_monstres()
	{
	typesMonstres = {};
	db.selectFunction("select * from types_monstres", traite_retour_monstres, fin_init_monstres);
	}
	
function traite_retour_monstres(ligne)
	{
	ratios = ligne['caracs'].split('::::');
	var tiles = ligne['tiles'].split("::");
	var tilesAttaque = ligne['tilesAttaque'].split("::");
	var caracs = ligne['caracs'].split("::");
	var compes = ligne['compes'].split("::::");
	var meute = parseFloat(ligne['meute']);
	var vitesse = parseFloat(ligne['vitesse']);
	var portee = parseFloat(ligne['portee']);
	var tempsMoyenSpawn = parseFloat(ligne['tempsMoyenSpawn']);
	var critique = parseFloat(ligne['critique']);
	var aggro = parseFloat(ligne['aggro']);
	var tailleMeute = ligne['tailleMeute'];
	var typeM = ligne['type'];
	var objCompes = {};
	for (var i in compes)
		{
		var comp = compes[i].split("::");
		objCompes[comp[0]] = comp[1];
		}
	var objLoot = [];
	var loot = ligne['loot'];
	var loots = loot.split('::::');
	for (var i in loots)
		{
		var infos = loots[i].split("::");
		var temp = {};
		temp.pourcentage = infos[0];
		temp.quantite = infos[1];
		temp.typeObjet = infos[2];
		objLoot.push(temp);
		}
	var poopTiles = ligne['poopTiles'].split("::");
	var poopRatio = ligne['poopRatio'] == "" ? 0 : parseFloat(ligne['poopRatio']);
	var poopName = ligne['poopName'];
	var poopMax = parseInt(ligne['poopMax']);
	var objPoopContenu = [];
	var poopContenu = ligne['poopContenu'].split('::::');
	for (var i in poopContenu)
		{
		var infos = poopContenu[i].split("::");
		var temp = {};
		temp.pourcentage = infos[0];
		temp.quantite = infos[1];
		temp.typeObjet = infos[2];
		objPoopContenu.push(temp);
		}
	
	typesMonstres[ligne['id']] = new typeMonstre(ligne['nom'], tiles, tilesAttaque, caracs, objCompes, meute, vitesse, portee, tempsMoyenSpawn, tailleMeute, typeM, critique, aggro, objLoot, poopName, poopTiles, poopRatio, poopMax, objPoopContenu);
	typesMonstres[ligne['id']].difficulte = (caracs[0] + caracs[1] + caracs[2] + caracs[3] + caracs[4]) / 5;
	scoresMonstres.push({'id':ligne['id'], 'obj':typesMonstres[ligne['id']]});
	}
	
function fin_init_monstres()
	{
	scoresMonstres.sort(function(a,b){return a.obj.difficulte - b.obj.difficulte;});
	console.log("Chargement des monstres OK");
	initMonstresOk = true;
	init_carte("Chargement des monstres OK");
	}

typesObjets = {};

function init_objets()
	{
	typesObjets = {};
	db.selectFunction("select * from types_objets", traite_retour_objets, fin_init_objets);
	}
	
function traite_retour_objets(ligne)
	{
	var nom = ligne['nom'];
	var genre = ligne['genre'];
	var tile = ligne['tiles'];
	var tilesActions = ligne['tiles_action'].split("::");
	var mods = ligne['modificateurs'].split("::::");
	var modificateurs = {};
	for (var i in mods)
		{
		tmp = mods[i].split("::");
		modificateurs[tmp[0]] = {'type':tmp[1], 'valeur':tmp[2]};
		}
	typesObjets[ligne['id']] = new typeObjet(nom, genre, tile, tilesActions, modificateurs, ligne['maxStack']);
	}
	
function fin_init_objets()
	{
	console.log("Chargement des objets OK");
	initObjetsOk = true;
	init_carte("Chargement des objets OK");
	}

typesCrafts = {};

function init_crafts()
	{
	typesCrafts = {};
	db.selectFunction("select * from types_crafts", traite_retour_crafts, fin_init_crafts);
	
	for (var i in typesBatiments)
		{
		var bat = typesBatiments[i];
		for (var ressource in bat.chantier)
			{
			var need = {};
			need[ressource] = 1; // nombre de ressources utilisées pour la construction
			new recetteCraft('c_'+ressource+'_'+i,'construction', i, 'construction', need, {});
			new recetteCraft('r_'+ressource+'_'+i,'reparation', i, 'construction', need, {});
			// ajouter ici le "démontage" du batiment
			// comme les recettes de constructions, le demontage n'est pas un craft normal,
			// voir quelle influence a le jet de dé du joueur lors du démontage
			}
		}
	
	// fin_init_crafts();
	}
	
function traite_retour_crafts(ligne)
	{
	// new recetteCraft('potionVie1','potionVie', 'hotelDeVille', 'craftAlchimie', {'oeuf':10}, 
	// 		{
	// 		'pv':{'type' : 'abs', 'base':10,'pas':1, 'max':30},
	// 		'quantite':{'type' : 'abs', 'base':1,'pas':1, 'max':5}
	// 		});
	// new recetteCraft('bois1','bois','hotelDeVille', 'craftBucheron', {}, {'quantite':{'base':1, 'pas':1, 'max':3}});
	// new recetteCraft('bois2','bois','bucheron', 'craftBucheron', {}, {'quantite':{'base':2, 'pas':2, 'max':20}});
	// new recetteCraft('pierre1','pierre','carriere', 'craftCarriere', {}, {'quantite':{'base':2, 'pas':2, 'max':20}});

	var id = ligne['id'];
	var objet = ligne['objet'];
	var batiment = ligne['batiment'];
	var competence = ligne['competence'];
	var ing = ligne['ingredients'].split("::::");
	var ingredients = {};
	for (var i in ing)
		{
		if (ing[i]!="")
			{
			var tmp = ing[i].split("::");
			ingredients[tmp[0]] = parseInt(tmp[1]);
			}
		}
	
	var mod = ligne['modificateurs'].split('::::');
	var modificateurs = {};
	for (var i in mod)
		{
		if (mod[i]!="")
			{
			var tmp = mod[i].split("::");
			modificateurs[tmp[0]] = {'type' : tmp[1], 'base':parseFloat(tmp[2]),'pas':parseFloat(tmp[3]), 'max':parseFloat(tmp[4])};
			}
		}
	
	new recetteCraft(id, objet, batiment, competence, ingredients, modificateurs);
	}
	
function fin_init_crafts()
	{
	console.log("Chargement des crafts OK");
	initCraftsOk = true;
	init_carte("Chargement des crafts OK");
	}

typesBatiments = {};

function init_batiments()
	{
	typesBatiments = {};
	db.selectFunction("select * from types_batiments", traite_retour_batiments, fin_init_batiments);
	
	// typesBatiments['bucheron'] = new typeBatiment("Bucheron", 'bucheron.png', 5, {'bois' : 100});
	// typesBatiments['alchimiste'] = new typeBatiment("Alchimiste", 'alchimiste.png', 4, {'bois' : 300});
	// typesBatiments['carriere'] = new typeBatiment("Carriere", 'carriere.png', 4, {'bois' : 300});
	// typesBatiments['forgeron'] = new typeBatiment("Forgeron", 'forgeron.png', 4, {'bois' : 300});
	// typesBatiments['hotelDeVille'] = new typeBatiment("Hôtel de ville", 'hotelDeVille.png', 5, {'bois' : 300});
	// typesBatiments['laboratoireMagie'] = new typeBatiment("Laboratoire de magie", 'laboratoireMagie.png', 5, {'bois' : 300});
	// typesBatiments['tourdeguet'] = new typeBatiment("Tour de guet", 'tourdeguet.png', 3, {'bois' : 300});
	// typesBatiments['mine'] = new typeBatiment("Mine", 'mine.png', 4, {'bois' : 300 ,'pierre' : 300});
	// typesBatiments['boulangerie'] = new typeBatiment("Boulangerie", 'boulanger.png', 4, {'bois' : 300 ,'pierre' : 300});
	
	// fin_init_batiments();
	}
	
function traite_retour_batiments(ligne)
	{
	var nom = ligne['nom'];
	var tile = ligne['tile'];
	var taille = ligne['taille'];
	var infos = ligne['chantier'].split("::::");
	var chantier = {};
	for (var i in infos)
		{
		var split = infos[i].split("::");
		chantier[split[0]] = split[1];
		}
	typesBatiments[ligne['id']] = new typeBatiment(nom, tile, taille, chantier);
	}
	
function fin_init_batiments()
	{
	console.log("Chargement des batiments OK");
	initBatimentsOk = true;
	init_crafts();
	}

typesGenerateurs = {};

function init_generateurs()
	{
	typesGenerateurs = {};
	db.selectFunction("select * from types_generateurs", traite_retour_generateurs, fin_init_generateurs);
	
	// typesGenerateurs['cactus'] = new typeGenerateur([], ['cactus1.png', 'cactus2.png', 'cactus3.png', 'cactus4.png', 'cactus5.png', 'cactus6.png', 'cactus7.png', 'cactus8.png', 'cactus9.png'], 10, 60000, ['sable']);
	// typesGenerateurs['champi'] = new typeGenerateur([], ['champi1.png', 'champi2.png', 'champi3.png', 'champi4.png', 'champi5.png'], 10, 60000, ['herbe', 'terre', 'pierre']);
	// typesGenerateurs['arbreMort'] = new typeGenerateur([], ['deadTree1.png', 'deadTree2.png', 'deadTree3.png'], 10, 60000, ['terre']);
	// typesGenerateurs['herbeDesert'] = new typeGenerateur([], ['desertGrass1.png', 'desertGrass2.png', 'desertGrass3.png', 'desertGrass4.png'], 10, 60000, ['sable']);
	// typesGenerateurs['herbe'] = new typeGenerateur([], ['grass1.png', 'grass2.png', 'grass3.png', 'grass4.png', 'grass5.png', 'grass6.png', 'grass7.png', 'grass8.png'], 10, 60000, ['herbe']);
	// typesGenerateurs['nenuphar'] = new typeGenerateur([], ['nenuph1.png', 'nenuph2.png', 'nenuph3.png'], 10, 60000, ['eau']);
	// typesGenerateurs['coquillage'] = new typeGenerateur([], ['shell1.png', 'shell10.png', 'shell11.png', 'shell12.png', 'shell13.png', 'shell2.png', 'shell3.png', 'shell4.png', 'shell5.png', 'shell6.png', 'shell7.png', 'shell8.png', 'shell9.png'], 10, 60000, ['sable']);
	
	// fin_init_generateurs();
	}
	
function traite_retour_generateurs(ligne)
	{
	var id = ligne['id'];
	var nom = ligne['nom'];
	var tSpawn = ligne['tSpawn'];
	var nMax = ligne['nMax'];
	var tiles = ligne['tiles'].split("::");
	var casesAuth = ligne['casesAuth'] != "" ? ligne['casesAuth'].split("::") : false;
	var l = ligne['loots'].split("::::");
	var loots = [];
	for (var i in l)
		{
		var tmp = l[i].split("::");
		loots.push({'pourcentage':tmp[0], 'quantite':tmp[1], 'typeObjet':tmp[2]});
		}
	typesGenerateurs[id] = new typeGenerateur(nom, loots, tiles, nMax, tSpawn, casesAuth);
	}
	
function fin_init_generateurs()
	{
	console.log("Chargement des générateurs OK");
	initGenerateursOk = true;
	init_carte("Chargement des générateurs OK");
	}

typesEquipements = 
	{
	'mainD':['1main','2mains'],
	'mainG':['bouclier'],

	'tete':['tete'],
	'corps':['corps'],
	'ceinture':['ceinture'],
	'jambes':['jambes'],
	'chaussures':['pied'],

	'collier':['collier'],
	'bague1':['bague'],
	'bague2':['bague']
	// tete, corps, jambes, pied, consommable, materiaux
	};

// fonctions du système de jeu
function verifHDV()
	{
	var count = {};
	count[1] = 0;
	count[2] = 0;
	for (var c in cartes)
		{
		for (var p in cartes[c].presences)
			{
			if (cartes[c].presences[p].id.substring(0,1)=='b')
				{
				if (cartes[c].presences[p].typeBatiment == 'hotelDeVille')
					{
					count[cartes[c].presences[p].equipe]++;
					}
				}
			}
		}
	if (count[1] == 0)
		{
		db.execute("UPDATE `parties` SET `terminee` = 'oui' WHERE `cle` = "+idPartie);
		db.execute("UPDATE `parties` SET `vainqueur` = '2' WHERE `cle` = "+idPartie);
		messageServeur("L'équipe "+2+" a gagné !");
		setTimeout(function(){stopServer("Fin de la partie")}, 10000);
		}
	if (count[2] == 0)
		{
		db.execute("UPDATE `parties` SET `terminee` = 'oui' WHERE `cle` = "+idPartie);
		db.execute("UPDATE `parties` SET `vainqueur` = '1' WHERE `cle` = "+idPartie);
		messageServeur("L'équipe "+1+" a gagné !");
		setTimeout(function(){stopServer("Fin de la partie")}, 10000);
		}
	}

function messageServeur(message)
	{
	for (var c in cartes)
		{
		for (var p in cartes[c].presencesJoueurs)
			{
			cartes[c].presencesJoueurs[p].informePlayer("messageServeur", message);
			}
		}
	}

// classes génériques de fonctionnement

// message de communication avec les clients
var message = function (objet,action,parametres) // communication entre le client et le serveur
	{
	// {objet} fait {action} avec {parametres}
	this.objet = objet;
	this.action = action;
	this.parametres = parametres;
	
	this.envoi = function(socket)
		{
		this.valeur = 
			{
			'objet':this.objet,
			'action':this.action,
			'parametres':this.parametres
			}
			
		socket.sendUTF(JSON.stringify(this.valeur));
		
		}
	}

// fauxwebsocket => pour les PNJ et monstres
var leurreWS = function()
	{
	this.sendUTF = function()
		{
		return true;
		}
	}

fakeWS = new leurreWS();

// coordonnées
var coord = function (x,y)
	{
	// objet coordonnees
	this.x = x;
	this.y = y;
	
	this.dist = function (coord)
		{
		return Math.sqrt (Math.pow(coord.x - this.x, 2) + Math.pow(coord.y - this.y, 2) );
		}
	
	this.coordRatio = function (cible, ratio)
		{
		x = this.x + (cible.x - this.x)*ratio;
		y = this.y + (cible.y - this.y)*ratio;
		retour = new coord(x,y);
		return retour;
		}
	
	this.clone = function ()
		{
		return new coord(this.x, this.y);
		}
	}

// case de cartes => type, ralentissement elements mobiles
var caseCarte = function()
	{
	// represente une case de la carte
	// fond
	// chaque case de la carte a un type de fond : portail, pierre, sable, terre, falaise, herbe, cailloux, ocean
	// le type ne sert qu'a l'affichage et a definir si les cases sont actives ou non (falaise ne peut pas etre accessible et ocean seulement en bateau)
	// permet aussi desavoir si les terrains sont constructibles
	
	// contenu
	// chaque case peut avoir un objet ou plusieurs presences
	this.presencesJoueurs = new Array(); // liste des joueurs présents sur la case
	this.presences = new Array(); // liste des mobiles presents sur la case
	this.objetpresent = false; // Objet présent sur la case (empeche de passer)
	
	this.batiment = false;
	
	this.type = false;
	
	this.arrive = function(obj)
		{
		// l'objet arrive sur la case
		if (obj.socket)
			{
			this.presencesJoueurs.push(obj);
			}
		this.presences.push(obj);
		}
		
	this.quitte = function(obj)
		{
		// l'objet quitte la case
		return false;
		if (obj.socket)
			{
			for (id in this.presencesJoueurs)
				{
				if (obj.id == this.presencesJoueurs[id].id)
					{
					this.presencesJoueurs.splice(id,1); // pas testé
					}
				}
			for (id in this.presences)
				{
				if (obj.id == this.presences[id].id)
					{
					this.presences.splice(id,1); // pas testé
					}
				}
			}
		}
	
	this.veutTraverser = function(obj)
		{
		if (obj.typeTerrain == "terre")
			{
			if (this.type == 'falaise' || this.type == 'ocean' || this.type == 'vide')
				{
				return 0;
				}
			else if (this.type == 'eau')
				{
				return 0.5;
				}
			else
				{
				return 1;
				}
			}
		else if (obj.typeTerrain == "eau")
			{
			if (this.type == 'falaise' || this.type == 'ocean' || this.type == 'vide')
				{
				return 0;
				}
			else if (this.type == 'eau')
				{
				return 1;
				}
			else
				{
				return 0;
				}
			}
		else if (obj.typeTerrain == "air")
			{
			if (this.type == 'vide')
				{
				return 0;
				}
			else 
				{
				return 1;
				}
			}
		// renvoie la valeur par défaut de la taille du pas de déplacement si la case est de type traversable et si aucun objet n'est posé dessus.
		// sinon apelle recoisAction de obj avec un score défini par la difficulté
		// renvoie la valeur du pas (plus faible) si le deplacement est validé, sinon 0 : l'objet s'arrete.
		}
	}

caseVide = new caseCarte();
caseVide.type = 'vide';

// cartes du monde
var carte = function()
	{
	this.position = false;
	
	this.carteGauche = false;
	this.carteDroite = false;
	// chaque case est un objet
	// il faut associer toutes les coordonnées connues aux objets lors de l'initialisation

	this.cases = new Array();
	this.casesBatiments = new Array();
	this.tailleX = 0;
	this.tailleY = 0;
	
	this.presences = [];
	this.presencesJoueurs = [];
	this.coffres = [];
	
	this.initialiseTxt = function(texte)
		{
		this.tailleX = 0;
		this.tailleY = 0;
		var types = {
			'e' : "eau",
			'p' : "pierre",
			's' : "sable",
			't' : "terre",
			'h' : "herbe",
			'g' : "gravier",
			'n' : "neige",
			'i' : "glace",
			'a' : "sapins",
			// oliv : boue foret jungle marais sapins
			'f' : "falaise",
			'o' : "ocean",
			'v' : "vide"
			}
		
		lignes = texte.split('#');
		for (y = 0; y < lignes.length; y++)
			{
			var lettres = lignes[y].split("");
			this.tailleY = Math.max(this.tailleY, y-1);
			if (y == 0)
				{
				for (x = 0; x < lettres.length; x++)
					{
					this.casesBatiments[x] = this.casesBatiments[x] ? this.casesBatiments[x] : new Array();
					this.casesBatiments[x] = new caseCarte();
					this.casesBatiments[x].type = types[lettres[x]];
					this.tailleX = Math.max(this.tailleX, x);
					}
				}
			else
				{
				for (x = 0; x < lettres.length; x++)
					{
					this.cases[x] = this.cases[x] ? this.cases[x] : new Array();
					this.cases[x][y-1] = new caseCarte();
					this.cases[x][y-1].type = types[lettres[x]];
					this.tailleX = Math.max(this.tailleX, x);
					}
				}
			}
		}
	
	this.ajoutePresence = function(obj)
		{
		this.presences.push(obj);
		if (obj.id.substr(0,1) == "j")
			{
			this.presencesJoueurs.push(obj);
			}
		}
	
	this.enlevePresence = function(obj)
		{
		for (id in this.presences)
			{
			if (obj.id == this.presences[id].id)
				{
				this.presences.splice(id,1); // pas testé
				}
			}
		if (obj.id.substr(0,1) == "j")
			{
			for (id in this.presencesJoueurs)
				{
				if (obj.id == this.presencesJoueurs[id].id)
					{
					this.presencesJoueurs.splice(id,1); // pas testé
					}
				}
			}
		}
	
	this.ajouteBatiment = function(obj)
		{
		for (var x = obj.position; x<obj.position+obj.taille; x++)
			{
			this.cases[x][0].batiment = obj;
			this.casesBatiments[x].batiment = obj;
			}
		}
	
	this.enleveBatiment = function(obj)
		{
		for (var x = 0; x < this.tailleX; x++)
			{
			if (this.cases[x][0].batiment && this.cases[x][0].batiment.id == obj.id)
				{
				this.cases[x][0].batiment = false;
				}
			if (this.casesBatiments[x].batiment && this.casesBatiments[x].batiment.id == obj.id)
				{
				this.casesBatiments[x].batiment = false;
				}
			}
		}
	
	this.batimentsPossibles = function(position)
		{
		var retour = [];
		for (var i in typesBatiments)
			{
			var valide = true;
			for (var p = 0; p < typesBatiments[i].taille; p++)
				{
				if (!this.casesBatiments[position+p]) {valide = false;}
				else if (this.casesBatiments[position+p].batiment !== false) {valide = false;}
				else if (this.casesBatiments[position+p].type == 'eau') {valide = false;}
				}
			if (valide)
				{
				retour.push(i);
				}
			}
		return retour;
		}
	}

// elements présents sur les cartes
elementsJeu = {};

// elements mobiles : monstres / PNJ / joueurs
var mobile = function ()
	{
	// tout ce qui peut bouger
	
	// --------------------- infos générales ---------------------
	this.id = false;
	this.mysql = {};
	
	this.estKO = false;
	
	this.next = false; // action a effectuer a la fin de l'action en cours
	
	this.traite_message = function (mess)
		{
		if (this.estKO)
			{
			return false;
			}
		if (mess.action == 'deplace') 
			{
			if (this.coffre !== false) {this.coffre.fermeCoffre();}
			this.annuleAction();
			this.stoppeDeplace();
			this.lacheObjet();
			if (mess.parametres.x !== false && mess.parametres.y !== false)
				{
				this.deplace(new coord(parseFloat(mess.parametres.x),parseFloat(mess.parametres.y)));
				}
			}
		else if (mess.action == 'parle') 
			{
			var texte = String(mess.parametres);
			texte = texte.replace(/<[^>]*>/g,"");
			if (texte == 'utilise')
				{
				this.traite_message(new message(this.id, 'utilise', {'nomInventaire':'inventaire', 'emplacement':0}) );
				}
			if (texte == 'poubelle')
				{
				this.traite_message(new message(this.id, 'actionInventaire', {'nomInventaire':'poubelle', 'emplacement':0}) );
				}
			if (texte == 'testBatiment')
				{
				this.traite_message(new message(this.id, 'construction', {'position':5}) );
				}
			if (texte == 'testBatiment!')
				{
				if (this.carte.casesBatiments[5].batiment)
					{
					this.carte.casesBatiments[5].batiment.enleve();
					}
				this.traite_message(new message(this.id, 'construction', {'position':5, 'typeBatiment':'bucheron'}) );
				}
			if (texte == 'changeEquipe')
				{
				this.equipe = this.equipe == 1 ? 2 : 1;
				}
			this.informe('parle',texte);
			}
		else if (mess.action == 'attaque')
			{
			if (this.coffre !== false) {this.coffre.fermeCoffre();}
			cible = mess.parametres;
			this.lacheObjet();
			if (this.actionEnCours == this.statsCalc['compeAttaque'])
				{
				this.clicAddStress();
				}
			else if (!elementsJeu[cible])
				{
				console.log("Element "+cible+" Introuvable");
				}
			else 
				{
				if (elementsJeu[cible].equipe != this.equipe || (elementsJeu[cible].pvp && this.pvp))
					{
					this.prepareAttaque(elementsJeu[cible]);
					}
				}
			}
		else if (mess.action == 'actionInventaire')
			{
			if (mess.parametres.nomInventaire == 'inventaire' || mess.parametres.nomInventaire == 'equipement' || mess.parametres.nomInventaire == 'coffre' || mess.parametres.nomInventaire == 'poubelle' )
				{
				if (this[mess.parametres.nomInventaire] && this[mess.parametres.nomInventaire].contenu[mess.parametres.emplacement] !== undefined)
					{
					this.actionInventaire(mess.parametres.nomInventaire, mess.parametres.emplacement);
					}
				}
			}
		else if (mess.action == 'utilise')
			{
			if (mess.parametres.nomInventaire == 'inventaire' || mess.parametres.nomInventaire == 'equipement' || mess.parametres.nomInventaire == 'coffre')
				{
				if (this[mess.parametres.nomInventaire] && this[mess.parametres.nomInventaire].contenu[mess.parametres.emplacement] !== undefined && this[mess.parametres.nomInventaire].contenu[mess.parametres.emplacement])
					{
					this.utilise(mess.parametres.nomInventaire, mess.parametres.emplacement);
					}
				}
			}
		else if (mess.action == 'coffre')
			{
			cible = mess.parametres;
			if (!elementsJeu[cible])
				{
				console.log("Element Introuvable");
				}
			else
				{
				cible = elementsJeu[cible];
				dist = this.position.dist(cible.position);
				
				if (dist > 1.5)
					{
					this.cleanTimerAction();
					this.next = new message(this.id,'coffre',cible.id);
					this.deplace(this.position.coordRatio(cible.position, 0.5));
					}
				else
					{
					elementsJeu[mess.parametres].ouvreCoffre(this);
					}
				}
			}
		else if (mess.action == 'craft')
			{
			this.prepareCraft(mess.parametres);
			}
		else if (mess.action == 'construction')
			{
			position = mess.parametres.position ? parseInt(mess.parametres.position) : 0;
			if (mess.parametres.typeBatiment)
				{
				if (this.carte.batimentsPossibles(position).indexOf(mess.parametres.typeBatiment)!== -1)
					{
					var bat = new batiment();
					bat.creation(mess.parametres.typeBatiment, this.carte, position, this.equipe);
					}
				}
			else
				{
				var retour = [];
				var listeBatiment = this.carte.batimentsPossibles(position);
				for (var i in listeBatiment)
					{
					var composants = {};
					var bat = listeBatiment[i]
					retour.push(
						{
						'typeBatiment' : bat,
						'nom' : typesBatiments[bat].nom,
						'tile' : typesBatiments[bat].tiles,
						'taille' : typesBatiments[bat].taille,
						'composants' : typesBatiments[bat].chantier
						});
					}
				this.informePlayer('listeBatiments', {'liste':retour, 'position':position});
				}
			}
		}
	
	// --------------------- Mort / Spawn --------------------
	
	this.spawn = function()
		{
		this.estKO = false;
		this.majStats();
		this.pv = this.statsCalc['pvMax'];
		if (this.carte) {this.quitteCarte();}
		if (this.equipe == 2)
			{
			var carte = cartes[cartes.length-1];
			// var carte = this.carte !== false ? this.carte : cartes[cartes.length-1];
			this.arriveCarte(carte, new coord(cartes[cartes.length-1].tailleX-1.5,1.5));
			}
		else
			{
			var carte = cartes[0];
			// var carte = this.carte !== false ? this.carte : cartes[0];
			this.arriveCarte(carte, new coord(1.5,1.5));
			}
		this.envoiCrafts();
		}
	
	// --------------------- Affichage --------------------
	
	this.tile = false;
	
	// --------------------- Déplacements --------------------
	this.carte = false; // carte utilisée par le personnage
	
	this.position = false; // position du personnage
	this.coordCase = false;
	this.destination = false; // destination du personnage (quand en mouvement)
	this.taillePas = 0.2;
	this.modificateurVitesse = 1;
	
	this.timerDeplacement = false; // setInterval pour les deplacements
	
	this.actif = false;
	
	this.quitteCase = function()
		{
		if (this.carte)
			{
			this.carte.cases[Math.floor(this.position.x)][Math.floor(this.position.y)].quitte(this);
			}
		}

	this.quitteCarte = function()
		{
		this.stoppeDeplace();
		this.quitteCase();
		this.informe("quitteCarte");
		this.carte.enlevePresence(this);
		}
	
	this.arriveCarte = function(carte, position)
		{
		if (this.carte)
			{
			this.quitteCarte();
			}
		this.carte = carte;
		this.carte.ajoutePresence(this);
		this.position = position;
		this.carte.cases[Math.floor(position.x)][Math.floor(position.y)].arrive(this);
		this.infosCarte();
		this.informe("arriveCarte", this.infosClient());
		this.estArrive(position);
		this.envoiStats();
		this.save();
		// this.coordCase = new coord(Math.floor(position.x),Math.floor(position.y));
		// this.carte.cases[this.coordCase.x][this.coordCase.y].arrive(this);
		}
	
	this.avance = function()
		{
		var deltaX = this.destination.x - this.position.x;
		var deltaY = this.destination.y - this.position.y;
		var delta = Math.sqrt((deltaX*deltaX) + (deltaY*deltaY));
		
		var caseX = Math.floor(this.position.x);
		var caseY = Math.floor(this.position.y);
		
		taillePas = this.taillePas*this.modificateurVitesse;
		estArrive = taillePas >= delta; 
		
		var nouvellePos = !estArrive ? new coord(this.position.x+(deltaX * taillePas / delta), this.position.y+(deltaY * taillePas / delta)) : this.destination;
		
		var nCaseX = Math.floor(nouvellePos.x);
		var nCaseY = Math.floor(nouvellePos.y);
		
		var batimentOld = this.batimentAPortee();
		
		if (nCaseX != caseX || nCaseY != caseY)
			{
			if (nCaseX != caseX || nCaseY != caseY)
				{
				// l'utilisateur est passé par une diagonale...
				}
			if (this.carte && this.carte.cases[nCaseX] && this.carte.cases[nCaseX][nCaseY])
				{
				// collision avec les cases
				modificateur = this.carte.cases[nCaseX][nCaseY].veutTraverser(this);
				if (modificateur == 0 )
					{
					this.estArrive(this.position);
					}
				else
					{
					if (nCaseX == 0 && this.carte.carteGauche)
						{
						this.carte.cases[caseX][caseY].quitte(this);
						this.arriveCarte(this.carte.carteGauche, new coord(this.carte.carteGauche.tailleX-1.5,nouvellePos.y));
						// l'utilisateur se deplace d'une carte vers la gauche.
						}
					else if (nCaseX == this.carte.tailleX && this.carte.carteDroite)
						{
						this.carte.cases[caseX][caseY].quitte(this);
						this.arriveCarte(this.carte.carteDroite, new coord(1.5,nouvellePos.y));
						// l'utilisateur se déplace d'une carte vers la droite.
						}
					else
						{
						// this.taillePas = taillePas;
						if (estArrive)
							{
							this.estArrive();
							}
						else
							{
							this.carte.cases[caseX][caseY].quitte(this);
							this.carte.cases[nCaseX][nCaseY].arrive(this);
							this.coordCase = new coord(nCaseX, nCaseY);
							this.position = nouvellePos;
							var timer = (1000 / this.statsCalc['vitesse']) * this.taillePas;
							var obj = this;
							this.timerDeplacement = setTimeout(function (){obj.avance();}, timer);
							}
						}
					
					if (this.modificateurVitesse != modificateur)
						{
						this.informe('aDestination',{'destination':this.position});
						this.informe('deplace',{'destination':this.destination,'vitesse':this.statsCalc['vitesse']*modificateur});
						this.modificateurVitesse = modificateur;
						}
					}
				}
			else
				{
				this.estArrive(this.position);
				}
			}
		else
			{
			if (estArrive)
				{
				this.estArrive();
				}
			else
				{
				this.position = nouvellePos;
				var timer = (1000 / this.statsCalc['vitesse']) * this.taillePas;
				var obj = this;
				this.timerDeplacement = setTimeout(function (){obj.avance();}, timer); 
				}
			}
		
		var batimentAct = this.batimentAPortee();
		
		var cleOldBatiment = batimentOld ? batimentOld.id : '';
		var cleActBatiment = batimentAct ? batimentAct.id : '';
		
		if (cleOldBatiment != cleActBatiment)
			{
			this.envoiCrafts();
			}
		
		// avance l'objet d'un pas vers sa destination
		// le pas doit etre inferieur ou égal a la taille des cases de la grille collision pour eviter qu'un objet puisse passer par dessus la case
		// si un changement de case est fait lors du pas, il faut enlever l'objet de l'ancienne case et le rajouter dans la nouvelle
		// si la destination est a moins d'un pas de l'objet, fin du déplacement :  
		//    this.est_arrive();
		}
	
	this.deplace = function(dest)
		{
		this.actif = true;
		this.destination = dest;
		this.avance();
		if (false && !this.timerDeplacement)
			{
			// lance le setInterval timerDeplacement : la fonction avance est lancée tout les X ms ou X est calculé en fonction de la vitesse du personnage
			var obj = this;
			this.timerDeplacement = setInterval(function(){obj.avance()}, timer); // 250 a changer en fonction de la vitesse
			}
		this.informe('aDestination',{'destination':this.position});
		this.informe('deplace',{'destination':dest,'vitesse':this.statsCalc['vitesse']*this.modificateurVitesse});
		}
	
	this.stoppeDeplace = function()
		{
		clearTimeout(this.timerDeplacement);
		this.timerDeplacement = false;
		}
	
	this.estArrive = function(dest)
		{
		this.actif = false;
		// téléporte l'objet a la destination
		// on quitte la case en cours et arrive sur la case demandée
		// on stoppe le timerDeplacement et supprime la destination
		// indique aux personnes de la zone que l'objet est arrivé
		
		// choix de la destination
		dest = dest ? dest : this.destination;
		
		// suppression du deplacement en cours
		this.stoppeDeplace();
		
		// quitte la case en cours
		var caseX = Math.floor(this.position.x);
		var caseY = Math.floor(this.position.y);
		// sole.log(this.id);
		this.carte.cases[caseX][caseY].quitte(this);
		
		// deplace l'element
		this.position = dest;
		
		// arrive sur la case en cours
		var nCaseX = Math.floor(dest.x);
		var nCaseY = Math.floor(dest.y);
		this.carte.cases[nCaseX][nCaseY].arrive(this);
		this.coordCase = new coord(nCaseX, nCaseY);
		
		// met a jour la position de l'element chez les joueurs
		this.informe('aDestination',{'destination':dest});
		this.informe('stoppeDeplacement',{'destination':dest});
		
		this.actionTerminee();
		}
		
	// --------------------------- Caracs, competences et stats ------------------------
	
	for (var i in competences)
		{
		this.statsInit[i] = 10;
		}
	
	this.initStats = function()
		{
		if (!this.coolDown) {this.coolDown = {};}
		if (!this.chargements) {this.chargements = {};}
		if (!this.statsInit) {this.statsInit = {};}
		if (!this.statsCalc) {this.statsCalc = {};}
		}
	
	this.majStats = function()
		{
		// caracs
		this.statsCalc['force'] = parseInt(this.statsInit['force']);
		this.statsCalc['constitution'] = parseInt(this.statsInit['constitution']);
		this.statsCalc['agilite'] = parseInt(this.statsInit['agilite']);
		this.statsCalc['intelligence'] = parseInt(this.statsInit['intelligence']);
		this.statsCalc['charisme'] = parseInt(this.statsInit['charisme']);
		// comptes
		
		this.statsCalc['pvMax'] = 0;
		
		for (var i in competences)
			{
			this.statsCalc[i] = this.statsInit[i];
			this.statsInit['coolDown'+i] = competences[i].cooldown;
			this.statsInit['chargement'+i] = competences[i].chargement;
			this.statsCalc['coolDown'+i] = competences[i].cooldown;
			this.statsCalc['chargement'+i] = competences[i].chargement;
			this.coolDown[i] = {'valeurInit':competences[i].cooldown, 'valeurCalc':competences[i].cooldown, 'running':false};
			this.chargements[i] = {'valeurInit':competences[i].chargement, 'valeurCalc':competences[i].chargement};
			}

		// stats
		this.statsCalc['portee'] = this.statsInit['portee'];
		this.statsInit['degats'] = 0;
		this.statsCalc['degats'] = this.statsInit['degats'];
		this.statsCalc['vitesse'] = this.statsInit['vitesse'];
		this.statsCalc['seuilCritique'] = this.statsInit['seuilCritique'];
		this.statsCalc['compeAttaque'] = "attMainsNues";
		this.statsCalc['compeDefense'] = "esquive";
		
		this.statsCalc['tilesAttaque'] = this.statsInit['tilesAttaque'];
		
		// this.statcCalc['coolDown'+compe] !!!!
		
		this.calculeEquipement();
		
		this.statsCalc['pvMax'] += Math.floor(this.statsCalc['constitution']);
		
		this.envoiStats();
		
		}
	
	this.jetDeCritique = function ()
		{
		var score = Math.ceil(Math.random()*100);
		var seuilCritique = this.statsCalc['seuilCritique'];
		return score <= seuilCritique;
		}
	
	this.jetDe = function(max)
		{
		niveau = Math.floor(max/10);
		// a changer en conftion du stress => plus le stress est élevé, moins le score final est nivelé
		if (this.stress>0.5) // mode stress
			{
			return Math.ceil(Math.random() * niveau);
			}
		else if (false && this.pv == this.statsCalc['pvMax']) // mode refait a voir quand le mettre
			{
			return Math.ceil(Math.max(Math.random(),Math.random()) * niveau);
			}
		else // mode normal
			{
			return Math.ceil(((Math.random()+Math.random()+Math.random())/3) * niveau);
			}
		}
	
	this.jetDeCompe = function(compe)
		{
		score = this.jetDe(this.statsCalc[compe]);
		var temp = score;
		caracs = competences[compe];
		console.log(this.id+" "+compe+" "+score);
		for (var i in caracs.ratios)
			{
			score += Math.round(this.jetDeCarac(caracs.ratios[i][0]) * caracs.ratios[i][1]);
			}
		this.activeCoolDown(compe);
		return score;
		}
	
	this.jetDeCarac = function(carac)
		{
		score = this.jetDe(this.statsCalc[carac]);
		if (score == Math.floor(this.statsCalc[carac]/10) )
			{
			this.statsInit[carac]++;
			
			this.majStats();
			this.informePlayer("gagnePoint",{"stat":carac, 'valeur':1});
			this.save();
			this.envoiStats();
			// ajout d'un point de carac !
			}
		return score;
		}
	
	this.jetCompeNiveau = function(compe, score)
		{
		score = Math.round(score);
		jet = Math.ceil(Math.random()*Math.abs(score));
		if (jet == score)
			{
			this.statsInit[compe]++;
			this.informePlayer("gagnePoint",{"stat":compe, 'valeur':1});
			this.majStats();
			this.save();
			}
		}
	
	this.envoiStats = function()
		{
		var parametres = {};
		parametres.statsInit = {};
		parametres.statsCalc = {};
		
		for (var i in this.statsCalc)
			{
			if (i.substring(0,10) != 'chargement' && i.substring(0,8) != 'coolDown')
				{
				var label = competences[i] ? competences[i]['nom'] : i;
 				parametres.statsCalc[label] = this.statsCalc[i];
				}
			}
		
		this.informe('stats', parametres);
		}
	
	// --------------------------- Actions ------------------------
	
	this.timerCompetences = new Array(); // cooldown des actions, tableau associatif
	this.timerAction = false; // temps de l'action en cours.
	this.actionEnCours = false;

	this.desactiveCoolDown = function(compe)
		{
		this.coolDown[compe].running = false;
		this.informePlayer('coolDownOff', {'compe':compe});
		}
	
	this.activeCoolDown = function(compe)
		{
		if (this.statsCalc['coolDown'+compe])
			{
			var obj = this;
			var compe = compe;
			this.coolDown[compe].running = true;
			setTimeout(function(){obj.desactiveCoolDown(compe);}, this.statsCalc['coolDown'+compe]);
			this.informePlayer('coolDownOn', {'compe':compe, 'ms':this.statsCalc['coolDown'+compe]});
			}
		}

	this.verifCoolDown = function(compe)
		{
		
		return !this.coolDown[compe].running;
		}
	
	this.chargeAction = function (compe, fonction)
		{
		if (this.statsCalc['chargement'+compe] == 0)
			{
			fonction();
			}
		else
			{
			this.informe('debutChargement', {'compe':compe, 'ms':this.statsCalc['chargement'+compe]});
			var obj = this;
			this.actionEnCours = compe;
			this.timerAction = setTimeout(function () {obj.informe('finChargement', compe); obj.cleanTimerAction();fonction();obj.actionTerminee()}, this.statsCalc['chargement'+compe]);
			}
		}
	
	this.annuleAction = function()
		{
		if (this.timerAction)
			{
			this.informe('annuleAction');
			this.cleanTimerAction();
			}
		}
	
	this.cleanTimerAction = function()
		{
		clearTimeout(this.timerAction);
		this.timerAction = false;
		this.actionEnCours = false;
		}
	
	this.actionTerminee = function ()
		{
		if (this.next)
			{
			var message = this.next;
			this.next = false;
			this.traite_message(message);
			}
		}
	
	// --------------------------- Combat ------------------------
	
	this.aggro = false; // tableau des aggros pour les monstres
	this.aggroFail = false; // tableau des aggros pour les monstres
	
	this.blesse = function (score, critique)
		{
		this.pv = this.pv - score;
		this.informe("blesse", {"score": score, "critique": critique, 'pv' : this.pv, 'pvMax' : this.statsCalc['pvMax']});
		
		if (this.pv <= 0)
			{
			
			this.estMort();
			}
		}
	
	this.soigne = function (score, critique)
		{
		critique = critique ? critique : false;
		this.pv = Math.min(this.pv + score, this.statsCalc['pvMax']);
		this.informe("soigne", {"score": score, "critique": critique, 'pv' : this.pv, 'pvMax' : this.statsCalc['pvMax']});
		}
	
	this.attaque = function (cible)
		{
		tile = this.statsCalc.tilesAttaque[Math.floor(Math.random()*this.statsCalc.tilesAttaque.length)];
		this.informe('attaque', {'cible':cible.id, 'tile':tile});
		jet = this.jetDeCompe(this.statsCalc['compeAttaque']);
		
		scoreFinal = cible.defense(jet, this.statsCalc['degats']);
		if (this.jetDeCritique())
			{
			scoreFinal = scoreFinal <= 0 ? 1 : 2*scoreFinal;
			}
		if (scoreFinal > 0)
			{
			cible.blesse(scoreFinal+this.statsCalc['degats']);
			}
		else
			{
			cible.informe(cible.statsCalc['compeDefense'], scoreFinal);
			this.majAggroFail(cible);
			}
		if (cible.id.substring(0,1)!="b")
			{
			cible.majAggro(this, scoreFinal);
			cible.anime(true);
			}
		this.jetCompeNiveau(this.statsCalc['compeAttaque'], scoreFinal);
		}
	
	this.defense = function(scoreAttaque)
		{
		scoreDefense = this.jetDeCompe(this.statsCalc['compeDefense']);
		delta = scoreAttaque - scoreDefense;
		this.jetCompeNiveau(this.statsCalc['compeDefense'], delta);
		return delta;
		}
	
	this.prepareAttaque = function (cible)
		{
		if (this.timerAction !== false)
			{
			this.clicAddStress();
			return false;
			}
		if (!cible || !cible.carte || cible.carte.position != this.carte.position)
			{
			return false;
			}
		if (cible.id == this.id)
			{
			return false;
			}
		
		if (cible.id.substring(0,1)=='b') // batiment
			{
			var positionCible = new coord(cible.position+(cible.taille/2), 0);
			}
		else
			{
			var positionCible = cible.position;
			}
		dist = this.position.dist(positionCible);
		if (dist > this.statsCalc['portee'])
			{
			this.cleanTimerAction();
			this.next = new message(this.id,'attaque',cible.id);
			// this.deplace(this.position.coordRatio(cible.position, 1-((0.95*this.statsCalc['portee'])/dist)));
			this.deplace(this.position.coordRatio(positionCible, 0.45));
			}
		else
			{
			if (this.verifCoolDown(this.statsCalc['compeAttaque']) && (!this.actionEnCours || this.actionEnCours != this.statsCalc['compeAttaque']))
				{
				this.cleanTimerAction();
				var obj = this;
				var objCible = cible;
				this.chargeAction(this.statsCalc['compeAttaque'], function (){obj.attaque(objCible);});
				}
			else
				{
				this.clicAddStress();
				}
			}
		}
	
	this.majAggro = function (attaquant, scoreFinal)
		{
		if (attaquant)
			{
			if (!this.appelMeute)
				{
				this.attaqueMeute(attaquant.id);
				}
			if (!this.aggro) {this.aggro = {};}
			if (!this.aggro[attaquant.id]) {this.aggro[attaquant.id] = 0;}
			this.aggro[attaquant.id] += scoreFinal > 1 ? scoreFinal : 1;
			}
		}
	
	this.majAggroFail = function(cible)
		{
		if (!this.aggroFail) {this.aggroFail = {};}
		if (!this.aggroFail[cible.id]) {this.aggroFail[cible.id] = 0;}
		this.aggroFail[cible.id] += 1;
		
		if (this.aggroFail[cible.id] >= 7)
			{
			this.aggro[cible.id] = 0;
			this.aggroFail[cible.id] = 0;
			}
		
		}
	
	this.calcAggro = function ()
		{
		max = 0;
		cible = false;
		
		for (var id in this.aggro)
			{
			if (this.aggro[id] > max)
				{
				max = this.aggro[id];
				cible = id;
				}
			}
		
		if (!cible)
			{
			return false;
			}
		else if (elementsJeu[cible] && elementsJeu[cible].carte && elementsJeu[cible].carte.position == this.carte.position)
			{
			return cible;
			}
		else
			{
			delete(this.aggro[cible]);
			return this.calcAggro();
			}
		}
		
	// -------------------------- Interactions clients ------------------------
	this.informe = function(action, parametres)
		{
		// regarde s'il y a des joueurs a portee, si oui :
		parametres = parametres ? parametres : false;
		if (action && this.carte && this.carte.presencesJoueurs.length > 0)
			{
			var mess = new message(this.id, action, parametres);
			for(var cle in this.carte.presencesJoueurs)
				{
				mess.envoi(this.carte.presencesJoueurs[cle].socket);
				}
			}
		// crée un message avec l'identifiant de l'objet, l'action et les parametres
		// envoie ce message a tout les joueurs a portee
		}
	
	this.informeAll = function(action, parametres)
		{
		// PAS BON DU TOUUUUUUT
		parametres = parametres ? parametres : false;
		if (action && this.carte && this.carte.presencesJoueurs.length > 0)
			{
			var mess = new message(this.id, action, parametres);
			for(var c in cartes)
				{
				for(var cle in cartes[c].presencesJoueurs)
					{
					mess.envoi(cartes[c].presencesJoueurs[cle].socket);
					}
				}
			}
		}
	
	this.infosCarte = function ()
		{
		// la fonction renvoie les informations des cases presentes entre coordonnees.debut et coordonnees.fin si ces cases sont présentes dans la vue de l'utilisateur
		var retour = {"layers":{},  "bgtop":[], "bg":[], "presences":[]};
		var ordre = ['sable', 'terre', 'herbe', 'pierre', 'eau', 'vide'];
		
		for (var i in ordre)
			{
			retour.layers[ordre[i]] = [];
			}
		
		for (var x = 0; x <= this.carte.tailleX; x++)
			{
			for (var y = 0; y <= this.carte.tailleY; y++)
				{
				testCase = this.carte.cases[x] && this.carte.cases[x][y] ? this.carte.cases[x][y] : caseVide;
				retour.bg.push({'x':x, 'y':y, 'type' : testCase.type});
				retour.layers[testCase.type].push({'x':x, 'y':y});
				}
			}
		
		for (var x = 0; x <= this.carte.tailleX; x++)
			{
			testCase = this.carte.casesBatiments[x] && this.carte.casesBatiments[x] ? this.carte.casesBatiments[x] : caseVide;
			retour.bgtop.push({'x':x, 'type' : testCase.type});
			
			retour.layers[testCase.type].push({'x':x, 'y':-1});
			}
		
		
		for (var p in this.carte.presences)
			{
			var pres = this.carte.presences[p];
			retour.presences.push(pres.infosClient());
			}
			
		var mess = new message(this.id, 'infosCarte', retour);
		mess.envoi(this.socket);
		}
	
	this.deconnecte = function()
		{
		this.carte.cases[this.coordCase.x][this.coordCase.y].quitte(this);
		this.quitteCarte();
		if (this.coffre) {this.coffre.fermeCoffre();}
		delete(elementsJeu[this.id]);
		}
	
	this.infosClient = function()
		{
		var autorun = this.typeTerrain == 'air'; 
			
		envoi = {'id':this.id, 'parametres' : {'nom':this.nom, 'equipe':this.equipe, 'x': this.position.x, 'y': this.position.y, 'tile':this.tile, 'pv':this.pv, 'pvMax':this.statsCalc['pvMax'], 'autorun':autorun}};
		
		return envoi;
		}
	
	// -------------------------- inventaire et equipement ------------------------
	
	this.calculeEquipement = function()
		{
		for (var e in this.equipement.contenu)
			{
			var obj = this.equipement.contenu[e];
			if (obj !== false)
				{
				modificateurs = this.equipement.contenu[e].modificateurs;
				for (var i in modificateurs)
					{
					if (modificateurs[i].type == 'prop')
						{
						this.statsCalc[i] = modificateurs[i].valeur;
						}
					else if (modificateurs[i].type == 'abs')
						{
						this.statsCalc[i] += parseFloat(modificateurs[i].valeur);
						}
					else if (modificateurs[i].type == 'ratio')
						{
						this.statsCalc[i] += parseFloat(modificateurs[i].valeur) * this.statsInit[i];
						}
					}
				}
			}
		if (this.equipement.mainD && this.equipement.mainD != false)
			{
			this.statsCalc['tilesAttaque'] = this.equipement.mainD.type.tiles;
			}
		else
			{
			this.statsCalc['tilesAttaque'] = this.statsInit['tilesAttaque'];
			}
		}
	
	this.initInventaire = function(taille)
		{
		this.inventaire = {};
		this.equipement = {};
		this.equipement.contenu = 
			{
			'mainD':false,
			'mainG':false,
			'tete':false,
			'corps':false,
			'jambes':false,
			'ceinture':false,
			'chaussures':false,
			'collier':false,
			'bague1':false,
			'bague2':false,
			'bague3':false,
			'bague4':false
			};
		
		this.poubelle = {};
		this.coffre = false;
		this.poubelle.contenu = {0:false};
		this.inventaire.contenu = {};
		for (var i = 0; i < taille; i++) {this.inventaire.contenu[i] = false;}
		}
	
	this.batimentAPortee = function()
		{
		if (this.carte.cases[Math.floor(this.position.x)][Math.floor(this.position.y)].batiment && this.carte.cases[Math.floor(this.position.x)][Math.floor(this.position.y)].batiment.actif)
			{
			return this.carte.cases[Math.floor(this.position.x)][Math.floor(this.position.y)].batiment;
			}
		else
			{
			return false;
			}
		}
	
	this.stress = 0;
	
	this.updateStress = function(score)
		{
		// met a jour le score de stress du joueur
		var score = score ? score : 0.01;
		this.stress += score;
		this.stress = this.stress > 1 ? 1 : this.stress;
		this.stress = this.stress < 0 ? 0 : this.stress;
		}
	
	this.calmeStress = function()
		{
		if (this.destination.x == this.position.x && this.destination.y == this.position.y)
			{
			this.updateStress(-0.02);
			}
		else
			{
			this.updateStress(-0.01);
			}
		}
	
	this.clicAddStress = function()
		{
		this.updateStress(0.01);
		}
	
	}

var joueur = function ()
	{
	this.typeTerrain = "terre";
	
	this.equipe = 1;
	this.pvp = false;
	
	var obj = this;
	this.timerStress = setInterval(function(){obj.calmeStress();}, 2000);
	
	this.informePlayer = function(action, parametres)
		{
		// regarde s'il y a des joueurs a portee, si oui : 
		parametres = parametres ? parametres : false;
		var mess = new message(this.id, action, parametres); 		
		mess.envoi(this.socket);
		}
	
	// -------------------------- basde de données ------------------------
	this.save = function()
		{
		toSave = {};
		toSave['force'] = this.statsInit['force'];
		toSave['constitution'] = this.statsInit['constitution'];
		toSave['agilite'] = this.statsInit['agilite'];
		toSave['intelligence'] = this.statsInit['intelligence'];
		toSave['charisme'] = this.statsInit['charisme'];
		
		var compes = {}
		
		for (var c in competences)
			{
			compes[c] = this.statsInit[c];
			}
			
		toSave['competences'] = JSON.stringify(compes);
		
		var save = {};
		save.equipement = {};
		save.inventaire = {};
		for (var i in this.equipement.contenu)
			{
			if (this.equipement.contenu[i])
				{save.equipement[i] = this.equipement.contenu[i].objToJSON();}
			}
		for (var i in this.inventaire.contenu)
			{
			if (this.inventaire.contenu[i])
				{save.inventaire[i] = this.inventaire.contenu[i].objToJSON();}
			}
		
		toSave['inventaire'] = JSON.stringify(save).replace("'","''");
		
		var update = [];
		for (var u in toSave)
			{
			update.push("`"+u+"` = '"+toSave[u]+"'");
			}
		
		update = update.join(',');
		db.query("UPDATE `otraNew`.`persos` SET "+update+" WHERE `persos`.`cle` ="+this.id.substring(1)+";");
		}

	// -------------------------- inventaire et equipement ------------------------
	this.equipeObj = function (obj, emplacement)
		{
		valid = false;
		for(var i in typesEquipements[emplacement])
			{
			valid = valid || typesEquipements[emplacement][i] == obj.type.genre;
			}
		if (valid)
			{
			if (obj.type.genre == '2mains')
				{
				if (this.desequipeObj('mainG') && this.desequipeObj('mainD'))
					{
					obj.changeProprietaire(this, 'equipement', 'mainD');
					this.equipement[emplacement] = obj;
					this.majStats();
					}
				}
			else
				{
				if (this.desequipeObj(emplacement))
					{
					obj.changeProprietaire(this, 'equipement', emplacement);
					this.equipement[emplacement] = obj;
					this.majStats();
					}
				}
			}
		}
	
	this.desequipeObj = function (emplacement)
		{
		if (this.equipement.contenu[emplacement] != false)
			{
			if (this.ajoutInventaire(this.equipement.contenu[emplacement]))
				{
				this.equipement.contenu[emplacement] = false;
				this.majStats();
				this.ajoutInventaire(this.equipement.contenu[emplacement]);
				return true;
				}
			else
				{
				return false;
				}
			}
		else
			{
			return true;
			}
		}
	
	this.envoiInventaire = function ()
		{
		var envoi = {};
		
		envoi.objetEnMain = this.objetEnMain ? this.objetEnMain.inventaireClient() : false;
		envoi.equipement = {};
		envoi.inventaire = {};
		envoi.coffre = false;
		envoi.poubelle = this.poubelle.contenu[0] ? {0:this.poubelle.contenu[0].inventaireClient()} : false;
		
		for (var e in this.equipement.contenu)
			{
			if (this.equipement.contenu[e] != false)
				{
				envoi.equipement[e] = this.equipement.contenu[e].inventaireClient();
				}
			else
				{
				envoi.equipement[e] = false;
				}
			}
		
		for (var e in this.inventaire.contenu)
			{
			if (this.inventaire.contenu[e] != false)
				{
				
				envoi.inventaire[e] = this.inventaire.contenu[e].inventaireClient();
				}
			else
				{
				envoi.inventaire[e] = false;
				}
			}
		
		if (this.coffre)
			{
			envoi.coffre = {};
			for (var e in this.coffre.contenu)
				{
				if (this.coffre.contenu[e] != false)
					{
					envoi.coffre[e] = this.coffre.contenu[e].inventaireClient();
					}
				else
					{
					envoi.coffre[e] = false;
					}
				}
			}
		
		this.informePlayer('inventaire', envoi);
		}
	
	this.ajoutInventaire = function (obj)
		{
		pose = false;
		for (var i = this.tailleInventaireMax-1; i>=0; i--)
			{
			if (!pose && this.inventaire.contenu[i] == false)
				{
				pose = true;
				obj.changeProprietaire(this, 'inventaire', i);
				}
			}
		return pose;
		}
		
	this.actionInventaire = function(nomInventaire, emplacement)
		{
		var enMain = this.objetEnMain ? this.objetEnMain : false;
		var dansCase = this[nomInventaire].contenu[emplacement] ? this[nomInventaire].contenu[emplacement] : false;
		
		if (nomInventaire == 'equipement')
			{
			if (enMain)
				{
				// voir ici pour les armes a deux mains
				if (typesEquipements[emplacement].indexOf(enMain.type.genre) != -1 )
					{
					if (enMain.type.genre == '2mains' && this.equipement.contenu.mainG != false)
						{
						// doit d'abord enlever son bouclier !
						}
					else
						{
						this.objetEnMain = dansCase;
						this[nomInventaire].contenu[emplacement] = enMain;
						}
					}
				}
			else
				{
				this.objetEnMain = dansCase;
				this[nomInventaire].contenu[emplacement] = enMain;
				}
			}
		else if (nomInventaire == 'poubelle')
			{
			if (enMain)
				{
				this[nomInventaire].contenu[0] = enMain;
				this.objetEnMain = false;
				}
			else
				{
				this.objetEnMain = this[nomInventaire].contenu[0];
				this[nomInventaire].contenu[0] = false;
				}
			}
		else
			{
			if (enMain && dansCase)
				{
				
				}
			if (enMain && dansCase && enMain.stackString() == dansCase.stackString() && enMain.type.maxStack > 1)
				{
				if (enMain.quantite + dansCase.quantite <= enMain.type.maxStack)
					{
					dansCase.quantite = enMain.quantite + dansCase.quantite;
					enMain = false;
					}
				else
					{
					var diff = enMain.quantite + dansCase.quantite - enMain.type.maxStack;
					enMain.quantite = diff;
					dansCase.quantite = dansCase.type.maxStack;
					}
				this.objetEnMain = enMain;
				this[nomInventaire].contenu[emplacement] = dansCase;
				}
			else
				{
				this.objetEnMain = dansCase;
				this[nomInventaire].contenu[emplacement] = enMain;
				}
			}
		
		this.save();
		this.majStats();
		this.envoiInventaire();
		}
	
	this.autoStack = function (objet, deuxiemeTour)
		{
		if (!objet) { return false;}
		for (var i in this.inventaire.contenu)
			{
			if (!this.inventaire.contenu[i] && deuxiemeTour) // case vide !
				{
				this.inventaire.contenu[i] = objet;
				return true;
				}
			else if (this.inventaire.contenu[i] && this.inventaire.contenu[i].stackString() == objet.stackString())
				{
				if (this.inventaire.contenu[i].quantite + objet.quantite <= this.inventaire.contenu[i].type.maxStack)
					{
					this.inventaire.contenu[i].quantite += objet.quantite;
					return true;
					}
				else
					{
					objet.quantite -= this.inventaire.contenu[i].type.maxStack - this.inventaire.contenu[i].quantite;
					this.inventaire.contenu[i].quantite = this.inventaire.contenu[i].type.maxStack;
					}
				}
			}
		if (deuxiemeTour)
			{
			return false;
			}
		else
			{
			return this.autoStack(objet,true);
			}
		}
	
	this.lacheObjet = function ()
		{
		// fonction a lancer si l'utilisateur fait une autre action qu'une action d'inventaire,
		// la fonction doit prendre lce que l'utilisateur a dans la main et le ranger dans l'inventaire.
		// a ajouter dans traite_message
		if (this.objetEnMain)
			{
			this.autoStack(this.objetEnMain);
			this.objetEnMain = false;
			this.envoiInventaire();
			}
		}
	
	this.estMort = function()
		{
		this.annuleAction();
		this.informe('estMort');
		var obj = this;
		this.stoppeDeplace();
		this.estArrive(this.position);
		this.arriveCarte(purgatoires[this.equipe], new coord(3.5, 4.5));
		this.majStats();
		this.pv = this.statsCalc['pvMax'];
		var obj = this;
		this.TimerSpawn = setTimeout(function(){obj.spawn();}, 10000);
		this.informePlayer('coolDownOn', {'compe':'respawn', 'ms':10000});

		// this.carte = purgatoires[this.equipe]; // ici mettre la carte du batiment de spawn (hosto ou batiment init)
		// this.spawn();
		// this.timerSpawn = setTimeout(function(){obj.spawn();}, 5000);
		}
	
	this.anime = function()
		{
		return false;
		}
	
	this.attaqueMeute = function (cible)	
		{
		return false;
		}
	
	this.utilise = function (nomInventaire, emplacement)
		{
		if (this[nomInventaire].contenu[emplacement].type.genre == 'materiel')
			{
			for (var i in this[nomInventaire].contenu[emplacement].modificateurs)
				{
				var mod = this[nomInventaire].contenu[emplacement].modificateurs[i];
				if (i == 'pv')
					{
					var score = mod.type=='ratio' ? mod.valeur*this.statsCalc['pvMax'] : mod.valeur;
					this.soigne(parseFloat(score));
					}
				// c'est ici que ca se passe garcon !
				}
			this[nomInventaire].contenu[emplacement].quantite -= 1;
			if (this[nomInventaire].contenu[emplacement].quantite == 0)
				{
				this[nomInventaire].contenu[emplacement] = false;
				}
			this.envoiInventaire();
			this.save();
			}
		}
	
	this.craftConsomme = function(typeCraft)
		{
		var need = {};
		for (var i in typesCrafts[typeCraft].composants)
			{
			need[i]=typesCrafts[typeCraft].composants[i];
			}
		for (var i in this.inventaire.contenu)
			{
			if (this.inventaire.contenu[i] && need[this.inventaire.contenu[i].typeObjet])
				{
				if (this.inventaire.contenu[i].quantite <= need[this.inventaire.contenu[i].typeObjet])
					{
					need[this.inventaire.contenu[i].typeObjet] -= this.inventaire.contenu[i].quantite;
					this.inventaire.contenu[i] = false;
					}
				else
					{
					this.inventaire.contenu[i].quantite -= need[this.inventaire.contenu[i].typeObjet];
					need[this.inventaire.contenu[i].typeObjet] = 0;
					}
				}
			}
		}

	this.nombreCraftsPossibles = function(typeCraft)
		{
		var need = {};
		for (var i in typesCrafts[typeCraft].composants)
			{
			need[i]=[typesCrafts[typeCraft].composants[i], 0];
			}
		for (var i in this.inventaire.contenu)
			{
			if (this.inventaire.contenu[i] && need[this.inventaire.contenu[i].typeObjet])
				{
				need[this.inventaire.contenu[i].typeObjet][1] += this.inventaire.contenu[i].quantite;
				}
			}
		max = false;
		for (var i in need)
			{
			max = max !== false ? Math.min(max, Math.floor(need[i][1]/need[i][0])) : Math.floor(need[i][1]/need[i][0]);
			}
		return max !== false ? max : -1;
		}
	
	this.craftPossible = function(typeCraft)
		{
		if (!typesCrafts[typeCraft]) {return false; } // craft n'existe pas
		var bat = this.batimentAPortee();
		if (!bat) {return false;}
		if (!bat)
		if (bat.type.crafts.indexOf(typeCraft) == -1) {return false;} // batiment necessaire hors de portée
		
		// vérification si ressources ok
		var nPossible = this.nombreCraftsPossibles(typeCraft);
		if (nPossible === false || nPossible == 0) {return false;} // pas assez de composants
		return true;
		}
	
	this.craft = function(typeCraft)
		{
		// process de craft : 
		// craft demandé présent dans craftsPossibles
		if (!this.craftPossible(typeCraft))
			{
			this.envoiCrafts();
			return false;
			}
		
		// debut du craft
		
		// suppression des ressources
		this.craftConsomme(typeCraft);
		
		var score = this.jetDeCompe(typesCrafts[typeCraft].competence);
		
		this.jetCompeNiveau(typesCrafts[typeCraft].competence, score);
		
		score = Math.round(score / 4);
		
		
		if (typesCrafts[typeCraft].competence == 'construction')
			{
			var batimentAPortee = this.batimentAPortee();
			var ressource = false;
			for (var i in typesCrafts[typeCraft].composants) {ressource = i;}

			var mess = new message(this.id, 'craft', {'recette':typeCraft});
			var obj = this;

			if (typeCraft.substring(0,2) == 'c_')
				{
				batimentAPortee.construit(ressource, Math.floor(score));
				if (!batimentAPortee.chantierFini(ressource))
					{
					this.next = mess;
					// setTimeout(function(){obj.traite_message(mess);},100);
					}
				else
					{
					this.envoiCrafts();
					}
				}
			else if (typeCraft.substring(0,2) == 'r_')
				{
				batimentAPortee.repare(ressource, Math.floor(score));
				if (batimentAPortee.estEndommage(ressource))
					{
					this.next = mess;
					// setTimeout(function(){obj.traite_message(mess);},100);
					}
				else
					{
					this.envoiCrafts();
					}
				}
			this.envoiInventaire();
			// renvoyer la meme construction si le batiment n'est pas fini !
			return true;
			}
		
		// ici, on modifie les stats et la quantité en fonction des bonus du craft
		ratios = [0,1];
		var nModificateurs = 0;
		for (var i in typesCrafts[typeCraft].modificateurs) {nModificateurs++;}
		
		for (var i = 0; i < nModificateurs-1; i++)
			{
			ratios.push(Math.random());
			}
		ratios.sort();
		
		modificateurs = {};
		n = 0;
		quantite = 1;
		for (var i in typesCrafts[typeCraft].modificateurs)
			{
			ratio = ratios[n+1] - ratios[n];
			var scoreMod = ratio * score;
			valeurModificateur = typesCrafts[typeCraft].modificateurs[i].base;
			for (var j = 0; j < Math.round(scoreMod); j++)
				{
				valeurModificateur += valeurModificateur == typesCrafts[typeCraft].modificateurs[i].max ? 0 : typesCrafts[typeCraft].modificateurs[i].pas;
				}
			n++;
			if (i == 'quantite')
				{
				quantite = valeurModificateur;
				}
			else
				{
				modificateurs[i] = {'type':typesCrafts[typeCraft].modificateurs[i].type, 'valeur':valeurModificateur};
				}
			}
		
		var craft = new objet();
		craft.creation(typesCrafts[typeCraft].typeObjet, modificateurs);
		craft.quantite = quantite;
		
		// this.objetEnMain = craft;
		this.autoStack(craft);
		
		this.envoiInventaire();
		
		// nom: 'Bois',
		// tile: 'bois.png',
		// modificateurs: { '': { type: undefined, valeur: undefined } } }
		
		
		// creation de l'objet
		}
	
	this.prepareCraft = function (params)
		{
		typeCraft = params.recette ? params.recette : false;
		if (this.timerAction !== false)
			{
			this.clicAddStress();
			return false;
			}
		if (!this.craftPossible(typeCraft))
			{
			return false;
			}
		if (this.verifCoolDown(typesCrafts[typeCraft].competence) && (!this.actionEnCours || this.actionEnCours != typesCrafts[typeCraft].competence))
			{
			this.cleanTimerAction();
			var obj = this;
			var typeC = typeCraft;
			this.chargeAction(typesCrafts[typeCraft].competence, function (){obj.craft(typeC);});
			}
		}
	
	this.envoiCrafts = function() 
		{
		var batimentAPortee = this.batimentAPortee();
		var retour = {};
		if (batimentAPortee && batimentAPortee.equipe == this.equipe) // batiment construit
			{
			construit = batimentAPortee.chantierFini();
			estEndommage = batimentAPortee.estEndommage();
			var ressource = false;
			for (var i in batimentAPortee.type.crafts)
				{
				var cleCraft = batimentAPortee.type.crafts[i];
				var valide = false;
				if (!construit)
					{
					valide = cleCraft.substring(0,2) == 'c_';
					if (valide)
						{
						for (var i in typesCrafts[cleCraft].composants)
							{ressource = i;}
						valide = !batimentAPortee.chantierFini(ressource);
						}
					}
				else if (estEndommage)
					{
					valide = cleCraft.substring(0,2) != 'c_'; 
					if (valide)
						{
						for (var i in typesCrafts[cleCraft].composants)
							{ressource = i;}
						valide = batimentAPortee.estEndommage(ressource);
						}
					}
				else
					{
					valide = cleCraft.substring(0,2) != 'c_' && cleCraft.substring(0,2) != 'r_';
					}
				
				if (valide)
					{
					retour[cleCraft] = {};
					retour[cleCraft]['typeObjet'] = typesObjets[typesCrafts[cleCraft].typeObjet].nom;
					// retour[cleCraft]['typeObjet'] = typesCrafts[cleCraft].typeObjet;
					retour[cleCraft]['tile'] = typesObjets[typesCrafts[cleCraft].typeObjet].tile;
					retour[cleCraft]['possible'] = this.craftPossible(cleCraft);
					retour[cleCraft]['composants'] = {};
					for (var j in typesCrafts[cleCraft].composants)
						{
						retour[cleCraft]['composants'][j] = {};
						retour[cleCraft]['composants'][j].quantite = typesCrafts[cleCraft].composants[j];
						retour[cleCraft]['composants'][j].tile = typesObjets[j].tile;
						}
					}
				}
			}
		this.informePlayer('crafts', retour);
		}
	}

joueur.prototype = new mobile();
// monstres
var typeMonstre = function(nom, tiles, tilesAttaque, caracs, compes, meute, vitesse, portee, tempsSpawn, tailleMeute, typeM, seuilCritique, aggro, loot, poopName, poopTiles, poopRatio, poopMax, poopContenu)
	{
	this.nom = nom;
	this.caracs = caracs;
	this.tiles = tiles;
	this.tilesAttaque = tilesAttaque;
	this.compes = compes;
	this.meute = meute;
	this.vitesse = vitesse;
	this.portee = portee;
	this.tempsSpawn = tempsSpawn;
	this.typeTerrain = typeM;
	var taille = tailleMeute.split('::');
	this.tailleMeuteMin = parseFloat(taille[0]);
	this.tailleMeuteMax = parseFloat(taille[1]);
	this.seuilCritique = seuilCritique;
	this.seuilAggro = aggro;
	this.loot = loot;

	this.poopName = poopName;
	this.poopTiles = poopTiles;
	this.poopRatio = poopRatio;
	this.poopMax = poopMax;
	this.poopContenu = poopContenu;
	}

var monstre = function(typeMonstre, carte, position)
	{
	this.spawner = false;
	// les monstres ne sont pas stockés en BDD
	
	this.equipe = 0;
	this.pvp = true;
	
	this.nombrePots = 0;
	
	this.attaqueMeute = function (cible)
		{
		if (this.spawner && this.spawner.monstres.length > 0)
			{
			for (var i = 0; i < this.spawner.monstres.length; i++)
				{
				if (this.spawner.monstres[i].id != this.id && Math.random() < this.type.meute)
					{
					this.spawner.monstres[i].appelMeute = true;
					this.spawner.monstres[i].majAggro(elementsJeu[cible], 1);
					this.spawner.monstres[i].anime();
					}
				}
			}
		}
	
	this.anime = function(force)
		{
		// typeMonstre : identifiant d'un objet de la base de données
		// peut y avoir plusieurs images differentes pour un seul type de mob, a la creation, l'image est tirée aleatoirement et tout les clients ont la meme (le serveur envoie l'url de l'image utilisée)
		if (this.pv <= 0)
			{
			this.stoppeAnime();
			return false;
			}
		if (this.carte.presencesJoueurs.length == 0 && !force) {return false;}
		if (!this.actif || (force && this.actif))
			{
			if (this.actif)
				{
				this.estArrive(this.position);
				}
			// soit attaque des joueurs ou autres pnj, soit deplacement, etc...
			var aggro = this.calcAggro();
			if (aggro)
				{
				if (!this.modeAttaque)
					{
					this.modeAttaque = true;
					this.stoppeAnime();
					var obj = this;
					this.timerAnime = setInterval(function(){obj.anime();},1000);
					
					if (!this.appelMeute) // mode meute a activer suivant le type de monstre
						{
						this.attaqueMeute(cible);
						}
					this.appelMeute = false;
					}
				this.next = new message(this.id,'anime');
				this.prepareAttaque(elementsJeu[aggro]);
				}
			else
				{
				if (this.modeAttaque)
					{
					this.modeAttaque = false;
					this.stoppeAnime();
					var obj = this;
					this.timerAnime = setInterval(function(){obj.anime();},10000);
					}
				var score = Math.random();
				
				if (score <= this.type.poopRatio && this.nombrePots < this.type.poopMax)
					{
					var cleLoot = 0;
					var contenuTemp = [];
					// ne pas creer le coffre si aucun contenu
					for (var i in this.type.poopContenu)
						{
						loot = this.type.poopContenu[i];
						
						if (Math.random()*100 < loot.pourcentage)
							{
							contenuTemp[cleLoot] = new objet();
							contenuTemp[cleLoot].creation(loot.typeObjet);
							contenuTemp[cleLoot].quantite = Math.ceil(Math.random()*loot.quantite);
							cleLoot++;
							}
						}
					this.nombrePots++;
					var position = this.position.clone();
					position.y -= 0.01;
					var poop = new pot(this.carte, position, this.type.poopName, contenuTemp, this.type.poopTiles[Math.floor(this.type.poopTiles.length * Math.random())]);
					poop.spawner = this;
					}
				if (this.carte.presencesJoueurs.length > 0 && score < this.seuilAggro) 
					{
					cible = false
					while(!cible)
						{
						cible = this.carte.presencesJoueurs[Math.floor(Math.random()*this.carte.presencesJoueurs.length)];
						cible = cible.id != this.id ? cible.id : false;
						}
					this.majAggro(elementsJeu[cible], 1);
					
					this.anime();
					}				
				else if (score < 0.3 || force)
					{
					// if (this.type.nom == 'poule')
					// 	{
					// 	this.informe('parle',"cot cot");
					// 	}
					this.deplace(new coord(1+Math.random()*(this.carte.tailleX-1), 1+Math.random()*(this.carte.tailleY-1)));
					}
				
				}
			}
		}
	
	this.stoppeAnime = function ()
		{
		clearTimeout(this.timerAnime);
		this.timerAnime	= false;
		}
	
	this.informePlayer = function(action, parametres)
		{
		return true;
		}
	
	this.save = function()
		{
		return true;
		}
	
	this.timerSpawn = false;
	
	this.estMort = function()
		{
		this.annuleAction();
		var cleLoot = 0;
		var contenuTemp = [];
		// ne pas creer le coffre si aucun contenu
		for (var i in this.type.loot)
			{
			loot = this.type.loot[i];
			
			if (Math.random()*100 < loot.pourcentage)
				{
				contenuTemp[cleLoot] = new objet();
				contenuTemp[cleLoot].creation(loot.typeObjet);
				contenuTemp[cleLoot].quantite = Math.ceil(Math.random()*loot.quantite);
				cleLoot++;
				}
			}
		
		if (cleLoot>0)
			{
			var cadavre = new coffre(this.carte, this.position.clone(), 8, 'tombstone.png', 40);
			for (var i in contenuTemp)
				{
				cadavre.contenu[i] = contenuTemp[i];
				}
			}
		
		
		this.informe('estMort');
		this.stoppeAnime();
		this.quitteCarte();
		this.estKO = true;
		if (this.spawner)
			{
			this.spawner.nMonstres--;
			for (var i = this.spawner.monstres.length-1; i >= 0;  i--)
				{
				if (this.spawner.monstres[i].id == this.id)
					{
					this.spawner.monstres.splice(i,1);
					}
				}
			}
		delete(elementsJeu[this.id]);
		}
	
	this.lacheObjet = function () {}
	
	this.envoiCrafts = function() {}
	if (typeMonstre)
		{
		this.id = 'm'+idMonstres;
		idMonstres++;
		elementsJeu[this.id] = this;
		
		this.taillePas = 0.5;
		
		this.initInventaire();
		this.initStats();
		
		this.modeAttaque = false;
		
		this.socket = fakeWS;
		this.type = typesMonstres[typeMonstre];
		this.nom = this.type.nom;
		
		
		this.typeTerrain = this.type.typeTerrain;
		this.seuilAggro = this.type.seuilAggro;
		
		this.statsInit['force'] = this.type.caracs[0];
		this.statsInit['constitution'] = this.type.caracs[1];
		this.statsInit['agilite'] = this.type.caracs[2];
		this.statsInit['intelligence'] = this.type.caracs[3];
		this.statsInit['charisme'] = this.type.caracs[4];

		this.statsInit['vitesse'] = this.type.vitesse-0.5+(Math.random());
		this.statsInit['portee'] = this.type.portee;
		this.statsInit['seuilCritique'] = this.type.seuilCritique;

		this.statsInit['tilesAttaque'] = this.type.tilesAttaque;

		for (var i in this.type.compes)
			{
			this.statsInit[i] = this.type.compes[i];
			}
			
		this.majStats();
		this.pv = this.statsCalc['pvMax'];
		
		this.tile = this.type.tiles[Math.floor(Math.random()*this.type.tiles.length)];
		
		// ici, le monstre est créé
		this.arriveCarte(carte, position);
		
		var obj = this;
		this.timerAnime = setInterval(function(){obj.anime();},10000);
		}
	}

monstre.prototype = new mobile();

var typeObjet = function(nom, genre, tile, tilesActions, modificateurs, maxStack)
	{
	this.nom = nom;
	this.genre = genre; // genres : 1main, 2mains, tete, corps, jambes, pied, consommable, materiaux, 
	this.tile = tile;
	this.tilesActions = tilesActions;
	this.modificateurs = modificateurs;
	this.maxStack = maxStack;
	}

var objet = function()
	{
	this.mod2string = function ()
		{
		var retour = "";
		for (var cle in this.modificateurs)
			{
			retour += retour == "" ? "" : "::::";
			retour += cle+"::"+this.modificateurs[cle].type+"::"+this.modificateurs[cle].valeur;
			}
		return retour;
		}
	
	this.objToJSON = function()
		{
		var obj = {};
		obj.nom = this.nom;
		obj.tile = this.tile;
		obj.typeObjet = this.typeObjet;
		obj.modificateurs = this.modificateurs;
		obj.quantite = this.quantite;
		return obj;
		}
	
	this.JSONToObj = function(obj)
		{
		this.nom = obj.nom;
		this.typeObjet = obj.typeObjet;
		this.modificateurs = obj.modificateurs;
		this.quantite = obj.quantite;
		this.type = typesObjets[this.typeObjet];
		this.tile = obj.tile;
		}
	
	this.creation = function(typeObjet, modificateurs, proprietaire, nomInventaire, emplacement)
		{
		this.typeObjet = typeObjet;
		this.type = typesObjets[typeObjet];
		this.proprietaire = false; // soit un joueur, soit une carte, soit un coffre
		this.position = false; // coordonnées sur la carte si l'objet est au sol
		
		
		this.nom = this.type.nom;
		
		this.tile = this.type.tile; // s[ Math.floor(Math.random()*this.type.tiles.length) ];
		
		this.modificateurs = this.type.modificateurs;
		var modificateursSpeciaux = modificateurs ? modificateurs : false;
		for (var i in modificateursSpeciaux)
			{
			this.modificateurs[i] = modificateursSpeciaux[i];
			}
		
		if (proprietaire)
			{
			this.changeProprietaire(proprietaire, nomInventaire, emplacement);
			}
		}
		
	this.changeProprietaire = function(proprietaire, nomInventaire, emplacement)
		{
		if (this.proprietaire)
			{
			this.proprietaire[this.nomInventaire].contenu[this.emplacement] = false;
			}
		this.proprietaire = proprietaire;
		this.nomInventaire = nomInventaire;
		this.emplacement = emplacement;
		
		this.proprietaire[this.nomInventaire].contenu[this.emplacement] = this;
		this.proprietaire.majStats();
		this.proprietaire.envoiInventaire();
		}
	
	this.inventaireClient = function()
		{
		retour = {};
		retour.nom = this.nom;
		retour.tile = this.tile;
		retour.quantite = this.quantite;
		retour.modificateurs = this.modificateurs;
		return retour;
		}
		
	this.stackString = function()
		{
		retour = "";
		retour += this.typeObjet;
		for (var i in this.modificateurs)
			{
			retour += "_"+i+"-"+this.modificateurs[i].valeur;
			}
		retour += "_";
		return retour;
		}
	
	// this.id = false;
	this.proprietaire = false;
	this.nomInventaire = false;
	this.emplacement = false;
	
	this.quantite = 1;
		// exemples de modificateurs !
		// this.modificateurs['attaquecc'] = {'type':'ratio', 'val':5}; // pourcentage :  statsCalc += (5/100)*statsInit;
		// this.modificateurs['force'] = {'type':'abs', 'val':10}; // valeur absolue :  statsCalc += 10;
		// this.modificateurs['compeAttaque'] = {'type':'prop', 'val':'attaquecc'}; // propriete : statsCalc = attaquecc
	//
	}

var obstacle = function ()
	{
	// tous les objets fixes qui interragissent sur la grille de collision
	
	// la hitbox d'un obstacle par défaut est de 1case x 1case
	// il faut pouvoir modifier cette hitbox avec une matrice
	// chaque case de la matrice a une valeur a 0, 1 ou 2 :
	// 0 : l'objet n'est pas sur cette case
	// 1 : l'objet est sur cette case
	// 2 : le centre de l'objet est cette case (et l'objet est sur cette case)
	// 3 : le centre de l'objet est sur cette case mais l'objet n'est pas dessus (mouais....)
	
	// il doit pouvoir etre possible de tourner l'objet de 90, 180 ou -90 degres
	
	this.casesOccupees = new Array();
	this.coordonnees = false;
	this.type = false;
	
	this.actionsRecevables = new Array(); // Liste des actions qui peuvent etre recues par l'objet
	
	this.hitbox = [[2]];
	
	this.sens = 0 // (ou 1, 2, 3 suivant le sens de l'objet)
	
	// chaque obstacle doit renvoyer la nouvelle valeur du pas qui sera calculée en fonction de l'objet qui souhaite la traverser.
	// par exemple une barriere peut etre traversée si le joueur saute assez haut, une case eau peut etre traversée a condition de nager assez bien
	// chaque case doit aussi avoir un niveau de difficulté parametrable (hauteur de la cloture, courant de riviere, difficulté escalade mur);
	
	this.veutPasser = function (obj)
		{ return 0; }
	
	this.pose = function(coordonnes)
		{
		// pose l'objet aux coordonnées demandée
		}
	
	}

var coffre = function (carte, position, taille, tile, expire)
	{
	this.nom = "Coffre";
	this.tile = tile ? tile : "chest.png";
	
	if (taille)
		{
		this.contenu = {};
		for (var i = 0; i < taille; i++) {this.contenu[i] = false;}
		}
		
	this.utilisateur = false;
	this.expire = expire ? expire : false;
	
	this.timerEnd = false;
	
	this.carte = carte;
	this.position = position;
	
	this.init = function()
		{
		toSave = {};
		toSave['partie'] = idPartie;
		toSave['carte'] = this.carte.position;
		toSave['positionX'] = this.position.x;
		toSave['positionY'] = this.position.y;
		
		var update = [];
		for (var u in toSave)
			{
			update.push("`"+u+"` = '"+toSave[u]+"'");
			}
		
		update = update.join(',');
		var obj = this;
		db.query("INSERT INTO `otraNew`.`coffres` (`partie` ,`carte` ,`positionX` ,`positionY`)VALUES ('"+idPartie+"',  '"+this.carte.position+"', '"+this.position.x+"', '"+this.position.y+"');").addListener('result', function(result)
			{
			this.id = "c"+idCoffres;
			idCoffres++;
			obj.idBdd = result.insert_id;
			elementsJeu[obj.id] = obj;
			obj.pose(carte, position);
			obj.informe("arriveCarte", obj.infosClient());
			});
		}
	
	this.testDelete = function()
		{
		if (this.utilisateur)
			{
			var obj = this;
			this.timerEnd = setTimeout(function(){obj.testDelete();},4000);
			}
		else
			{
			this.enleve();
			}
		}
	
	this.ouvreCoffre = function(user)
		{
		if (!this.utilisateur)
			{
			this.utilisateur = user;
			this.utilisateur.coffre = this;
			this.utilisateur.envoiInventaire();
			}
		else
			{
			return false;
			}
		}
	
	this.fermeCoffre = function()
		{
		if (this.utilisateur)
			{
			this.utilisateur.coffre = false;
			this.utilisateur.envoiInventaire();
			this.utilisateur = false;
			}
		this.save();
		}
	
	this.pose = function(carte, position)
		{
		elementsJeu[this.id] = this;
		this.carte = carte;
		this.position = position.clone();
		this.carte.ajoutePresence(this);
		}
	
	this.enleve = function(obj)
		{
		this.fermeCoffre();
		this.carte.enlevePresence(this);
		this.informe("quitteCarte");
		// suppression de la BDD a faire
		delete(elementsJeu[this.id]);
		}
	
	this.infosClient = function()
		{
		envoi = {'nom':this.nom, 'id':this.id, 'parametres' : {'x': this.position.x, 'y': this.position.y, 'tile':this.tile}};
		
		return envoi;
		}
	
	this.save = function()
		{
		if (!this.expire)
			{
			toSave = {};
			
			var contenu = {};
			for (var i in this.contenu)
				{
				if (this.contenu[i])
					{contenu[i] = this.contenu[i].objToJSON();}
				}
			
			toSave['contenu'] = JSON.stringify(contenu).replace("'","''");
			
			toSave['partie'] = idPartie;
			toSave['carte'] = this.carte.position;
			toSave['positionX'] = this.position.x;
			toSave['positionY'] = this.position.y;
			
			var update = [];
			for (var u in toSave)
				{
				update.push("`"+u+"` = '"+toSave[u]+"'");
				}
			
			update = update.join(',');
			db.query("UPDATE `otraNew`.`coffres` SET "+update+" WHERE `coffres`.`cle` ="+this.idBdd+";");
			}
		}

	this.informe = function(action, parametres)
		{
		// regarde s'il y a des joueurs a portee, si oui :
		parametres = parametres ? parametres : false;
		if (action && this.carte && this.carte.presencesJoueurs.length > 0)
			{
			var mess = new message(this.id, action, parametres);
			for(var cle in this.carte.presencesJoueurs)
				{
				mess.envoi(this.carte.presencesJoueurs[cle].socket);
				}
			}
		// crée un message avec l'identifiant de l'objet, l'action et les parametres
		// envoie ce message a tout les joueurs a portee
		}
		
	if (expire)
		{
		this.id = "c"+idCoffres;
		idCoffres++;
		
		elementsJeu[this.id] = this;
	
		var obj = this;
		this.timerEnd = setTimeout(function(){obj.testDelete();},this.expire*1000);
		this.pose(carte, position);
		this.informe("arriveCarte", this.infosClient());
		}
	else
		{
		// le coffre doit etre enregistré en base de donnée
		this.init();
		}
	
	}

var spawner = function (carte, position, typeMonstre, nMaxMonstres, tempsSpawn)
	{
	this.timer = false;
	this.carte = carte;
	this.position = position;
	this.typeMonstre = typeMonstre;
	
	var typeM = typesMonstres[this.typeMonstre];
	
	this.nMaxMonstres = nMaxMonstres ? nMaxMonstres : Math.round(typeM.tailleMeuteMin + (Math.random()*(typeM.tailleMeuteMax - typeM.tailleMeuteMin)));
	this.nMonstres = 0;
	this.tempsSpawn = tempsSpawn ? tempsSpawn *1000 : typeM.tempsSpawn*1000;
	this.monstres = [];
	
	this.spawn = function()
		{
		if (this.nMonstres < this.nMaxMonstres)
			{
			var m = new monstre(this.typeMonstre, this.carte, this.position.clone());
			m.spawner = this;
			this.nMonstres++;
			this.monstres.push(m);
			m.anime(true);
			}
		
		var obj = this;
		this.timer = setTimeout(function(){obj.spawn();},Math.round(Math.random()*this.tempsSpawn*2));
		}
	
	this.spawn();
	}

var typeBatiment = function (nom, tiles, taille, chantier)
	{
	this.nom = nom;
	this.tiles = tiles;
	this.taille = taille;
	if (nom)
		{
		this.crafts = [];
		}
	this.chantier = chantier;
	}

var batiment = function ()
	{
	this.tile = false;
	
	this.carte = false;
	this.position = false;
	this.equipe = false;
	
	this.actif = true;
	
	this.majCraftsJoueurs = function()
		{
		for (var i in this.carte.presences)
			{
			if (this.carte.presences[i].id.substring(0,1) == 'j')
				{
				this.carte.presences[i].envoiCrafts();
				}
			}
		}
	
	this.initChantier = function()
		{
		this.chantier = {};
		for (var i in this.type.chantier)
			{
			this.chantier[i] = [this.type.chantier[i], 0, 0]; // need / get / pv
			}
		}
	
	this.load = function(ligne)
		{
		this.typeBatiment = ligne['typeBatiment'];
		this.type = typesBatiments[this.typeBatiment];
		
		this.nom = this.type.nom;
		this.taille = this.type.taille;
		
		this.equipe = ligne['equipe'];
		
		this.tile = this.type.tiles; // this.type.tiles[0];
		
		this.chantier = JSON.parse(ligne['construction']);
		this.id = "b"+ligne['cle'];
		elementsJeu[this.id] = this;
		this.pose(cartes[parseInt(ligne['carte'])], parseInt(ligne['position']));
		}
	
	this.creation = function(typeBatiment, carte, position, equipe)
		{
		this.typeBatiment = typeBatiment;
		this.type = typesBatiments[this.typeBatiment];
		
		this.nom = this.type.nom;
		this.taille = this.type.taille;
		
		this.equipe = equipe;
		
		this.tile = this.type.tiles; // this.type.tiles[0];
		
		this.carte = carte;
		this.position = position;
		
		this.initChantier();
		
		var obj = this;

		db.query("INSERT INTO `otraNew`.`batiments` (`typeBatiment` ,`partie`, `carte` ,`position` ,`construction` ,`equipe`) VALUES ('"+this.typeBatiment+"', '"+idPartie+"', '"+this.carte.position+"', '"+this.position+"', '"+JSON.stringify(this.chantier)+"', '"+this.equipe+"');").addListener('result', function(result)
			{
			obj.id = "b"+result.insert_id;
			elementsJeu[obj.id] = obj;
			obj.pose(obj.carte, obj.position);
			obj.informe("arriveCarte", obj.infosClient());
			});
		}
		
	this.pose = function(carte, position)
		{
		elementsJeu[this.id] = this;
		this.carte = carte;
		this.position = position;
		this.carte.ajouteBatiment(this);
		this.carte.ajoutePresence(this);
		this.majCraftsJoueurs();
		}
	
	this.enleve = function(obj)
		{
		this.actif = false;
		this.carte.enlevePresence(this);
		this.carte.enleveBatiment(this);
		this.informe("quitteCarte");
		verifHDV();
		this.majCraftsJoueurs();
		// suppression de la BDD a faire
		db.execute("delete from `batiments` where cle = "+this.id.substring(1));
		delete(elementsJeu[this.id]);
		}
	
	this.infosClient = function()
		{
		envoi = {'id':this.id, 'parametres' : {'nom':this.nom, 'equipe':this.equipe, 'position': this.position, 'tile':this.tile, 'taille':this.taille, 'chantier':{}}};
		for (var i in this.chantier)
			{
			envoi.parametres.chantier[i] = {'total':this.chantier[i][0], 'construit':this.chantier[i][1], 'pv':this.chantier[i][2]};
			}
		return envoi;
		}
	
	this.save = function()
		{
		toSave = {};
		
		toSave['partie'] = idPartie;
		toSave['carte'] = this.carte.position;
		toSave['position'] = this.position;
		// toSave['niveau'] = this.niveau;
		toSave['construction'] = JSON.stringify(this.chantier);
		
		var update = [];
		for (var u in toSave)
			{
			update.push("`"+u+"` = '"+toSave[u]+"'");
			}
		
		update = update.join(',');
		db.query("UPDATE `otraNew`.`batiments` SET "+update+" WHERE `batiments`.`cle` ="+this.id.substring(1)+";");
		}

	this.informe = function(action, parametres)
		{
		// regarde s'il y a des joueurs a portee, si oui :
		parametres = parametres ? parametres : false;
		if (action && this.carte && this.carte.presencesJoueurs.length > 0)
			{
			var mess = new message(this.id, action, parametres);
			for(var cle in this.carte.presencesJoueurs)
				{
				mess.envoi(this.carte.presencesJoueurs[cle].socket);
				}
			}
		// crée un message avec l'identifiant de l'objet, l'action et les parametres
		// envoie ce message a tout les joueurs a portee
		}
	
	this.chantierFini = function(ressource)
		{
		var retour = true;
		if (ressource)
			{
			retour = retour && this.chantier[ressource][0] == this.chantier[ressource][1];
			}
		else
			{
			for (var i in this.chantier)
				{
				retour = retour && this.chantier[i][0] == this.chantier[i][1];
				}
			}
		return retour;
		}
	
	this.estEndommage = function(ressource)
		{
		var retour = false;
		if (ressource)
			{
			retour = retour || this.chantier[ressource][1] != this.chantier[ressource][2];
			}
		else
			{
			for (var i in this.chantier)
				{
				retour = retour || this.chantier[i][1] != this.chantier[i][2];
				}
			}
		return retour;
		}
	
	this.construit = function(materiel, points)
		{
		if (this.chantier[materiel])
			{
			this.chantier[materiel][1] = Math.min(this.chantier[materiel][1]+points, this.chantier[materiel][0]);
			this.chantier[materiel][2] = Math.min(this.chantier[materiel][2]+points, this.chantier[materiel][1]);
			}
		var params = this.infosClient();
		params.score = points;
		this.informe('construit', params);
		this.save();
		if (this.chantierFini())
			{
			this.majCraftsJoueurs();
			}
		}

	this.repare = function(materiel, points)
		{
		if (this.chantier[materiel])
			{
			this.chantier[materiel][2] = Math.min(this.chantier[materiel][2]+points, this.chantier[materiel][1]);
			}
		var params = this.infosClient();
		params.score = points;
		this.informe('repare', params);
		this.save();
		if (!this.estEndommage())
			{
			this.majCraftsJoueurs();
			}
		}
	
	this.defense = function (scoreAttaque)
		{
		return scoreAttaque;
		}
	
	this.blesse = function (score, critique)
		{
		score = Math.round(score / 4);
		var max = -1;
		var idMax = false;
		
		for (var i in this.chantier)
			{
			if (max < this.chantier[i][2])
				{
				max = this.chantier[i][2];
				idMax = i;
				}
			}
		
		var infos = this.infosClient();
		infos['score'] = score;
		infos['critique'] = critique;
		this.informe("blesse", infos);

		this.chantier[idMax][2] = Math.max(this.chantier[i][2]-score, 0);
		
		var tot = 0;
		for (var i in this.chantier)
			{
			tot += this.chantier[i][2];
			}
		if (tot <= 0)
			{
			this.enleve();
			}
		else
			{
			this.save();
			}
		
		}
	
	}

var recetteCraft = function (nomRecette, typeObjet, batiment, competence, composants, modificateurs)
	{
	typesCrafts[nomRecette] = this;
	typesBatiments[batiment].crafts.push(nomRecette);
	this.typeObjet = typeObjet;
	this.batiment = batiment;
	this.competence = competence;
	this.composants = composants;
	this.modificateurs = modificateurs;
	}

var pot = function (carte, position, nom ,contenu, tile)
	{
	this.tile = tile ? tile : "pot.png";
	
	this.spawner = false;
	this.nom = nom;
	
	this.carte = carte;
	this.position = position;
	
	this.contenu = contenu;
	
	this.pose = function(carte, position)
		{
		elementsJeu[this.id] = this;
		this.carte = carte;
		this.position = position.clone();
		this.carte.ajoutePresence(this);
		}
	
	this.enleve = function()
		{
		this.carte.enlevePresence(this);
		this.informe("quitteCarte");
		delete(elementsJeu[this.id]);
		}
	
	this.infosClient = function()
		{
		envoi = {'id':this.id, 'parametres' : {'nom':this.nom, 'x': this.position.x, 'y': this.position.y, 'tile':this.tile}};
		return envoi;
		}
	
	this.informe = function(action, parametres)
		{
		// regarde s'il y a des joueurs a portee, si oui :
		parametres = parametres ? parametres : false;
		if (action && this.carte && this.carte.presencesJoueurs.length > 0)
			{
			var mess = new message(this.id, action, parametres);
			for(var cle in this.carte.presencesJoueurs)
				{
				mess.envoi(this.carte.presencesJoueurs[cle].socket);
				}
			}
		// crée un message avec l'identifiant de l'objet, l'action et les parametres
		// envoie ce message a tout les joueurs a portee
		}
		
	this.ouvreCoffre = function(user)
		{
		// ici, tout le contenu du coffre est envoyé dans l'inventaire du joueur
		// puis le coffre est supprimé des elements du jeu (peut importe si le contenu a été entièrement transféré ou non)
		for (var i in this.contenu)
			{
			if (user.autoStack(this.contenu[i])) {this.contenu[i]=false;}
			}
		user.coffre = false;
		user.envoiInventaire();
		if (this.spawner)
			{
			this.spawner.nombrePots--;
			}
		this.enleve();
		}
	
	this.id = "c"+idCoffres;
	idCoffres++;
	
	elementsJeu[this.id] = this;

	this.pose(carte, position);
	this.informe("arriveCarte", this.infosClient());
	
	}

var typeGenerateur = function (nom, loots, tiles, nMax, tempsSpawn, casesAuth)
	{
	this.nom = nom;
	this.loots = loots;
	this.tiles = tiles;
	this.nMax = nMax;
	this.tempsSpawn = tempsSpawn;
	this.casesAuth = casesAuth ? casesAuth : false;
	}

var generateurPot = function(carte, type)
	{
	this.carte = carte;
	this.typeGen = type;
	this.type = typesGenerateurs[type];
	this.nom = this.type.nom;
	this.loots = this.type.loots;
	this.nMax = this.type.nMax;
	this.tempsSpawn = this.type.tempsSpawn;
	this.tiles = this.type.tiles;
	this.casesAuth = this.type.casesAuth;
	
	this.timer = false;
	this.nombrePots = 0;
	
	this.spawn = function()
		{
		if (this.nombrePots < this.nMax)
			{
			var cleLoot = 0;
			var contenu = [];
			for (var i in this.loots)
				{
				loot = this.loots[i];
				if (Math.random()*100 < loot.pourcentage)
					{
					contenu[cleLoot] = new objet();
					contenu[cleLoot].creation(loot.typeObjet);
					contenu[cleLoot].quantite = Math.ceil(Math.random()*loot.quantite);
					cleLoot++;
					}
				}
			
			var position = false;
			var positionValide = false;
			var secu = 0;
			while ( secu < 30 && !positionValide )
				{
				position = new coord(Math.random()*this.carte.tailleX, Math.random()*this.carte.tailleY);
				if (!this.casesAuth)
					{
					positionValide = true;
					}
				else
					{
					if (this.casesAuth.indexOf(this.carte.cases[Math.floor(position.x)][Math.floor(position.y)].type) >= 0)
						{
						positionValide = true;
						}
					}
				secu ++;
				}
			
			if (positionValide)
				{
				var p = new pot(this.carte, position, this.nom, contenu, this.tiles[Math.floor(Math.random()*this.tiles.length)]);
				p.spawner = this;
				this.nombrePots++;
				}
			}
		
		var obj = this;
		this.timer = setTimeout(function(){obj.spawn();},Math.round(Math.random()*this.tempsSpawn*2));
		}
	
	this.spawn();
	}

// Modeles de carte :
var modeles = new Array();

modeles.push("hhhhhhhhhpeeeehhhhhhhhhhhhhhhhhh\nhhhphhhhhhpeeephhhhhhhhhhhhhhhhh\nhhpphhhhhhppeeephhpphhhhhhhhhhhh\nhhppphhhhhhhheeeeeeepphhhhhhpphh\nhhhphhhhhhhhhpeeeeeeeephhhhhhphh\nhhhhhhhhhhhhhhhhheeeeeephhhhpphh\nhhhhhhhhhhhhhhhhhhheeeephhhhhhhh\nhhhhhhhhphhhhhhhhhhhpeeephhhhhhh\nhhhhhhhhpphhhhhhhhhhhheeehhhhhhh\nhhhhhhhhhhhhhhhhhhhhhhpeephhpphh\nhhhhhhhhhhhhhhhhhhhhhhppeephhhhh\nhhhhhhhhhhhhhhhhhhhhhhhppeepphhh");
modeles.push("tttttttttttttttttttttttttttttttt\ntttttttttttttttptttttttttttttttt\nttpttttptttttttttttttpttttttpttt\ntttttttttttttttttttttttttttttttt\ntttttttttttttptttttttttttttttttt\ntttttpttttttttttttpttttttptttttt\nttttttttttpttttttttttttttttttttt\ntttptttttttttttttttttttttttttttt\ntttttttttttttttptttttttttttttttt\nttttttttttttttttttttttptttttpttt\ntttttttpttttttttttpttttttttttttt\ntttttttttttttttttttttttttttttttt");
modeles.push("ssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssesssssssssssesssssssssssssss\nsseeeessssesssseeeesssssesssssss\nseeeeeesseeesseeeeeessseeeesssse\neeeeeeeseeeeeeeeeeeeeseeeeeessee\neeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee\neeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
modeles.push("ssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss\nssssssssssssssssssssssssssssssss");
modeles.push("sssssssssssssssssshhhhhhhsssssss\nsssssssshhsssssshhhhhhhhhhhsssss\nssssssshhhhsssshhheehheeehhhhsss\nssssshhhehhhhshhheeeeeeeeehhhsss\nsssshheeeeehhhhheeeeeeeehhhhhsss\nssshheeeeeeeheheeeeeeeehhhhhhsss\nsshhhheeeeeeeeeeeeeeeeehhhhhssss\nsssshhheeeeeehheeeeehhhhhsssssss\nssssshhheeeehhhheeehhhhhssssssss\nssssshhhheehhhhhhhhhhhssssssssss\nsssssshhhhhhhhhhhhhhssssssssssss\nssssssshhhhhhsssshhsssssssssssss");
modeles.push("ppppppeeppphpppppppppeeppppppppp\nppppppheepppppppppppeeppphpppppp\nppppppppepppppphpppeeppppppppppp\nppppppppeepppppppppehppppppppppp\npppppppppepppppppppehppppppppppp\npppppppppeeppppppppeeppppppppppp\npphpppppppeeehppppppepppppppphpp\nppppppppppppeeeeepppeepppppppppp\nppppppppppppppppeepppepppppppppp\npppppppppppppppppeeeeepppppppppp\npppppppphpppppppppppeppppppppppp\nppppppppppppppppppppeppppppppppp");
modeles.push("ppaaappeppppaaapppaaaaappppppppp\nppaappeehpphaapppaaaaaaapppppppp\nppppphehhhhhhhpppaaaaaaapppppppp\nhhphheeeehhhhhhhhaaaaappphhhhhhp\nhhhheeeeeehhheehhhhaaappphhhhhhh\nhhheeeeeeeeeeeeeehhhhppphhhhhhhh\nhhheeeeeeeeeeeeeeeehhhhhhhhhhhhh\nhhhheeeeeeeeeeeeeeeeehhhhhhhhhhh\nhhhheeeeeeeeeeeeeheeeeeeehhhhhhh\nhhhhhheeeeeeehhhhhhhhhhheehhhhhh\nhhhhhhhheehhhhhhhhhhhhhhheehhhhh\nhhhhhhhhhhhhhhhhhhhhhhhhhhehhhhh");
modeles.push("eeeeeesttsseeeesstsssssseeeeeeee\neeeeeesssseeeeessttttsseeeeeeeee\neeeeeeesseeeeeeestttsseeeeeeeeee\neeeeeeeeeeeeeeeessttseeeeeeeeeee\neeeeeeeeeeeeeeesssssseeeeeeeeeee\neeeeeeeseeeeeeesseesseeeeeeseeee\neeeeeessseeeeeeeeeeeeeeeeessseee\neeeeeestsseeeeeeeeeeeeeeesstssse\neeeeessttsseeeeeeeeeeeeessttttse\neeeesstttsseeeeeeeeeeeeesttttsee\neeeesssttseeeeeeeeeeeeeessstssee\neeeeeesssseeeeeeeeeeeeeeeestseee");

txtPurgatoire = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee#eeeeseeeeeeeessesseeeeeeesssseee#esessseeeeeessssssseseeessssssee#sssssssesessssssssssssssssssssse#ssssssssssssssssssssssssssssssse#esspssssssssssssssssssssssssssse#ssssssssssssssssssssssssssssssee#ssssssssssssssssssssssssssssssee#essssssssssssssssseessssssssssse#eessssseesssssssseeeessseessssse#eeessseeeesssssseeeeeeeeeeesssee#eeeeeeeeeeesssseeeeeeeeeeeeeeeee";

function stopServer(message)
	{
	messageServeur(message);
	console.log(message);
	process.exit(0);
	}

function startServer(port)
	{
	var server = http.createServer(function(request, response) {
		// maintenance serveur
		if(request.connection.remoteAddress == '127.0.0.1')
			{
			if (request.url == "/stopServer")
				{
				response.writeHead(200);
				response.end("Arret du serveur.");
				stopServer("Arret de maintenance du serveur.")
				}
			else
				{
				count = new Array();
				count[1] = 0;
				count[2] = 0;
				for (var i in elementsJeu)
					{
					if (elementsJeu[i].id.substring(0,1) == "j" && elementsJeu[i].equipe)
						{
						count[elementsJeu[i].equipe]++;
						}
					}
				var retour = idPartie+" "+count[1]+" "+count[2];
				response.writeHead(200);
				response.end(retour);
				}
			}
		else
			{
			response.writeHead(403);
			response.end("NAN");
			}
		// envoi ici des informations sur l'etat du serveur
	});

	server.listen(port, function() {});

	// create the server
	wsServer = new WebSocketServer({
		httpServer: server
	});

	wsServer.on('request', function(request)
		{
	    var socket = request.accept(null, request.origin);
		
		socket.joueur = false;
		
		socket.connexionJoueur = function (ligne)
			{
			db.execute("update persos set token = NULL, enligne = 1 where cle = "+ligne.cle);
			
			socket.joueur = new joueur();
			socket.joueur.socket = socket;
			socket.joueur.mysql = ligne;
			socket.joueur.id = 'j'+ligne.cle;
			
			socket.joueur.equipe = ligne['equipe'];
			socket.joueur.nom = ligne['pseudo'];
			
			socket.joueur.initInventaire(32);
			socket.joueur.initStats();
			
			socket.joueur.statsInit['force'] = ligne['force'];
			socket.joueur.statsInit['constitution'] = ligne['constitution'];
			socket.joueur.statsInit['agilite'] = ligne['agilite'];
			socket.joueur.statsInit['intelligence'] = ligne['intelligence'];
			socket.joueur.statsInit['charisme'] = ligne['charisme'];
			
			socket.joueur.tile = socket.joueur.id+".png";
			socket.joueur.statsInit['tilesAttaque'] = ['cac1.png', 'cac2.png'];
			
			compes = ligne['competences'] != "" ?  JSON.parse(ligne['competences']) : {};
			
			for (var c in competences)
				{
				socket.joueur.statsInit[c] = compes[c] ? parseFloat(compes[c]) : 50;
				}
			
			socket.joueur.statsInit['portee'] = 1;
			socket.joueur.statsInit['vitesse'] = 4;
			socket.joueur.statsInit['seuilCritique'] = 5;
			
			socket.joueur.majStats();
			socket.joueur.pv = socket.joueur.statsCalc['pvMax'];
			
			if (ligne['inventaire'] != "")
				{
				var inv = JSON.parse(ligne['inventaire']);
				for (var i in inv.equipement)
					{
					socket.joueur.equipement.contenu[i] = new objet();
					socket.joueur.equipement.contenu[i].JSONToObj(inv.equipement[i]);
					}
				for (var i in inv.inventaire)
					{
					socket.joueur.inventaire.contenu[i] = new objet();
					socket.joueur.inventaire.contenu[i].JSONToObj(inv.inventaire[i]);
					}
				}
			
			elementsJeu[socket.joueur.id] = socket.joueur;
			mess = new message(socket.joueur.id, 'connexionOk', {'position' : socket.joueur.position});
			mess.envoi(socket);	
			
			socket.joueur.spawn();
			
			if (false)
				{
				if (!socket.joueur.equipement.contenu.mainD)
					{
					var testArc = new objet();
					if (socket.joueur.id == 'j1')
						{
						testArc.creation('arc', {'coolDownattArc':{'type':'ratio', 'valeur':'-1'}, 'chargementattArc':{'type':'ratio', 'valeur':'-1'}, 'degats':{'type':'abs', 'valeur':'40'}, 'vitesse':{'type':'ratio', 'valeur':'2'}}, socket.joueur, 'equipement', "mainD");
						}
					else
						{
						testArc.creation('arc', {}, socket.joueur, 'equipement', "mainD");
						}
					}
				
				if (!socket.joueur.inventaire.contenu[0])
					{
					var crea = new objet();
					crea.creation('bois', {}, socket.joueur, 'inventaire', 0);
					crea.quantite = 10;
					}

				if (!socket.joueur.inventaire.contenu[1])
					{
					var crea = new objet();
					crea.creation('pierre', {}, socket.joueur, 'inventaire', 1);
					crea.quantite = 10;
					}

				if (!socket.joueur.inventaire.contenu[2])
					{
					var crea = new objet();
					crea.creation('bois', {}, socket.joueur, 'inventaire', 2);
					crea.quantite = 10;
					}
				}

			// var crea = new objet();
			// crea.creation('oeuf', {}, socket.joueur, 'inventaire', 19);
			// crea.quantite = 30;
			
			socket.joueur.envoiInventaire();
			
			
			}
		
	    socket.on('message', function(message) 
			{
			
			if (message.type === 'utf8') 
				{
				// recuperation du message
				var data = message.utf8Data;
				try
					{
					message = JSON.parse(data);
					}
				catch(e)
					{
				   	message=false;
					}
				// traitement du message 
				if (!message)
					{
					console.log("message vide");
					}
				else if (socket.joueur)
					{
					socket.joueur.next = false;
					socket.joueur.traite_message(message);
					}
				else if (message.action == 'connexion')
					{
					
					var socketPlayer = socket;
					db.selectFunction("select * from `persos` where token = '"+message.parametres.token.replace("'","''")+"'", socketPlayer.connexionJoueur);
					}
				else
					{
					console.log(message);
					}
				}
			});

	    socket.on('close', function(id) 
			{
			if (socket.joueur)
				{
				socket.joueur.informe('deco');
				db.execute("update persos set enligne = 0 where cle = "+socket.joueur.mysql.cle);
				socket.joueur.deconnecte();
				}
			});
		});

	init_competences();
	init_monstres();
	init_objets();
	init_batiments();
	init_generateurs();
	
	purgatoires = [];

	purgatoires[1] = new carte();
	purgatoires[1].initialiseTxt(txtPurgatoire);

	purgatoires[2] = new carte();
	purgatoires[2].initialiseTxt(txtPurgatoire);

	}	



// --------------------------- INIT --------------------------------
// initialisation de la partie !

process.argv.forEach(function (val, index, array) {
  // console.log(index + ': ' + val);
});

if (process.argv[2])
	{
	idPartie = process.argv[2];
	db.selectFunction("select * from parties where cle = "+idPartie+"", function(ligne)
		{
		startServer(ligne['port']);
		});

	// chargement dans la base de données
	}
else
	{
	// serveur DEV 
	db.execute("delete from `batiments` where partie = 0");
	idPartie = 0;
	port = 443;
	startServer(port);
	// a creer !
	}

// the end...
