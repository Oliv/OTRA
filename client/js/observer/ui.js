var Ui = new Class({
    Extends: Observer,

    COLOR_NEGATIVE: 'rgba(255, 0, 0, 1)',
    COLOR_POSITIVE: 'rgba(0, 200, 0, 1)',
    COLOR_NEUTRAL: 'rgba(50, 50, 50, 1)',

    notify: function (entity, event) {
        switch (event) {
            case 'EVENT_ENTITY_DAMAGED':
            case 'EVENT_ENTITY_HEALED':
                this.changeHp(entity);
                break;
            case 'EVENT_ENTITY_PARRY':
                this.textOverEntity(entity, 'Parade !');
                break;
            case 'EVENT_ENTITY_DODGE':
                this.textOverEntity(entity, 'Esquive !');
                break;
            case 'EVENT_ENTITY_SPEAKS':
                var last = OTRA.chat.messages.slice(-1).pop();
                this.textBubbleOverEntity(entity, last ? last.message : null);
                break;
            case 'EVENT_ENTITY_BUILT':
                this.buildbar(entity);
                break;
        }

        this.update(entity);
    },

    changeHp: function (entity) {
        var delta = this._data['pv'] - entity.get('pv');
        this.textOverEntity(entity, delta, this._data['pv'] < entity.get('pv') ? this.COLOR_POSITIVE : this.COLOR_NEGATIVE);
    },

    /**
     * Affiche un message de dégats
     *
     **/
    textOverEntity: function (entity, text, color) {
        var animation = OTRA.animation,
            client = OTRA.client;

        var canvas = new Element('canvas', {
                width: 100,
                height: 12
            }),
            ctx = canvas.getContext('2d'),
            margin = 10;

        ctx.fillStyle = color ? color : this.COLOR_NEUTRAL;
        ctx.textAlign = 'center';
        ctx.font = "bold 11px Arial";
        ctx.fillText(text, canvas.width / 2, margin, canvas.width - margin);

        animation.add(new AnimationCanvas(animation, {
            canvas: canvas,
            start: {
                x: entity.animations.character.x - (canvas.width - entity.animations.character.getFrameSize().x) / 2,
                y: entity.animations.character.y - canvas.height - 10
            },
            offset: { x: 0, y: client.size.top * client.size.square },
            layer: 2,
            onLoad: function () {
                this.show();

                this.buffer.i = 0;

                setTimeout(function () {
                    this.manager.remove(this);
                }.bind(this), 1000);
            },
            onBeforeDraw: function () {
                this.buffer.i++;
                this.x = this.referer.animations.character.x - (canvas.width - this.referer.animations.character.getFrameSize().x) / 2;
                this.y = this.referer.animations.character.y - canvas.height - 10 - this.buffer.i / 2;
            }
        }, entity));

        return this;
    },

    textBubbleOverEntity: function (entity, text) {
        var animation = OTRA.animation,
            client = OTRA.client;

        if (entity.animations.bubble !== undefined) {
            if (entity.animations.bubble.buffer.timer) {
                clearTimeout(entity.animations.bubble.buffer.timer);
                delete entity.animations.bubble.buffer.timer
            }
            animation.remove(entity.animations.bubble);
        }

        var canvas = new Element('canvas', {
                width: 128, // max width
                height: 50, // max height
            }),
            ctx = canvas.getContext('2d'),
            words = text.split(' '),
            line = '',
            lines = [],
            lineHeight = 15,
            margin = 10,
            x = 64,
            y = 15;

        for (var i = 0, l = words.length; i < l; i++) {
            var testLine = line + words[i] + ' ',
                metrics = ctx.measureText(testLine),
                testWidth = metrics.width;

            if (testWidth > canvas.width - margin * 2 && i > 0) {
                lines.push(line)
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        if (lines.length === 1) {
            canvas.set('width', testWidth + margin);
            x = canvas.get('width') / 2;
        }

        canvas.set('height', lines.length * lineHeight + margin);

        var roundedRect = function (ctx, x, y, width, height, radius) {
            ctx.fillStyle = 'rgba(255, 255, 255, .7)';
            ctx.beginPath();
            ctx.moveTo(x, y+radius);
            ctx.lineTo(x, y+height-radius);
            ctx.quadraticCurveTo(x, y+height, x+radius, y+height);
            ctx.lineTo(x+width-radius, y+height);
            ctx.quadraticCurveTo(x+width, y+height, x+width, y+height-radius);
            ctx.lineTo(x+width, y+radius);
            ctx.quadraticCurveTo(x+width, y, x+width-radius, y);
            ctx.lineTo(x+radius, y);
            ctx.quadraticCurveTo(x, y, x, y+radius);
            ctx.fill();
        }

        roundedRect(ctx, 0, 0, canvas.width, canvas.height, 4);

        ctx.fillStyle = 'rgba(0, 0, 0, .7)';
        ctx.textAlign = 'center';
        ctx.font = "11px Arial";
        for (var i = 0, l = lines.length; i < l; i++) {
            ctx.fillText(lines[i], x, y * (i + 1));
        }

        var anim = new AnimationCanvas(animation, {
            canvas: canvas,
            start: {
                x: entity.animations.character.x - (canvas.width - entity.animations.character.width / entity.animations.character.options.cases.x) / 2,
                y: entity.animations.character.y - canvas.height - 10
            },
            offset: { x: 0, y: client.size.top * client.size.square },
            layer: 1,
            onLoad: function () {
                this.show()

                this.buffer.timer = setTimeout(function () {
                    delete this.buffer.timer;
                    this.manager.remove(this);
                }.bind(this), 5000);

            },
            onBeforeDraw: function () {
                this.x = this.referer.animations.character.x - (canvas.width - this.referer.animations.character.width / this.referer.animations.character.options.cases.x) / 2;
                this.y = this.referer.animations.character.y - canvas.height - 10;
            }
        }, entity);

        entity.animations.bubble = animation.add(anim);

        return this;
    },

    buildbar: function(entity) {
        var animation = OTRA.animation,
            total = 0,
            current = 0,
            hp = 0,
            done = true,
            color = 'rgba(255, 0, 0, .7)',
            chantier = entity.get('chantier');

        if (chantier) {
            for (var i in chantier) {
                total += +chantier[i].total;
                current += +chantier[i].construit;
                hp += +chantier[i].pv;

                if (chantier[i].construit < chantier[i].total) {
                    done = false;
                    color = 'rgba(120, 120, 120, .7)';
                }
            }

            if (done) {
                current = hp;
            }

            if (entity.animations.buildbar === undefined) {
                var canvas = new Element('canvas', {
                    width: entity.animations.building.width - 20,
                    height: 4
                });

                var ctx = canvas.getContext('2d');

                ctx.fillStyle = 'rgba(255, 255, 255, .7)';
                ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = color;
                ctx.fillRect(1, 1, canvas.width * current / total, canvas.height - 2);

                var anim = new AnimationCanvas(animation, {
                    canvas: canvas,
                    start: {
                        x: entity.get('x') + 10,
                        y: OTRA.client.size.top * OTRA.client.size.square
                    },
                    layer: -1,
                    onLoad: function() {
                        this.show()
                    }
                });

                entity.animations.buildbar = animation.add(anim);
            } else {
                var canvas = entity.animations.buildbar.options.canvas;
                var ctx = canvas.getContext('2d');

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'rgba(255, 255, 255, .7)';
                ctx.strokeStyle = 'rgba(0, 0, 0, .7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = color;
                ctx.fillRect(0, 1, canvas.width * current / total, canvas.height - 2);
            }
        }

        return this;
    }
});