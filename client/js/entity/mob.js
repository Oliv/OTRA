var Mob = new Class({
	Extends: Character,

	initialize: function(id, data) {
        data.onClicked = function(o, pos) {
            OTRA.websocket.send({ action: 'attaque', parametres: o.referer.id });
        }
        data.onEnter = function(o, pos) {
            OTRA.info.set(o.referer.get('nom'));
        }
        data.onLeave = function(o) {
            OTRA.info.remove();
        }

        this.directory = 'mobs'

    	this.parent(id, data, 'm');
    }
});