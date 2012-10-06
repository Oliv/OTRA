var OTRACharacter = new Class({
	Extends: OTRAObject,

	ctx: null,

	type: null,

	buffer: {
		default: null,
		current: null
	},

	initialize: function(id, data, type) {
		this.type = type;
		this.parent(id, data);
    },

	/**
	 * Show Character
	 *
	 **/
	show: function() {
		if (!$(this.type + 'InfosLayer_' + this.id)) {
			$(this.type).adopt([
				new Element('div', {
					'id'	: this.type + 'InfosLayer_' + this.id,
					'class'	: this.type.capitalize() + 'Infos',
					'styles': {
						'top' 	: this.getPosition().y - 32,
						'left'  : this.getPosition().x - 14
					}
				}).set({'html': this.data.name}),
				new Element('canvas', {
					'id'	: this.type + 'Layer_' + this.id,
					'class'	: 'Canvas',
					'width' : 32,
					'height': 48,
					'styles': {
						'top'       : this.getPosition().y,
						'left'      : this.getPosition().x,
						'z-index'   : 300,
						'position'	: 'absolute'
					},
					'events': {
						'click' : this.onSelect.bind(this)
					}
				})
			]);

			// Context
			this.ctx = $(this.type + 'Layer_' + this.id).getContext("2d");

			// Image de base du perso
			this.onContextLoaded();
		}
	},

	refresh: function() {
		$(this.type + 'InfosLayer_' + this.id).setStyles({
			'top' 	: this.getPosition().y - 32,
			'left'  : this.getPosition().x - 14
		});
		$(this.type + 'Layer_' + this.id).setStyles({
			'top' 	: this.getPosition().y,
			'left'  : this.getPosition().x
		});
	},

	/**
	 * Remove Character
	 *
	 **/
	remove: function() {
		if ($(this.type + 'InfosLayer_' + this.id))
			$(this.type + 'InfosLayer_' + this.id).destroy();

		$(this.type + 'Layer_' + this.id).destroy();
	},

    /**
	 * Déplace un perso vers les coordonnées
	 *
	 **/
    move: function(data) {
        this.ctx.clearRect(0, 0, 32, 48);

        // Sens du personnage
		if (this.getAbsolutePosition().x > data.x) {
			// Left
			this.ctx.drawImage(this.buffer.current, 32, 48, 32, 48, 0, 0, 32, 48);
			$(this.type + 'Layer_' + this.id).store('direction', 'left');
		} else if (this.getAbsolutePosition().x < data.x){
			// Right
			this.ctx.drawImage(this.buffer.current, 96, 96, 32, 48, 0, 0, 32, 48);
			$(this.type + 'Layer_' + this.id).store('direction', 'right');
		} else {
			if (this.getAbsolutePosition().y > data.y) {
				// Haut
				this.ctx.drawImage(this.buffer.current, 32, 144, 32, 48, 0, 0, 32, 48);
				$(this.type + 'Layer_' + this.id).store('direction', 'up');
			} else {
				// Bas
				this.ctx.drawImage(this.buffer.current, 32, 0, 32, 48, 0, 0, 32, 48);
				$(this.type + 'Layer_' + this.id).store('direction', 'down');
			}
		}

		// Effet slide
        if (this.effects.move == undefined)
			this.effects.move = new Fx.Elements([$(this.type + 'Layer_' + this.id), $(this.type + 'InfosLayer_' + this.id)], {
				link 		: 'cancel',
				transition 	: 'linear',
				onStart 	: function() {
					this.stopAnimation('move');

					this.animate($(this.type + 'Layer_' + this.id).retrieve('direction'), this.id);
					this.timers['move'] = this.animate.periodical(400, this, [$(this.type + 'Layer_' + this.id).retrieve('direction'), this.id]);
				}.bind(this),
				onComplete  : function() {
					this.stopAnimation('move');
				}.bind(this)
			});

        // Calcul de la durée de déplacement
        var iSizeX = Math.abs(this.getAbsolutePosition().x - data.x);
        var iSizeY = Math.abs(this.getAbsolutePosition().y - data.y);
        var iNbCasesZ = Math.sqrt(Math.pow(iSizeX, 2) + Math.pow(iSizeY, 2)).floor();

        // Lancement de l'effet
        this.effects.move.options.duration = iNbCasesZ * 400;
        this.effects.move.start({
			'1' : {
				'left': [$(this.type + 'InfosLayer_' + this.id).getPosition().x, this.getPosition(data).x - 14],
				'top': [$(this.type + 'InfosLayer_' + this.id).getPosition().y, this.getPosition(data).y - 34]
			},
			'0' : {
				'left': [$(this.type + 'Layer_' + this.id).getPosition().x, this.getPosition(data).x],
				'top': [$(this.type + 'Layer_' + this.id).getPosition().y, this.getPosition(data).y]
			}
        });
    },

    /**
	 * Animation de déplacement à chaque pas et stoquage des coords case par case
	 *
	 **/
    animate: function(sDir) {
		this.ctx.clearRect(0, 0, 32, 48);

		// MAJ des coords du perso, décalé pour bien prendre la bonne coordonnée
		(function() {
			if (this.type + 'Layer_' + this.id) {
				this.data.x = (this.client.window.scroll * this.client.window.width) + (($(this.type + 'Layer_' + this.id).getPosition().x - $('mapLayer').getPosition().x) / 32).floor();
				this.data.y = (((($(this.type + 'Layer_' + this.id).getPosition().y - this.client.options.tilesHeight - this.client.options.tilesTop) / 32).floor() + 1));

				// Changement de niveau
				if (typeof(this.isCurrentPlayer) == 'function' && this.isCurrentPlayer()) {
					if (this.getRelativePosition().x >= this.client.window.width - 2) {
						this.stopAnimation('move');
						this.client.spawns.each(function(o) { o.stopAnimation('move'); });
						this.client.removeTiles();
						this.client.removeSpawns();
						this.client.selectChar();
						this.client.webSocket.send({ fn: 'changeMap', data: 1 });
					}
					if (this.client.window.scroll != 0 && this.getRelativePosition().x <= 1) {
						this.stopAnimation('move');
						this.client.spawns.each(function(o) { o.stopAnimation('move'); });
						this.client.removeTiles();
						this.client.removeSpawns();
						this.client.selectChar();
						this.client.webSocket.send({ fn: 'changeMap', data: -1 });
					}
				}
			}
		}.bind(this)).delay(100);

		// Animation de deplacement
		if (sDir == 'left') {
			this.ctx.drawImage(this.buffer.current, 32, 48, 32, 48, 0, 0, 32, 48);
			(function() {
				this.ctx.clearRect(0, 0, 32, 48);
				this.ctx.drawImage(this.buffer.current, 96, 48, 32, 48, 0, 0, 32, 48);
			}.bind(this)).delay(200);
		} else if (sDir == 'right') {
			this.ctx.drawImage(this.buffer.current, 96, 96, 32, 48, 0, 0, 32, 48);
			(function() {
				this.ctx.clearRect(0, 0, 32, 48);
				this.ctx.drawImage(this.buffer.current, 32, 96, 32, 48, 0, 0, 32, 48);
			}.bind(this)).delay(200);
		} else if (sDir == 'up') {
			this.ctx.drawImage(this.buffer.current, 32, 144, 32, 48, 0, 0, 32, 48);
			(function() {
				this.ctx.clearRect(0, 0, 32, 48);
				this.ctx.drawImage(this.buffer.current, 96, 144, 32, 48, 0, 0, 32, 48);
			}.bind(this)).delay(200);
		} else if (sDir == 'down') {
			this.ctx.drawImage(this.buffer.current, 32, 0, 32, 48, 0, 0, 32, 48);
			(function() {
				this.ctx.clearRect(0, 0, 32, 48);
				this.ctx.drawImage(this.buffer.current, 96, 0, 32, 48, 0, 0, 32, 48);
			}.bind(this)).delay(200);
		}
	},

    /**
	 * Event de sélection des persos/mobs au clic
	 *
	 **/
    onSelect: function() {
		this.client.selectChar(this);
    }
});