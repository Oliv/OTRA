var Character = new Class({
    Extends: Entity,

    type: null,
    directory: null,

    initialize: function(id, data) {
        this.parent(id, data);

        this.addObserver('ui', new Ui(this));

        return this;
    },

    /**
     * Show Character
     *
     **/
    show: function() {
        if (this.animations.character === undefined) {
            var buffer = OTRA.buffer,
                animation = OTRA.animation,
                client = OTRA.client;

            //TODO this.directory en this.ENTITY_DIRECTORY
            buffer.path(client.path + 'img/' + this.directory + '/');
            buffer.set(this.directory, this.get('tile'), function(image) {
                var a = new AnimationAnimated(animation, {
                    image: image,
                    start: { x: this.get('x') || 0, y: this.get('y') || 0 },
                    cases: { x: 4, y: 4 },
                    offset: { x: 0, y: client.size.top * client.size.square },
                    step: 100,
                    line: 2,
                    autorun: this.get('autorun') || false,
                    onLoad: function() {
                        this.x = this.x - this.width / this.options.cases.x / 2;
                        this.y = this.y - this.height / this.options.cases.y;

                        this.show();
                    },
                    onClicked: this.get('onClicked') || null,
                    onEnter: this.get('onEnter') || null,
                    onLeave: this.get('onLeave') || null
                }, this);

                this.animations.character = animation.add(a);
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

    /**
     * Déplace un perso vers les coordonnées
     *
     **/
    move: function(pos, v) {
        var client = OTRA.client,
            a = this.animations.character;

        // Sens du personnage
        var dx = pos.x - (a.x + a.getCenter().x) / client.size.square,
            dy = pos.y - (a.y + a.getCenter().y) / client.size.square;

        if (dx < 0 && Math.abs(dx) > Math.abs(dy)) {
            a.options.line = a.MOVE_LEFT;
        } else if (dx > 0 && Math.abs(dx) > Math.abs(dy)) {
            a.options.line = a.MOVE_RIGHT;
        } else if (dy < 0 && Math.abs(dx) < Math.abs(dy)) {
            a.options.line = a.MOVE_TOP;
        } else {
            a.options.line = a.MOVE_BOTTOM;
        }

        a.options.step = 400 / v;

        var x = pos.x * client.size.square - a.x - a.getCenter().x,
            y = pos.y * client.size.square - a.y - a.getFrameSize().y,
            d = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
            cps = 1000 / (v || 4),
            ms = d / client.size.square * cps;

        a.timeLeft = ms;
        a.pxLeft = { x: x, y: y, d: d };

        a.options.onBeforeDraw = function() {
            if (this.timeLeft > 0) {
                var d = this.pxLeft.d / this.timeLeft * this.manager.time.delta,
                    x = this.pxLeft.x / this.timeLeft * this.manager.time.delta,
                    y = this.pxLeft.y / this.timeLeft * this.manager.time.delta;

                this.x += x;
                this.y += y;
                this.timeLeft -= this.manager.time.delta;
                this.pxLeft.x -= x;
                this.pxLeft.y -= y;
                this.pxLeft.d -= d;
            }
        }

        a.start();
    },

    /**
     * Stop déplacement
     *
     **/
    stop: function(pos) {
        var client = OTRA.client,
            a = this.animations.character;

        a.stop();
        a.options.onBeforeDraw = function() {};
        a.x = pos.x * client.size.square - a.getCenter().x;
        a.y = pos.y * client.size.square - a.getFrameSize().y;

        a.timeLeft = 0;
        a.pxLeft = { x: 0, y: 0, d: 0 };
    },

    /**
     * Subit des dégats
     *
     **/
    damage: function(data) {
        this.set('pv', data.parametres.pv);

        this.notify('EVENT_ENTITY_DAMAGED');

        return this;
    },

    parry: function() {
        this.notify('EVENT_ENTITY_PARRY');

        return this;
    },

    dodge: function() {
        this.notify('EVENT_ENTITY_DODGE');

        return this;
    },

    /**
     * Subit des dégats
     *
     **/
    heal: function(data) {
        this.set('pv', data.parametres.pv);

        this.notify('EVENT_ENTITY_HEALED');

        return this;
    },

    /**
     * Subit des dégats
     *
     **/
    say: function(data) {
        this.notify('EVENT_ENTITY_SPEAKS');

        return this;
    },

    /**
     * Affiche la barre de vie
     *
     **/
    lifebar: function() {
        if (this.get('pv') < this.get('pvMax')) {
            if (this.animations.lifebar === undefined) {
                var animation = OTRA.animation;

                var canvas = new Element('canvas', {
                        width: OTRA.client.size.square,
                        height: 4
                    }),
                    ctx = canvas.getContext('2d');

                ctx.fillStyle = 'rgba(255, 255, 255, .7)';
                ctx.strokeStyle = 'rgba(0, 0, 0, .7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'rgba(255, 0, 0, .7)';
                ctx.fillRect(0, 1, canvas.width/this.get('pvMax')*this.get('pv'), canvas.height - 2);

                this.animations.lifebar = new AnimationCanvas(animation, {
                    canvas: canvas,
                    start: {
                        x: this.animations.character.x - (canvas.width - this.animations.character.width / this.animations.character.options.cases.x) / 2,
                        y: this.animations.character.y - canvas.height - 2
                    },
                    offset: { x: 0, y: OTRA.client.size.top * OTRA.client.size.square },
                    layer: 1,
                    onLoad: function() {
                        this.show()
                    },
                    onBeforeDraw: function() {
                        this.x = this.referer.animations.character.x - (canvas.width - this.referer.animations.character.width / this.referer.animations.character.options.cases.x) / 2
                        this.y = this.referer.animations.character.y - canvas.height - 2
                    }
                }, this);

                animation.add(this.animations.lifebar);
            } else {
                var canvas = this.animations.lifebar.options.canvas;
                var ctx = canvas.getContext('2d');

                ctx.fillStyle = 'rgba(255, 255, 255, .7)';
                ctx.strokeStyle = 'rgba(0, 0, 0, .7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'rgba(255, 0, 0, .7)';
                ctx.fillRect(0, 1, canvas.width/this.get('pvMax')*this.get('pv'), canvas.height - 2);
            }
        } else if (this.animations.lifebar !== undefined) {
            animation.remove(this.animations.lifebar);
        }

        return this;
    }
});