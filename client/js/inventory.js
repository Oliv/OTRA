// TODO A cleaner -> voir angular

var Inventory = new Class({
    timeouts: {},

    windows: [],

    clicked: null,

    initialize: function() {
        // Build html structure
        var container = document.id('guibox') || new Element('div', {
            id: 'guibox'
        }).inject ($(document.body), 'top')

        container.adopt(
            new Element('div', {
                'id': 'charStat_nom',
                'class': 'row name'
            }),
            new Element('div', {
                'id': 'charInfosHP'
            }).adopt(
                new Element('div', {
                    'id': 'inCharInfosHP'
                })
            ),
            new Element('div', {
                'id': 'charInfosCooldown'
            }).adopt(
                new Element('div', {
                    'id': 'inCharInfosCooldown'
                })
            ),
            new Element('div', {
                'class': 'row menu'
            }).adopt(
                new Element('div', {
                    'class': 'col6 item',
                    'id': 'menu_stats',
                    'data-toggle': 'stats',
                    'html':  'Personnage'
                }),
                new Element('div', {
                    'class': 'col6 item',
                    'id': 'menu_inventory',
                    'data-toggle': 'inventory',
                    'html':  'Inventaire'
                })
            ),
            new Element('div', {
                'id': 'stats',
                'class': 'row'
            }),
            new Element('div', {
                'id': 'inventory',
                'class': 'row'
            }).adopt(
                new Element('div', {
                    'id': 'craft',
                    'class': 'row'
                }),
                new Element('div', {
                    'id': 'inventory_char',
                    'class': 'row'
                }),
                new Element('div', {
                    'id': 'inventory_chest',
                    'class': 'row'
                })
            )
        )

        var inv = ['tete', 'mainG', 'mainD', 'corps', 'ceinture', 'jambes', 'chaussures', 'collier', 'bague1', 'bague2'/*, 'bague3', 'bague4'*/]

        for (var i = 0, l = inv.length; i < l; i++ ) {
            document.id('inventory').adopt(
                new Element('div', {
                    'id': 'inventory_char_' + inv[i],
                    'class': 'slot',
                    'data-pos': inv[i],
                    'data-type': 'equipement',
                    'events': {
                        'click': function(e) {
                            var slot = document.id(e.target)

                            OTRA.websocket.send({ action: 'actionInventaire', parametres:
                                { 'nomInventaire': slot.get('data-type'), 'emplacement': slot.get('data-pos') }
                            })
                        }.bind(this)
                    }
                })
            )
        }

        for (var i = 0; i < 32; i++) {
            document.id('inventory_char').adopt(
                new Element('div', {
                    'id': 'inventory_char_' + i,
                    'class': 'slot',
                    'data-pos': i,
                    'data-type': 'inventaire',
                    'events': {
                        'click': function(e) {
                            var slot = document.id(e.target)

                            OTRA.websocket.send({ action: 'actionInventaire', parametres:
                                { 'nomInventaire': slot.get('data-type'), 'emplacement': slot.get('data-pos') }
                            })
                        }.bind(this)
                    }
                })
            )
        }

        for (var i = 0; i < 8; i++) {
            document.id('inventory_chest').adopt(
                new Element('div', {
                    'id': 'inventory_chest_' + i,
                    'class': 'slot',
                    'data-pos': i,
                    'data-type': 'coffre',
                    'events': {
                        'click': function(e) {
                            var slot = document.id(e.target)

                            OTRA.websocket.send({ action: 'actionInventaire', parametres:
                                { 'nomInventaire': slot.get('data-type'), 'emplacement': slot.get('data-pos') }
                            })
                        }.bind(this)
                    }
                })
            )
        }
        document.id('inventory').adopt(
            new Element('div', {
                'id': 'inventory_trash',
                'class': 'slot trash',
                'data-type': 'poubelle',
                'events': {
                    'click': function(e) {
                        var slot = document.id(e.target)

                        OTRA.websocket.send({ action: 'actionInventaire', parametres:
                            { 'nomInventaire': slot.get('data-type'), 'emplacement': 0 }
                        })
                    }.bind(this)
                }
            })
        )

        document.id('inventory').setStyle('display', 'block')
        container.getElements('.menu .item').addEvent('click', function(e) {
            this.tab(document.id(e.target).get('data-toggle'))
        }.bind(this))

        return this
    },

    tab: function(id) {
        document.id('inventory').setStyle('display', 'none')
        document.id('stats').setStyle('display', 'none')
        document.id(id).setStyle('display', 'block')
    },

    setHP: function(hpMax, hp) {
        var newHP = hp / hpMax * 100,
            oldHP = +document.id('inCharInfosHP').getStyle('width').toInt()

        if (newHP !== oldHP) {
            if (newHP > oldHP) {
                document.id('inCharInfosHP').setStyle('background-color', 'green')
                setTimeout(function() { document.id('inCharInfosHP').setStyle('background-color', 'red') }, 300)
            }

            document.id('inCharInfosHP').setStyle('width', newHP + '%')
        }

        return this
    },

    setCooldown: function(type, time) {
        document.id('inCharInfosCooldown').setStyle('transition', 'all ' + time + 'ms linear')
        document.id('inCharInfosCooldown').setStyle('width', '100%')

        return this
    },

    resetCooldown: function() {
        document.id('inCharInfosCooldown').setStyle('transition', 'none')
        document.id('inCharInfosCooldown').setStyle('width', 0)
        return this
    },

    set: function(stat, val) {
        if (document.id('charStat_' + stat)) {
            document.id('charStat_' + stat).set('html', val)
        }

        return this
    },

    setStat: function(stat, val) {
        if (document.id('charStat_' + stat)) {
            document.id('charStat_' + stat).set('html', val)
        } else {
            document.id('stats').adopt(
                new Element('div', { 'class': 'row' }).adopt(
                    new Element('div', {
                        'class': 'col6',
                        'html': stat
                    }),
                    new Element('div', {
                        'id': 'charStat_' + stat,
                        'class': 'col6',
                        'html': val
                    })
                )
            )
        }

        return this
    },

    addItem: function(i, item, type) {
        if (document.id((type === 'coffre' ? 'inventory_chest_' : 'inventory_char_') + i)) {
            OTRA.buffer.path(OTRA.client.path + 'img/equips/');

            OTRA.buffer.set('equips', item.tile, function(image, item, type) {
                image = image.clone();

                image.set({
                    'class': 'item',
                    'title': item.nom,
                    'data-pos': i,
                    'data-type': type,
                    'events': {
                        'click': function(e) {
                            e.stopPropagation()
                            var item = document.id(e.target)

                            if (this.clicked && item.get('data-type') === this.clicked.type && item.get('data-pos') === this.clicked.pos) {
                                image.fireEvent('dblClickCustom', this.clicked)
                                this.clicked = null
                            } else {
                                this.clicked = {
                                    type: item.get('data-type'),
                                    pos: item.get('data-pos')
                                }

                                setTimeout(function() {
                                    if (this.clicked) {
                                        this.clicked = null

                                        OTRA.websocket.send({ action: 'actionInventaire', parametres:
                                            { 'nomInventaire': item.get('data-type'), 'emplacement': item.get('data-pos') }
                                        })
                                    }
                                }.bind(this), 200)
                            }
                        }.bind(this),
                        'dblClickCustom': function(item) {
                            OTRA.websocket.send({ action: 'utilise', parametres:
                                { 'nomInventaire': item.type, 'emplacement': item.pos }
                            })
                        }.bind(this),
                        'mouseenter': function(e) {
                            e.stopPropagation()
                            var item = document.id(e.target).retrieve('item'),
                                html = ''

                            if (item.quantite && item.quantite > 1) {
                                html += 'Quantité : ' + item.quantite + '<br><br>'
                            }
                            if (item.modificateurs) {
                                for (var i in item.modificateurs) {
                                    var mod = item.modificateurs[i]
                                    if (i)  html += i + ' : ' + mod.valeur + '<br>'
                                }
                            }

                            OTRA.info.set(item.nom, html);
                        },
                        'mouseleave': function(e) {
                            e.stopPropagation()

                            OTRA.info.remove();
                        }
                    }
                }).store('item', item);

                this.removeItem(i, type);

                document.id((type === 'coffre' ? 'inventory_chest_' : 'inventory_char_') + i).adopt(image);

                if (item.quantite !== undefined && item.quantite > 1) {
                    document.id((type === 'coffre' ? 'inventory_chest_' : 'inventory_char_') + i).adopt(new Element('div', {
                        'html': item.quantite,
                        'class': 'nb'
                    }));
                }
            }.bind(this), [item, type])
        }

        return this
    },

    removeItem: function(i, type) {
        if (document.id((type === 'coffre' ? 'inventory_chest_' : 'inventory_char_') + i))
            document.id((type === 'coffre' ? 'inventory_chest_' : 'inventory_char_') + i).empty()

        return this
    },

    setCursor: function(src) {
        if (src)
            document.id('guibox').setStyle('cursor', 'url("' + src + '") 16 16, auto')
        else document.id('guibox').setStyle('cursor', 'auto')

        return this
    },

    closeChest: function() {
        document.id('inventory_chest').setStyle('display', 'none')
    },

    openChest: function() {
        document.id('inventory_chest').setStyle('display', 'block')
        this.tab('inventory')
    },

    setCraft: function(data) {
        document.id('craft').empty()

        var count = 0
        for (var i in data) {
            count++

            OTRA.buffer.path(OTRA.client.path + 'img/equips/');

            OTRA.buffer.set('equips', data[i].tile, function(image, item, id) {
                image = image.clone();

                image.set({
                    'class': 'item',
                    'title': item.typeObjet,
                    'data-item': id,
                    'data-type': item.typeObjet,
                    'events': {
                        'click': function(e) {
                            var el = document.id(e.target)

                            OTRA.websocket.send({ action: 'craft', parametres: { recette: el.get('data-item') }})
                        }.bind(this),
                        'mouseenter': function(e) {
                            e.stopPropagation()
                            var el = document.id(e.target).retrieve('item'),
                                html = ''

                            if (!el.possible) {
                                html += 'Craft impossible !<br><br>'
                            }
                            if (el.composants) {
                                for (var k in el.composants) {
                                    var c = el.composants[k]
                                    if (k)  html += k + ' : ' + c.quantite + '<br>'
                                }
                            }

                            OTRA.info.set(el.typeObjet, html);
                        },
                        'mouseleave': function(e) {
                            e.stopPropagation()

                            OTRA.info.remove();
                        }
                    },
                }).store('item', item)

                var slot = new Element('div', {
                    'class': 'slot'
                }).adopt(image)

                document.id('craft').adopt(
                    new Element('div', {
                        'class': 'row' + (!item.possible ? ' disabled' : ''),
                        'id': 'craft_' + id
                    }).adopt(
                        slot,
                        new Element('div', {
                            'class': 'name',
                            'html': item.typeObjet,
                            'data-item': id,
                            'events': {
                                'click': function(e) {
                                    var el = document.id(e.target)

                                    document.id('craft_composant_' + el.get('data-item')).setStyle('display', document.id('craft_composant_' + el.get('data-item')).getStyle('display') === 'none' ? 'block' : 'none');
                                }.bind(this)
                            }
                        }),
                        new Element('div', {
                            'id': 'craft_composant_' + id,
                            'class': 'row components'
                        })
                    )
                )

                if (item.composants) {
                    for (var j in item.composants) {
                        var c = item.composants[j]

                        OTRA.buffer.path(OTRA.client.path + 'img/equips/');

                        OTRA.buffer.set('equips', c.tile, function(image, c, id) {
                            image = image.clone();

                            image.set({
                                'class': 'item',
                                'title': j,
                                'events': {
                                    'mouseenter': function(e) {
                                        var el = document.id(e.target).retrieve('item'),
                                            html = ''

                                        if (el.quantite && el.quantite > 1) {
                                            html += 'Quantité : ' + el.quantite + '<br><br>'
                                        }

                                        OTRA.info.set(el.tile, html);
                                    },
                                    'mouseleave': function(e) {
                                        e.stopPropagation()

                                        OTRA.info.remove();
                                    }
                                }
                            }).store('item', c)

                            var slotCpt = new Element('div', {
                                'class': 'slot'
                            }).adopt(image)

                            if (c.quantite !== undefined && c.quantite > 1) {
                                slotCpt.adopt(new Element('div', {
                                    'html': c.quantite,
                                    'class': 'nb'
                                }))
                            }

                            document.id('craft_composant_' + id).adopt(slotCpt)
                        }.bind(this), [c, id])
                    }
                }
            }.bind(this), [data[i], i])
        }

        if (count) document.id('craft').setStyle('display', 'block')
        else document.id('craft').setStyle('display', 'none')
    },

    listeBatiments: function(position, batiments) {
        var container = new Element('div', {
            'class': 'items buildings'
        });

        for (var i = 0, l = batiments.length; i < l; i++) {
            var b = batiments[i];

            container.adopt(new Element('div', {
                'class': 'item',
                'html': b.nom,
                'data-type': b.typeBatiment,
                'events': {
                    'click': function(e) {
                        OTRA.websocket.send({ action: 'construction', parametres: { position: position, typeBatiment: e.target.get('data-type') }});
                        w.remove();
                    }.bind(this)
                }
            }));
        }

        var size = document.id('container').getPosition(),
            w = this.removeWindow('buildBuilding').addWindow('buildBuilding',
                container,
                size.x + position * OTRA.client.size.x,
                size.y,
                5 * OTRA.client.size.x,
                (OTRA.client.size.top - 1.5) * OTRA.client.size.x
            );
    },

    addWindow: function(id, els, x, y, l, h) {
        this.windows[id] = new Element('div', {
            'class': 'window',
            'id': id,
            'styles': {
                'left': x,
                'top': y,
                'width': l,
                'height': h
            }
        }).adopt(els);

        document.id(document.body).adopt(this.windows[id]);
        return this.windows[id];
    },

    removeWindow: function(id) {
        if (document.id(id) && this.windows[id]) {
            document.id(id).remove();
            this.windows[id] = null;
        }

        return this;
    },

    removeWindows: function() {
        for (var i in this.windows) {
            this.removeWindow(i);
        };

        return this;
    }
})