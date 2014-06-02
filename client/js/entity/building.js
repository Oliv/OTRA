var Building = new Class({
    Extends: Item,

    initialize: function(id, data) {
        this.directory = 'batiments';

        data.x = data.position * 32;

        data.onEnter = function(o, pos) {
            OTRA.info.set(o.referer.get('nom'));
        }
        data.onLeave = function(o) {
            OTRA.info.remove();
        }

        this.parent(id, data, 'b');

        this.addObserver('ui', new Ui(this));
    },

    show: function() {
        if (this.animations.building === undefined) {
            OTRA.buffer.path(OTRA.client.path + 'img/' + this.directory + '/');

            OTRA.buffer.set(this.directory, this.get('tile'), function(image) {
                var anim = new AnimationStatic(OTRA.animation, {
                    image: image,
                    start: { x: this.get('x') || 0, y: this.get('y') || 0 },
                    cases: { x: 1, y: 1 },
                    layer: -2,
                    onLoad: function() {
                        this.y = OTRA.client.size.top * OTRA.client.size.square - this.getFrameSize().y;

                        this.show();
                    },
                    onClicked: this.get('onClicked') || null,
                    onEnter: this.get('onEnter') || null,
                    onLeave: this.get('onLeave') || null
                }, this);

                this.animations.building = OTRA.animation.add(anim);
                this.notify('EVENT_ENTITY_BUILT');
            }.bind(this));
        }

        return this;
    },

    /**
     * Construit
     *
     **/
    build: function(chantier) {
        this.set('chantier', chantier);

        this.notify('EVENT_ENTITY_BUILT');
    }
});