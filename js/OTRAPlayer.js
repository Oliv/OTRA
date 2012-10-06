var OTRAPlayer = new Class({
	Extends: OTRACharacter,

	inventory: null,

	initialize: function(data) {
		if (data.inventory != undefined)
			this.inventory = data.inventory;
		delete data.inventory;

		id = data.char_id;
		delete data.char_id;

		this.parent(id, data, 'char');
    },

	show: function() {
		this.parent();

		if (this.isCurrentPlayer() && !$('charInfosHP_' + this.id)) {
			$('charInfosLayer_' + this.id).adopt([
				new Element('div', {
					'id'	: 'charInfosHP_' + this.id,
					'class'	: 'CharInfosHP'
				}).adopt(
					new Element('div', {
						'id'	: 'inCharInfosHP_' + this.id,
						'class' : 'InCharInfosHP'
					})
				),
				new Element('div', {
					'id'	: 'charInfosSP_' + this.id,
					'class'	: 'CharInfosSP'
				}).adopt(
					new Element('div', {
						'id'	: 'inCharInfosSP_' + this.id,
						'class' : 'InCharInfosSP'
					})
				)
			]);
		}
	},

	onCharLoaded: function() {
		this.client.initInventory();
	},

    onContextLoaded: function() {
		this.buffer.default = new Asset.image(
			this.client.options.rootDir + 'public/fr/jeu/chars/' + this.data.file + '.png?' + this.refreshDate()
		, {
			onload: function() {
				// Image du perso équipé
				this.buffer.current = new Asset.image(
					this.client.options.rootDir + 'public/fr/jeu/chars/thumb/' + this.id + '.png?' + this.date, {
					onload: function() {
						this.ctx.clearRect(0, 0, 32, 48);
						this.ctx.drawImage(this.buffer.current, 0, 0, 32, 48, 0, 0, 32, 48);

						this.onCharLoaded();
					}.bind(this)
				});
			}.bind(this)
		});
    },

    saveThumb: function() {
		var canvas = new Element('canvas', {
			width: 128,
			height: 192
		});
		var ctx = canvas.getContext('2d');
		ctx.drawImage(this.buffer.default, 0, 0, 128, 192);

		var equips = [];
		for (i = 0; i < 10; i++) {
			if (this.inventory[i]) {
				equips.push(this.client.options.rootDir + 'public/fr/jeu/items/' + this.inventory[i].file + '_equip.png?' + this.refreshDate());
			}
		}

		if (!equips.length) {
			this.buffer.current = this.buffer.default;
			// Envoie un png du perso équipé
			this.client.webSocket.send({
				fn: 'setCharThumb',
				data: 'default'
			});
		}

		var imgs = Asset.images(equips, {
			onComplete: function() {
				imgs.each(function(img) {
					ctx.drawImage(img, 0, 0, 128, 192);
				});

				this.buffer.current = canvas;

				// Envoie un png du perso équipé
				this.client.webSocket.send({
					fn: 'setCharThumb',
					data: this.buffer.current.toDataURL()
				});
			}.bind(this)
		});
    },

	drawChar: function() {
		this.buffer.current = new Asset.image(
			this.client.options.rootDir + 'public/fr/jeu/chars/thumb/' + this.id + '.png?' + this.refreshDate(), {
			onload: function() {
				var dir = 'down';
				if ($('charLayer_' + this.id).retrieve('direction'))
					dir = $('charLayer_' + this.id).retrieve('direction');

				this.ctx.clearRect(0, 0, 32, 48);

				if (dir == 'left')
					this.ctx.drawImage(this.buffer.current, 96, 48, 32, 48, 0, 0, 32, 48);
				else if (dir == 'right')
					this.ctx.drawImage(this.buffer.current, 32, 96, 32, 48, 0, 0, 32, 48);
				else if (dir == 'up')
					this.ctx.drawImage(this.buffer.current, 96, 144, 32, 48, 0, 0, 32, 48);
				else if (dir == 'down')
					this.ctx.drawImage(this.buffer.current, 96, 0, 32, 48, 0, 0, 32, 48);
			}.bind(this)
		});
	},

	isCurrentPlayer: function() {
		return this.id == this.client.options.char_id;
	}
});