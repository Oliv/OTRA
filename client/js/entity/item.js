var Item = new Class({
	Extends: Entity,

    directory: null,

	initialize: function(id, data) {
        this.parent(id, data);
		return this;
    },

	/**
	 * Show Character
	 *
	 **/
	show: function() {
        if (this.animations.item === undefined) {
            var client = OTRA.client,
                buffer = OTRA.buffer,
                animation = OTRA.animation;

            buffer.path(client.path + 'img/' + this.directory + '/');

            buffer.set(this.directory, this.get('tile'), function(image) {
                var anim = new AnimationStatic(animation, {
                    image: buffer.get(this.directory, this.get('tile')),
                    start: { x: this.get('x') || 0, y: this.get('y') || 0 },
                    cases: { x: 1, y: 1 },
                    offset: { x: 0, y: client.size.top * 32 },
                    layer: -1,
                    onLoad: function() {
                        this.x = this.x - this.width / this.options.cases.x / 2;
                        this.y = this.y - this.height / this.options.cases.y;

                        this.show();
                    },
                    onClicked: this.get('onClicked') || null,
                    onEnter: this.get('onEnter') || null,
                    onLeave: this.get('onLeave') || null
                }, this);

                this.animations.item = animation.add(anim);
            }.bind(this));
        }

		return this;
	},

	/**
	 * Remove Character and all animations
	 *
	 **/
	remove: function() {
        OTRA.animation.remove(this);
	},

    lifebar: function() {}
});