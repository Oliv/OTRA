var Player = new Class({
	Extends: Character,

	initialize: function(id, data) {
		if (OTRA.client.idPlayer != id) {
            data.onClicked = function(o, pos) {
                OTRA.info.set(o.referer.get('nom'));
                OTRA.websocket.send({ action: 'attaque', parametres: o.referer.id });
    		}
        }

        data.onEnter = function(o, pos) {
            OTRA.info.set(o.referer.get('nom'));
        }
        data.onLeave = function(o) {
            OTRA.info.remove();
        }

        this.directory = 'chars';

		this.parent(id, data);
    }
});