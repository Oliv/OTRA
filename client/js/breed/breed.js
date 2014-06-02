var Breed = new Class({
    _data: {},

    initialize: function (data) {
        this._data = data;
    },

    get: function (prop) {
        if (this._data[prop] !== undefined) return this._data[prop];
        return null;
    },

    set: function (prop, val) {
        if (this._data[prop] !== undefined) this._data[prop] = val;
        return this;
    }
});