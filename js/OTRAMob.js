var OTRAMob = new Class({
	Extends: OTRACharacter,

	ctx: null,

	buffer: {
		current: null
	},

	initialize: function(id, data) {
		this.parent(id, data, 'mob');
    },

	show: function() {
		this.parent();

		if (!$('mobInfosHP_' + this.id)) {
			$('mobInfosLayer_' + this.id).adopt([
				new Element('div', {
					'id'	: 'mobInfosHP_' + this.id,
					'class'	: 'MobInfosHP'
				}).adopt(
					new Element('div', {
						'id'	: 'inMobInfosHP_' + this.id,
						'class' : 'InMobInfosHP'
					})
				),
				new Element('div', {
					'id'	: 'mobInfosSP_' + this.id,
					'class'	: 'MobInfosSP'
				}).adopt(
					new Element('div', {
						'id'	: 'inMobInfosSP_' + this.id,
						'class' : 'InMobInfosSP'
					})
				)
			]);
		}
	},

    onContextLoaded: function() {
		this.buffer.current = new Asset.image(
			this.client.options.rootDir + 'public/fr/jeu/mobs/' + this.data.file + '.png?' + this.refreshDate()
		, {
			onload: function() {
				this.ctx.clearRect(0, 0, 32, 48);
				this.ctx.drawImage(this.buffer.current, 0, 0, 32, 48, 0, 0, 32, 48);
			}.bind(this)
		});
    }
});