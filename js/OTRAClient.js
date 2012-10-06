var OTRAClient = new Class({
	Implements: [Options, OTRAGui],

	options: {
		char_id: 		null,
		webSocket: 		null,
		rootDir: 		'/otra/',
        tilesHeight: 	220,
        tilesWidth: 	128,
        tilesTop: 		60
	},

	chars: [],

	spawns: [],

    select: null,

	buffer: {},

    tiles: [],

    ctx: [],

    tips: null,

    events: [],

	window: {
		height: 10,
		width: 32
	},

	websocket: null,

	initialize: function(options) {
        // Intègre les options
		this.setOptions(options);

		// Tips
		this.tips = new Tips('.ImgCaseInv');

		// Ouverture websocket
		this.webSocket = new MooWebSocket(this.options.webSocket, {
			logging: true,
			events: {
				onSocketOpen: function() {
					// Chargement du perso et des configs de base
					this.webSocket.send({ fn: 'connect', data: {
						char_id: this.options.char_id
					}});

					// Construit les fenetres
					this.initChat();
				}.bind(this),
				onSocketMessage: function(e) { this.dispatchMessage(JSON.decode(e.data)); }.bind(this)
			}
		});
    },

    /**
	 * Dispatche les messages provenant du serveur
	 *
	 * data: {
			fn // fonctions à éxécuter
			el // éléments à mettre à jour
			prop // propriétés à mettre à jour
			msg // messages à afficher
	 }
	 *
	 * data.fn: [{
			name // nom de la fonction
			set // propriétés
	 }]
	 *
	 * data.el: [{
			name // selecteur
			set // propriétés
	 }]
	 *
	 * data.prop: [{
			name // nom de la propriété
			set // valeur
	 }]
	 *
	 * data.msg: [{
			type // type de message
			title // titre du message
			html // contenu du message
	 }]
	 *
	 **/
	dispatchMessage: function(data) {
		console.info('Received from server : ', data);

		// Actions
		if (data.fn != undefined && data.fn.length) {
			data.fn.each(function(fn) {
				window['Client'][fn.name].attempt(fn.set, window['Client']);
			});
		}
		if (data.prop != undefined && data.prop.length) {
			data.prop.each(function(prop) {
				if (window['Client'][prop.name])
					window['Client'][prop.name] = prop.set;
			});
		}
		if (data.el != undefined && data.fn.length) {
			data.el.each(function(el) {
				$$(el.name).set(el.set);
			});
		}

		// Messages
		if (data.msg != undefined && data.msg) {
			data.msg.each(function(msg) {
				this.addChat(msg)
			}.bind(this));
		}
	},

	javascript: function(src, fn) {
		if (fn == undefined)
			fn = function() {};

		if (!$$('script[src=js/' + src + '.js]').length) {
			return Asset.javascript('js/' + src + '.js', {
				onLoad: fn.bind(this)
			});
		} else {
			fn.apply(this);
		}

		return false;
	},

	/**
	 * Charge le perso
	 * Lance l'affichage du monde
	 *
	 **/
	init: function(data) {
		// Area
		this.window.scroll = (data.x / this.window.width).floor();

		// Construit les canvas de décors
        $('map').adopt([
            new Element('div', {
                'id'    : 'tileDivLayer',
                'styles': {
                    'width' 	: this.window.width * 32,
                    'height'	: this.options.tilesHeight,
                    'overflow'  : 'hidden'
                }
            }).adopt([
                new Element('canvas', {
                    'id'	: 'tileLayer',
                    'class'	: 'Canvas',
                    'width' : this.window.width * 32,
                    'height': this.options.tilesHeight,
                    'styles': {
                        'position'  : 'relative',
                        'z-index'   : 200
                    }
                })
            ]),
			new Element('canvas', {
				'id'	: 'mapLayer',
				'class'	: 'Canvas',
				'width' : this.window.width * 32,
				'height': this.window.height * 32,
				'styles': {
					'z-index'   : 100
				}
			})
		]);

        // Contexts
		this.ctx['map'] = $('mapLayer').getContext("2d");
        this.ctx['tile'] = $('tileLayer').getContext("2d");

        // Construit la map
        this.buffer.imgMapLayer = new Asset.images([
            this.options.rootDir + 'public/fr/jeu/bg/2.jpg',
            this.options.rootDir + 'public/fr/jeu/bg/2-1/2-1S.jpg',
            this.options.rootDir + 'public/fr/jeu/bg/2-1/2-1N.jpg',
            this.options.rootDir + 'public/fr/jeu/bg/2-1/2-1O.jpg',
            this.options.rootDir + 'public/fr/jeu/bg/2-1/2-1SO.jpg',
            this.options.rootDir + 'public/fr/jeu/bg/2-1/2-1NO.jpg'
        ], {
            onComplete: function()
			{
				// Carte
				this.drawMap();

				// Events généraux
				window.addEvents({
					'keydown': this.keyEvent.bind(this)
				});

				// Events locaux
				// Déplacement du perso
				$('mapLayer').addEvent('click', this.mouseCharEvent.bind(this));

				// Clic sur un bâtiment
				$('tileLayer').addEvent('click', this.mouseTileEvent.bind(this));

				this.toggleInfos(false);
			}.bind(this)
        });

		// Construit le perso du joueur
		this.addChar(data);

        // Events GUI
        $$('#chat .button, #inventory .button, #character .button').addEvent('click', function(e) {
            $(e.target).getParent().toggleClass('show');
        });
	},

    /**
	 * Construit la map
	 *
	 **/
    drawMap: function() {
		this.ctx['map'].clearRect(0, 0, $('mapLayer').getSize().x, $('mapLayer').getSize().y);
		for (i = 0; i <= this.window.width; i ++) {
			for (j = 0; j < this.window.height; j ++) {
				if (i == 0 && this.window.scroll == 0) {
					if (j == 0) {
						this.ctx['map'].drawImage(this.buffer.imgMapLayer[5], i * 32, j * 32, 32, 32);
					} else if (j == this.window.height - 1) {
						this.ctx['map'].drawImage(this.buffer.imgMapLayer[4], i * 32, j * 32, 32, 32);
					} else {
						this.ctx['map'].drawImage(this.buffer.imgMapLayer[3], i * 32, j * 32, 32, 32);
					}
				} else {
					if (j == 0) {
						this.ctx['map'].drawImage(this.buffer.imgMapLayer[2], i * 32, j * 32, 32, 32);
					} else if (j == this.window.height - 1) {
						this.ctx['map'].drawImage(this.buffer.imgMapLayer[1], i * 32, j * 32, 32, 32);
					} else {
						this.ctx['map'].drawImage(this.buffer.imgMapLayer[0], i * 32, j * 32, 32, 32);
					}
				}
			}
		}

		// Zones de transfert
		if (this.window.scroll == 0) {
			this.ctx['map'].fillStyle = "rgba(255, 255, 255, 0.3)";
			this.ctx['map'].fillRect($('mapLayer').getSize().x - 64, 28, 64, $('mapLayer').getSize().y - 56);
		} else {
			this.ctx['map'].fillStyle = "rgba(255, 255, 255, 0.3)";
			this.ctx['map'].fillRect(0, 28, 64, $('mapLayer').getSize().y - 56);
			this.ctx['map'].fillRect($('mapLayer').getSize().x - 64, 28, 64, $('mapLayer').getSize().y - 56);
		}
    },

	changeMap: function(data) {
		this.chars[this.options.char_id].set('x', this.window.scroll < data ? data * this.window.width + 2 : data * this.window.width + this.window.width - 3);

		this.window.scroll = +data;

		this.drawMap();

		this.chars[this.options.char_id].refresh();
	},

    /**
	 * Events liés aux touches clavier, ouvre :
	 * - inventaire
	 * - infos perso
	 * - chat
	 *
	 **/
    keyEvent: function(oEvent) {
        if (oEvent.key == 'i' && oEvent.shift) {
            this.toggleInventory();
        } else if (oEvent.key == 'c' && oEvent.shift) {
            this.toggleInfos();
        }
    },

    /**
	 * Event de déplacement du perso au clic
	 *
	 **/
    mouseCharEvent: function(oEvent) {
		// Event dans la fenêtre ?
		x = (this.window.scroll * this.window.width) + ((oEvent.client.x - $('mapLayer').getPosition().x) / 32).floor();

		if (x < 0 || x > (this.window.scroll * this.window.width) + this.window.width) {
			return;
		}
		y = ((oEvent.client.y - $('mapLayer').getPosition().y) / 32).floor();

		if (y < 0 || y > this.window.height) {
			return;
		}

		// Affiche le déplacement
		data = { x: x, y: y };

		this.webSocket.send({ fn: 'moveChar', data: data});

		this.chars[this.options.char_id].move(data);
    },

    /**
	 * Event de clic sur les bâtiments
	 *
	 **/
    mouseTileEvent: function(oEvent) {
		// Case du clic
		var iPosClickRel = ((oEvent.client.x - $('tileLayer').getPosition().x) / 128).floor();
		var iPosClickAbs = iPosClickRel + (this.window.scroll * (this.window.width * 32 / this.options.tilesWidth).floor());

		// Un bâtiment existe dans la case ? TODO effectuer la vérif en php
		var bTrouve = false;
        this.tiles.each(function(oTile) {
            if (oTile.react && iPosClickAbs == oTile.pos) {
				this.openTileWindow(oTile);
                $('tileLayer').dataset.select = oTile.pos;
                bTrouve = true;
			}
		}.bind(this));

        if (!bTrouve) {
            // On lance la fenetre nouveau bâtiment TODO : récup d ajax
			this.openTileWindow({
                'name': 'Nouveau b&acirc;timent',
                'file' : 'build',
				'pos' : iPosClickRel,
                'react': true,
                'owner': ''
            }, true);
            // On stoque la case sélectionnée
			$('tileLayer').dataset.select = iPosClickAbs;
        }
    },

    /**
	 * Ouvre une fenetre de tile
	 *
	 **/
    openTileWindow: function(oTile, bNew) {
        if ($('shopDivLayer')) {
            $('shopDivLayer').dispose();
        }

        if (oTile.pos < (this.window.width / 2)) {
            var pos = oTile.pos * 32 + (this.options.tileWidth / 2 - 16);
        } else {
            var pos = oTile.pos * 32 + (this.options.tileWidth / 2 - 16) - 300;
        }

        this.add('shop', {
            sTitle  : oTile.name,
            iSizeX  : 300,
            iSizeY  : 200,
            sFile   : 'tiles/' + oTile.file,
            oStyles : {
                left: pos,
				top: this.options.tilesTop
            },
            oParams : {
                owner: oTile.owner
            }
        });
    },

    /**
	 * Ajoute/remplace la sélection
	 */
	selectChar: function(o) {
		if (o === undefined) {
			this.select = null;
			$('selectTarget').set('html', '');
			$('selectTargetInfos').set('html', '');
		} else {
			this.select = o;
			$('selectTarget').set('html', o.get('name'));
			$('selectTargetInfos').set('html', 'Niveau ' + o.get('level'));
		}
	},

/* ===================================================================
 * CHAT RELATED FUNCTIONS
 * =================================================================*/

	/**
	 * Toggle chat window
	 */
	initChat: function() {
		$('chatInput').addEvent('keyup', function(e) {
			if (e.key == 'enter') this.addChat();
		}.bind(this));
		$('chatSelect').addEvent('change', this.filterChat.bind(this));
	},

	/**
	 * Filter messages by type
	 */
	filterChat: function() {
		if ($('chatSelect')) {
			var aChatElems = $('chatContent').getElements('div');
			switch ($('chatSelect').get('value')) {
				case 'all' :
					aChatElems.each(function(o) {
						o.setStyle('display',  'block');
					});
					break;
				case 'guild' :
					aChatElems.each(function(o) {
						if (o.hasClass('ChatMsgGuild') || o.hasClass('ChatMsgAdmin') || o.hasClass('ChatMsgConsole'))
							o.setStyle('display',  'block');
						else
							o.setStyle('display',  'none');
					});
					break;
			}
		}
	},

	/**
	 * Send/Receieve (depending of data) and show a message
	 */
	addChat: function(data) {
		var container  = $('chatContent');

		if (data == undefined) {
			if ($('chatInput').get('value')) {
				var sVal    = $('chatInput').get('value').clean();
				var sClass  = '';
				$('chatInput').set('value', '');

				if (sVal.charAt(0) == '/') {
					sMsg = '';
					sVal = sVal.substr(1, sVal.length);
					if (sVal == 'help' || sVal == 'h') {
						sMsg = '<br />![message] : Crier<br />G>[message] : Parler &agrave; la guilde<br />';
					}

					new Element('div', {
						class: 'ChatMsg'
					}).set('html', '[console]> ' + sMsg).inject(container, 'top').addClass('ChatMsgConsole');
				} else {
					if (sVal.charAt(0) == '!') {
						$('chatInput').set('value', sVal.charAt(0));
						sVal = sVal.substr(1, sVal.length);
						sClass = 'ChatMsgShout';
					} else if (sVal.substr(0, 2) == 'G>') {
						$('chatInput').set('value', sVal.substr(0, 2));
						sVal = sVal.substr(2, sVal.length);
						sClass += ' ChatMsgGuild';
					}

					data = {
						char_id 	: this.options.char_id,
						name		: this.chars[this.options.char_id].get('name'),
						msg     	: sVal,
						class   	: sClass.trim()
					};

					this.webSocket.send({
						fn: 'chatMsg',
						data: data
					});
				}
			}
		}

		new Element('div', {
			class: 'ChatMsg'
		}).set('html', data.name + '> ' + data.msg).inject(container, 'top').addClass(data.class);

		this.filterChat();
	},

/* ===================================================================
 * CHARACTER INVENTORY RELATED FUNCTIONS
 * =================================================================*/

    /**
	 * Crée/affiche la fenetre d'inventaire
	 *
	 */
    initInventory: function(bShow) {
		this.switchTab(0);

		if (this.chars[this.options.char_id].inventory != undefined)
			for (i in this.chars[this.options.char_id].inventory) {
				this.addItem(this.chars[this.options.char_id].inventory[i]);
			};
    },

    /**
	 * Change d'onglet d'inventaire
	 *
	 */
    switchTab: function(i) {
        $('inventory').getElements('.tab').each(function(el) { el.setStyle('display', 'none'); });
        $('inventory').getElements('a').each(function(el) { el.removeClass('Selected'); });
        $('invTab_' + i).setStyle('display', 'block');
        $('invLinkTab_' + i).addClass('Selected');
	},

    /**
	 * Ajoute un objet à l'inventaire
	 *
	 */
    addItem: function(item) {
        var img = new Element('img', {
			src: this.options.rootDir + 'public/fr/jeu/items/' + item.file + '.png',
			title: item.desc,
			events: {
				'dblclick' : this.equip.bind(this)
			}
		}).inject($('invPos_' + item.pos));
		img.dataset.type = item.class;
		img.dataset.id = item.id;
		img.dataset.twoHanded = item.twoHanded != undefined ? 1 : 0;
    },

    /**
	 * Achat d'objet
	 *
	 */
	buy: function(id) {
		this.webSocket.send({ fn: 'buy', data: id });
    },

    /**
	 * Ajout de l'objet
	 *
	 */
	buyResponse: function(data) {
		this.chars[this.options.char_id].set('money', this.chars[this.options.char_id].get('money') - data.money);

		this.addItem(data.item);
    },

    /**
	 * Equipement d'objet
	 *
	 */
	equip: function(e) {
		this.events['inventory_actions'] = { click : e };

		if (e.shift) {
			this.destroy(e.target);
		} else {
			var divParent = e.target.getParent();

			if (divParent.dataset.type == 'storage') {
				this.webSocket.send({ fn: 'setCharEquip', data: { pos: divParent.dataset.pos }});
			} else {
				this.webSocket.send({ fn: 'setCharUnequip', data: { pos: divParent.dataset.pos }});
			}
		}
    },

    /**
	 * Equipe l'objet
	 *
	 */
	equipResponse: function(data) {
        if (data != undefined) {
			var img         = this.events['inventory_actions'].click.target;
			var divParent   = img.getParent();

			// Equip
			var divCibles   = $('inventory').getElements('.case[data-type=' + img.dataset.type + ']');
			var imgCible    = divCibles[0].getFirst();

			// Choice if multiple targets
			if (divCibles.length > 1) {
				$confirm('Quelle position souhaitez-vous &eacute;quiper ?', {
					textOk : 'Equipement gauche',
					textCancel : 'Equipement droit',
					onClose: function(bResp) {
						if (!bResp) {
							imgCible = divCibles[1].getFirst();
							if (imgCible) {
								divParent.adopt(imgCible);
							}
							divCibles[1].adopt(img);
						} else {
							if (imgCible) {
								divParent.adopt(imgCible);
							}
							divCibles[0].adopt(img);
						}
					}
				})
			} else {
				if (imgCible) {
					divParent.adopt(imgCible);
				}
				divCibles[0].adopt(img);

				// Un equip the first/second weapon if two handed
				if (img.dataset.type == 'weapon1' || img.dataset.type == 'weapon2') {
					var imgLinkedWeapon = $('inventory').getElement('.case[data-type=' + img.dataset.type + ']').getFirst();
					if ($('inventory').getElement('.case[data-type=weapon1]').getFirst().dataset.twoHanded && imgLinkedWeapon)
						this.unequipResponse(data);
				}
			}

			delete this.chars[this.options.char_id].inventory[data.prePos];
			this.chars[this.options.char_id].inventory[data.pos] = data.item;
			this.chars[this.options.char_id].saveThumb();
		}

		this.toggle('inventory_actions', true);
    },

    /**
	 * Deséquipe l'objet
	 *
	 */
    unequipResponse: function(data) {
        if (data.pos) {
			var img         = this.events['inventory_actions'].click.target;
			var divCible 	= document.id('invPos_' + data.pos);

			if (divCible) {
				divCible.adopt(img);
				this.chars[this.options.char_id].inventory[data.prePos] = null;
				this.chars[this.options.char_id].inventory[data.pos] = data.item;
				this.chars[this.options.char_id].saveThumb();
			}
		}

		this.toggle('inventory_actions', true);
    },

    /**
	 * Destruction d'objet
	 *
	 */
	destroy: function(el) {
		this.webSocket.send({ fn: 'setCharDestroy', data: { pos: el.getParent().dataset.pos }});
    },

    /**
	 * Détruit l'objet
	 *
	 */
	destroyResponse: function(data) {
		if (document.id('invPos_' + data.pos)) {
			// Destroy the item
			document.id('invPos_' + data.pos).getElement('img').dispose();
			delete this.chars[this.options.char_id].inventory[data.pos];
			this.chars[this.options.char_id].saveThumb();
		}

		this.toggle('inventory_actions', true);
    },

	drawCharEquips: function(id) {
		this.chars[id].drawChar();
	},

/* ===================================================================
 * MOVE RELATED FUNCTIONS
 * =================================================================*/

	loadArea: function(data) {
		// Delete current area data
		this.chars.each(function(e, i) {
			if (i != this.options.char_id) {
				this.removeChar(i);
			}
		}.bind(this));

		this.tiles.each(function(e, i) {
			e.remove();
			delete this.tiles[i];
		}.bind(this));

		// Load new area data
		if (data.chars != undefined && data.chars.length) {
			data.chars.each(function(e, i) {
				this.chars[i] = e;
				this.chars[i].show();
			}.bind(this));
			// new events
		}

		if (data.tiles != undefined && data.tiles.length) {
			data.tiles.each(function(e, i) {
				this.tiles[i] = e;
				this.tiles[i].show();
			}.bind(this));
			// new events
		}
	},

	moveChar: function(data) {
		if (this.chars[data.id] != undefined)
			this.chars[data.id].move(data);
	},

/* ===================================================================
 * CHAR RELATED FUNCTIONS
 * =================================================================*/

    /**
	 * Crée/affiche la fenetre d'informations perso
	 */
    toggleInfos: function(bShow) {
        if (!$('infosDivLayer')) {
			oDivWindow = this.add('infos', {
				sTitle  : 'Personnage [C]',
				iSizeX  : 200,
				iSizeY  : 400,
				bDrag   : true
			});

			oInDivWindow = new Element('div', {
				class: 'InInfos'
			 }).inject(oDivWindow);

			oInDivWindow.adopt([
				new Element('table').adopt([
					new Element('tr').adopt([
						new Element('td', {
							html : 'Nom : ',
							class: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_name',
						   html 	: this.chars[this.options.char_id].get('name'),
						   class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_class',
						   colspan	: 2,
						   html 	: this.chars[this.options.char_id].get('class'),
						   class	: 'tdr'
						})
					]),
					new Element('tr').adopt([
						new Element('td', {
							html 	: 'Niveau : ',
							class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_level',
						   html 	: this.chars[this.options.char_id].get('level'),
						   class	: 'tdl'
						}),
						new Element('td', {
						   html 	: 'Distance :',
						   class	: 'tdr'
						}),
						new Element('td', {
						   id   	: 'infos_x_max',
						   html 	: this.chars[this.options.char_id].get('x_max'),
						   class	: 'tdl'
						})
					]),
					new Element('tr').adopt([
						new Element('td', {
						   html 	: 'XP :',
						   class	: 'tdr'
						}),
						new Element('td', {
						   id   	: 'infos_exp',
						   colspan	: 3,
						   html 	: this.chars[this.options.char_id].get('exp'),
						   class	: 'tdl'
						})
					])
				]),
				new Element('hr'),
				new Element('table').adopt([
					new Element('tr').adopt([
						new Element('td', {
							html 	: 'Force : ',
							class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_str',
						   html 	: this.chars[this.options.char_id].get('str'),
						   class	: 'tdl'
						}),
						new Element('td', {
						   html 	: 'Int :',
						   class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_int',
						   html 	: this.chars[this.options.char_id].get('int'),
						   class	: 'tdl'
						})
					]),
					new Element('tr').adopt([
						new Element('td', {
							html 	: 'Agilité : ',
							class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_agi',
						   html 	: this.chars[this.options.char_id].get('agi'),
						   class	: 'tdl'
						}),
						new Element('td', {
						   html 	: 'Charisme :',
						   class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_cha',
						   html 	: this.chars[this.options.char_id].get('cha'),
						   class	: 'tdl'
						})
					]),
				]),
				new Element('hr'),
				new Element('table').adopt([
					new Element('tr').adopt([
						new Element('td', {
							html 	: 'HP : ',
							class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_hp',
						   html 	: this.chars[this.options.char_id].get('hp') + '/' + this.chars[this.options.char_id].get('max_hp'),
						   class	: 'tdl'
						}),
						new Element('td', {
						   html 	: 'SP :',
						   class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_sp',
						   html 	: this.chars[this.options.char_id].get('sp') + '/' + this.chars[this.options.char_id].get('max_sp'),
						   class	: 'tdl'
						})
					]),
				]),
				new Element('hr'),
				new Element('table').adopt([
					new Element('tr').adopt([
						new Element('td', {
							html 	: 'Points de stat : ',
							class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_status_point',
						   html 	: this.chars[this.options.char_id].get('status_point'),
						   class	: 'tdl'
						}),
						new Element('td', {
						   html 	: 'Points de skill :',
						   class	: 'tdl'
						}),
						new Element('td', {
						   id   	: 'infos_skill_point',
						   html 	: this.chars[this.options.char_id].get('skill_point'),
						   class	: 'tdl'
						})
					])
				])
			]);
		}

 		if (bShow == undefined || bShow == true)
			this.toggle('infos');
    },

	addChar: function(data) {
		this.javascript('OTRAPlayer', function() {
			var player = new OTRAPlayer(data);
			this.chars[player.id] = player;
			player.show();
		});
	},

	removeChar: function(id) {
		if (this.chars[id] != undefined) {
			this.chars[id].remove();
			delete this.chars[id];
		}
	},


/* ===================================================================
 * MOBS RELATED FUNCTIONS
 * =================================================================*/

	addSpawn: function(data) {
		var mob = new OTRAMob(data.spawn_id, data);
		this.spawns[mob.id] = mob;
		mob.show();
	},

	moveMob: function(data) {
		if (this.spawns[data.spawn_id] != undefined)
			this.spawns[data.spawn_id].move(data);
	},

    /**
	 * Supprime toutes les tiles
	 *
	 */
    removeSpawns: function() {
		this.spawns.each(function(el) {
			el.remove();
		});
		this.spawns = [];
	},


/* ===================================================================
 * BUILDING RELATED FUNCTIONS
 * =================================================================*/

    build: function(id) {
		this.webSocket.send({ fn: 'build', data: { id: id, pos: $('tileLayer').dataset.select } });
	},

	/**
	 * Charge une tile
	 *
	 */
    addTile: function(oTile) {
		this.tiles.push(oTile);

		new Asset.image(
			this.options.rootDir + 'public/fr/jeu/tiles/' + oTile.file + '.png?' + this.oDate,
			{
				onload: function(oImg) {
					if (oImg) {
						oImg.set({ width: this.options.tilesWidth, height: this.options.tilesHeight });
						x  = (oTile.pos % (this.window.width / 4)) * 128;
						y  = $('mapLayer').getPosition().y - this.options.tilesHeight - this.options.tilesTop;

						this.ctx['tile'].clearRect(x, 0, this.options.tileWidth, $('tileLayer').getSize().y);
						this.ctx['tile'].drawImage(oImg, x, y, this.options.tilesWidth, this.options.tilesHeight);

					}
				}.bind(this)
			}
		);
    },

    /**
	 * Supprime toutes les tiles
	 *
	 */
    removeTiles: function() {
		this.tiles = [];
		this.ctx['tile'].clearRect(0, 0, $('tileLayer').getSize().x, $('tileLayer').getSize().y);
    }
});