var Client = new Class({
    Implements: [Options],

    options: {
        webSocket: null,
        token: null
    },

    players: {},
    idPlayer: null,

    path: '/',

    entities: [],
    background: null,

    map: null,

    chat: null,

    select: null,

    ctx: [],

    tips: null,

    events: [],

    size: {
        square: 32,
        top: 4,
        x: 32,
        y: 11
    },

    ratio: 1,

    initialize: function(options) {
        // Intègre les options
        this.setOptions(options);

        // path
        var pathArray = window.location.pathname.split('/');
        for (var i = 1; i < pathArray.length - 1; i++) {
            this.path += pathArray[i] + '/';
        }

        // Rendering
        var canvas = new Element('canvas', {
            width: this.size.x * this.size.square,
            height: (this.size.y + this.size.top) * this.size.square,
            id: 'container'
        }).inject(document.id('game'))

        var animation = new AnimationManager('container');
        var buffer = new Buffer();
        OTRA.animation = animation;
        OTRA.buffer = buffer;

        window.addEvent('resize', function() {//TODO ajouter l'observer ? ou déléguer
            var ratio = document.id('game').getSize().x / canvas.width;
            ratio = ratio < 1 ? ratio : 1;

            if (animation) this.ratio = animation.ratio = ratio

            //document.id('guibox').setStyle('height', window.getSize().y)
            document.id('chatbox').setStyle('height', window.getSize().y - document.id('game').getSize().y)
            document.id('infobox').setStyle('height', window.getSize().y - document.id('game').getSize().y)
            document.id('guibox').setStyle('height', window.getSize().y)
        }.bind(this));

        buffer.path(this.path + 'img/bg/');
        buffer.set('bg', [
                'boue.jpg',
                'eau.jpg',
                'foret.jpg',
                'herbe.jpg',
                'jungle.jpg',
                'marais.jpg',
                'pierre.jpg',
                'sable.jpg',
                'sapins.jpg',
                'terre.jpg'
            ], function() {
                OTRA.websocket = new MooWebSocket(this.options.webSocket, {
                    logging: false,
                    json: true,
                    events: {
                        onOpen: function() {
                            // Chargement du perso et des configs de base
                            OTRA.websocket.send({ action: 'connexion', parametres: {
                                token: this.options.token
                            }});

                            OTRA.chat = new Chat(OTRA.websocket, this);
                            OTRA.info = new Info(this);
                            OTRA.inventory = new Inventory(OTRA.websocket, this);

                            window.fireEvent('resize');
                        }.bind(this),
                        onMessage: function(e) { this.dispatchMessage(JSON.parse(e.data)); }.bind(this)
                    }
                });
            }.bind(this)
        );
    },

    dispatchMessage: function(data) {
        /*if ((data.action == 'listeBatiments' || data.action == 'construit') && data.objet == 'j3')*/ console.info('Received from server : ', data);

        // Actions
        if (data.action != undefined && typeof OTRA.client[data.action] === 'function') {
            OTRA.client[data.action].attempt(data, OTRA.client);
        }
    },

    addEntity: function(id, data) {
        if (this.entities[id] === undefined) {
            var type = id.substr(0, 1)

            if (data.x) data.x = data.x * this.size.square
            if (data.y) data.y = data.y * this.size.square

            var ObjectFactory = {
                test: function(v) {
                    return ObjectFactory[v] !== undefined && typeof ObjectFactory[v] === 'function' ? ObjectFactory[v].call(this, v) : false
                }.bind(this),
                j: function(v) {
                    this.entities[id] = new Player(id, data || {})

                    if (!this.entities[id].isPlayer()) {
                        this.entities[id].show()
                    }
                },
                m: function(v) {
                    this.entities[id] = new Mob(id, data || {}).show()
                },
                b: function(v) {
                    this.entities[id] = new Building(id, data || {}).show()
                },
                c: function(v) {
                    this.entities[id] = new Chest(id, data || {}).show()
                }
            }
            ObjectFactory.test(type)
        }

        return this.entities[id]
    },

    connexionOk: function(data) {
        this.idPlayer = data.objet;
        OTRA.observers.ui = new Ui();
    },

    infosCarte: function(data) {
        if (data.parametres.bg) {
            if (this.background)
                OTRA.animation.remove(this.background);

            var canvas = new Element('canvas', {
                width: this.size.x * this.size.square,
                height: (this.size.y + this.size.top) * this.size.square
            });
            var ctx = canvas.getContext('2d');

            var cases = [];
            for (var y = 0; y < this.size.top; y++) {
                for (var x = 0; x < data.parametres.bgtop.length; x++) {
                    var c = data.parametres.bgtop[x],
                        image = OTRA.buffer.get('bg', c.type + '.jpg');

                    if (!cases[y]) cases[y] = [];
                    cases[y][c.x] = c;

                    if (image) {
                        ctx.drawImage(image,
                            0,
                            0,
                            this.size.square,
                            this.size.square,
                            c.x * this.size.square,
                            y * this.size.square,
                            this.size.square,
                            this.size.square
                        );
                    }
                }
            }

            for (var i = 0; i < data.parametres.bg.length; i++) {
                var c = data.parametres.bg[i],
                    image = OTRA.buffer.get('bg', c.type + '.jpg');

                if (!cases[c.y + this.size.top]) cases[c.y + this.size.top] = [];
                cases[c.y + this.size.top][c.x] = c;

                if (image) {
                    ctx.drawImage(image,
                        0,
                        0,
                        this.size.square,
                        this.size.square,
                        c.x * this.size.square,
                        (c.y + this.size.top) * this.size.square,
                        this.size.square,
                        this.size.square
                    );
                }
            }

            this.background = new AnimationCanvas(OTRA.animation, {
                canvas: canvas,
                start: { x: 0, y: 0 },
                layer: -3,
                onLoad: function() { this.show() },
                onClicked: function(o, pos) {
                    var y = pos.y / this.size.square - this.size.top,
                        click = {
                            x: pos.x / this.size.square,
                            y: y > 0 ? y : 0
                        };

                    OTRA.websocket.send({ action: 'deplace', parametres: click });

                    if (y < 0) {
                        OTRA.websocket.send({ action: 'construction', parametres: { position: Math.floor(click.x) }});
                    }
                }.bind(this)
            });

            OTRA.animation.add(this.background);

            this.renderCarte(canvas, cases);
        }

        if (data.parametres.presences) {
            for (var i = 0; i < data.parametres.presences.length; i++) {
                this.addEntity(data.parametres.presences[i].id, data.parametres.presences[i].parametres)/*.show().lifebar()*/;
            }
        }
    },

    renderCarte: function(canvas, cases) {
        var ctx = canvas.getContext('2d'),
            time = +new Date,
            types = ['terre', 'herbe', 'pierre', 'eau', 'vide'],
            interactions = ['0001', '0010', '0011', '0100', '0101', '0110', '0111', '1000', '1001', '1010', '1011', '1100', '1101', '1110', '1111'],
            urlImages = [];

        for (var i = 0, l = types.length; i < l; i++) {
            for (var j = 0, m = interactions.length; j < m; j++) {
                urlImages.push(types[i] + interactions[j] + '.png');
            }
        }

        OTRA.buffer.path(this.path + 'img/bg/transitions/');
        OTRA.buffer.set('transitions', urlImages, function() {
            var casesToRedraw = {};
            for (var y = 0, l = cases.length; y < l; y++) {
                for (var x = 0, l2 = cases[y].length; x < l2; x++) {
                    var typesCases = {};

                    if (cases[y - 1] && cases[y - 1][x - 1]) {
                        if (!typesCases[cases[y - 1][x - 1].type]) {
                            typesCases[cases[y - 1][x - 1].type] = [0,0,0,0];
                        }
                        typesCases[cases[y - 1][x - 1].type][0] = 1;
                    }
                    if (cases[y] && cases[y][x - 1]) {
                        if (!typesCases[cases[y][x - 1].type]) {
                            typesCases[cases[y][x - 1].type] = [0,0,0,0];
                        }
                        typesCases[cases[y][x - 1].type][2] = 1;
                    }
                    if (cases[y - 1] && cases[y - 1][x]) {
                        if (!typesCases[cases[y - 1][x].type]) {
                            typesCases[cases[y - 1][x].type] = [0,0,0,0];
                        }
                        typesCases[cases[y - 1][x].type][1] = 1;
                    }
                    if (cases[y] && cases[y][x]) {
                        if (!typesCases[cases[y][x].type]) {
                            typesCases[cases[y][x].type] = [0,0,0,0];
                        }
                        typesCases[cases[y][x].type][3] = 1;
                    }

                    for (var i = 0, l3 = types.length; i < l3; i ++) {
                        if (casesToRedraw[types[i]] === undefined)
                            casesToRedraw[types[i]] = [];

                        if (casesToRedraw[types[i]][y] === undefined)
                            casesToRedraw[types[i]][y] = [];

                        if (casesToRedraw[types[i]][y][x] === undefined)
                            casesToRedraw[types[i]][y][x] = null;

                        if (typesCases[types[i]])
                            casesToRedraw[types[i]][y][x] = typesCases[types[i]];
                    }
                }
            }

            for (var i = 0, l = types.length; i < l; i ++) {
                var type = types[i];
                for (var y = 0, l2 = casesToRedraw[type].length; y < l2; y++) {
                    for (var x = 0, l3 = casesToRedraw[type][y].length; x < l3; x++) {
                        if (casesToRedraw[type][y][x] && casesToRedraw[type][y][x].join("") != '1111') {
                            var image = OTRA.buffer.get('transitions', type + casesToRedraw[type][y][x].join("") + '.png');

                            if (image) {
                                ctx.drawImage(image,
                                    0,
                                    0,
                                    this.size.square,
                                    this.size.square,
                                    x * this.size.square - (this.size.square / 2),
                                    (y) * this.size.square - (this.size.square / 2),
                                    this.size.square,
                                    this.size.square
                                );
                            }
                        }
                    }
                }
            }
        }.bind(this));
    },

    arriveCarte: function(data) {
        var c = this.addEntity(data.parametres.id, data.parametres.parametres);

        c.show();
        c.lifebar();

        if (data.objet === this.idPlayer) {
            OTRA.inventory.setHP(c.get('pvMax'), c.get('pv'));
            OTRA.inventory.set('nom', c.get('nom'));
        }
    },

    quitteCarte: function(data) {
        if (data.objet === this.idPlayer) {
            OTRA.animation.empty();

            this.entities.each(function(o, i) {
                o.remove();
            });
            this.entities = [];

            OTRA.inventory.removeWindows();
        } else {
            this.entities[data.objet].remove();
            delete this.entities[data.objet];
        }
    },

    aDestination: function(data) {
        this.entities[data.objet].stop(data.parametres.destination);
    },

    deplace: function(data) {
        this.entities[data.objet].move(data.parametres.destination, data.parametres.vitesse);

        OTRA.inventory.removeWindows();
    },

    blesse: function(data) {
        if (data.objet === this.idPlayer)
            OTRA.inventory.setHP(data.parametres.pvMax, data.parametres.pv);

        this.entities[data.objet].damage(data).lifebar();
    },

    soigne: function(data) {
        if (data.objet === this.idPlayer)
            OTRA.inventory.setHP(data.parametres.pvMax, data.parametres.pv);

        this.entities[data.objet].heal(data).lifebar();
    },

    stats: function(data) {
        for (var i in data.parametres.statsInit) {
            this.entities[data.objet].set(i, data.parametres.statsInit[i]);

            if (data.objet === this.idPlayer)
                OTRA.inventory.setStat(i, data.parametres.statsInit[i]);
        }
        for (var i in data.parametres.statsCalc) {
            this.entities[data.objet].set(i, data.parametres.statsCalc[i]);

            if (data.objet === this.idPlayer)
                OTRA.inventory.setStat(i, data.parametres.statsCalc[i]);
        }

        if (data.parametres.pvMax && data.parametres.pv)
            OTRA.inventory.setHP(data.parametres.pvMax, data.parametres.pv);
    },

    parade: function(data) {
        this.entities[data.objet].parry(data.parametres);
    },

    esquive: function(data) {
        this.entities[data.objet].dodge(data.parametres);
    },

    stoppeDeplacement: function(data) {
        this.entities[data.objet].stop(data.parametres.destination);
    },

    parle: function(data) {
        var chat = OTRA.chat,
            message = { type: 'message', name: this.entities[data.objet].get('nom'), message: data.parametres }

        chat.messages.push(message);
        chat.write(message);

        this.entities[data.objet].say(data.parametres);
    },

    inventaire: function(data) {
        if (data.objet === this.idPlayer) {
            if (data.parametres.equipement !== false) {
                for (var i in data.parametres.equipement) {
                    if (data.parametres.equipement[i])
                        OTRA.inventory.addItem(i, data.parametres.equipement[i], 'equipement');
                    else
                        OTRA.inventory.removeItem(i);
                }
            }
            if (data.parametres.inventaire !== false) {
                for (var i in data.parametres.inventaire) {
                    if (data.parametres.inventaire[i])
                        OTRA.inventory.addItem(i, data.parametres.inventaire[i], 'inventaire');
                    else
                        OTRA.inventory.removeItem(i);
                }
            }
            if (data.parametres.coffre !== false) {
                OTRA.inventory.openChest();
                for (var i in data.parametres.coffre) {
                    if (data.parametres.coffre[i])
                        OTRA.inventory.addItem(i, data.parametres.coffre[i], 'coffre');
                    else
                        OTRA.inventory.removeItem(i, 'coffre');
                }
            } else {
                OTRA.inventory.closeChest();
            }
        }

        OTRA.inventory.setCursor(data.parametres.objetEnMain ? this.path + 'img/equips/' + data.parametres.objetEnMain.tile : null)
    },

    crafts: function(data) {
        if (data.objet === this.idPlayer) {
            OTRA.inventory.setCraft(data.parametres);
        }
    },

    coolDownOn: function(data) {
        if (data.objet === this.idPlayer) {
            OTRA.inventory.setCooldown(data.parametres.compe, data.parametres.ms);
        }
    },

    debutChargement: function(data) {
        this.coolDownOn(data);
    },

    coolDownOff: function(data) {
        if (data.objet === this.idPlayer) {
            OTRA.inventory.resetCooldown();
        }
    },

    annuleAction: function(data) {
        this.coolDownOff(data);
    },

    finChargement: function(data) {
        this.coolDownOff(data);
    },

    construit: function(data) {
        this.entities[data.objet].build(data.parametres.parametres.chantier || null);
    },

    listeBatiments: function(data) {
        if (data.parametres && data.parametres.liste.length) {
            OTRA.inventory.listeBatiments(data.parametres.position, data.parametres.liste);
        }
    }
});