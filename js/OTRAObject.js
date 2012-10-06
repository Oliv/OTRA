var OTRAObject = new Class({
	client: {},
	
	id: null,
    position: { x: null, y: null },
	data: {},
	date: null,
	
    effects: {},
    timers: {},
	
	initialize: function(id, data) {
		if (id) this.id = id;
		if (data) this.data = data;
		
		this.client = Client;
    },
	
	get: function(prop) {
		if (this.data[prop] !== undefined) return this.data[prop];
		return null;
	},
	
	set: function(prop, val) {
		if (this.data[prop] !== undefined) this.data[prop] = val;
		return this;
	},
	
	refreshDate: function() {
		return this.date = +new Date();
	},
	
	/**
	 * Object has position in the screen ?
	 *
	 **/
	hasPosition: function() {
		return this.data.x !== undefined && this.data.y !== undefined;
	},
	
	/**
	 * Absolute Coordonnates in pixels
	 *
	 **/
	getPosition: function(data) {
		if (data === undefined) data = { x: this.data.x, y: this.data.y };

		if (this.hasPosition())
			return {
				x: $('mapLayer').getPosition().x + (data.x % this.client.window.width) * 32,
				y: $('mapLayer').getPosition().y + data.y * 32 - 16
			}
		else return false;
	},
	
	/**
	 * Cases coordonnates, multi screen
	 *
	 **/
	getAbsolutePosition: function() {
		if (this.hasPosition())
			return {
				x: this.data.x,
				y: this.data.y
			}
		else return false;
	},
	
	/**
	 * Cases coordonnates in current screen
	 *
	 **/
	getRelativePosition: function() {
		if (this.hasPosition())
			return {
				x: this.data.x % this.client.window.width,
				y: this.data.y
			}
		else return false;
	},

    /**
	 * Reset an animation
	 *
	 **/
    stopAnimation: function(type) {
        if (this.effects[type]) this.effects[type].cancel();
		if (this.timers[type]) clearInterval(this.timers[type]);
		
		return this;
    }
});