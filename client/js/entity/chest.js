var Chest = new Class({
    Extends: Item,

    initialize: function(id, data) {
        data.onClicked = function(o, pos) {
            OTRA.websocket.send({ action: 'coffre', parametres: o.referer.id });
        }
        data.onEnter = function(o, pos) {
            OTRA.info.set(o.referer.get('nom'));
        }
        data.onLeave = function(o) {
            OTRA.info.remove();
        }

        this.directory = 'objets';

        this.parent(id, data);
    }
});