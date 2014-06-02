var Entity = new Class({
    _isPlayer: false,
    _data: {},
    _breed: null,

    observers: [],
    animations: {},

    id: null,

    initialize: function (id, data) {
        this.id = id;

        this._data = data;

        if (this._data['breed'] !== undefined)
            this.breed = new Breed(this._data['breed']);

        this._isPlayer = id === OTRA.client.idPlayer;
    },

    addObserver: function (id, observer) {
        this.observers[id] = observer;

        return this;
    },

    removeObserver: function (id) {
        delete this.observers[id];

        return this;
    },

    notify: function (event) {
        for (var i in this.observers) {
            if (this.observers.hasOwnProperty(i)) {
                this.observers[i].notify(this, event);
            }
        }

        return this;
    },

    get: function (prop) {
        if (this._data[prop] !== undefined) {
            return this._data[prop];
        } else if (this._breed && this._breed.get(prop) !== undefined) {
            return this._breed.get(prop);
        }

        return null;
    },

    set: function (prop, val) {
        if (this._data[prop] !== undefined) this._data[prop] = val;
        return this;
    },

    isPlayer: function () {
        return this._isPlayer;
    },

    isTeammate: function (entity) {
        return this.get('equipe') === entity.get('equipe');
    }
});