var Info = new Class({
    client: null,
    container: null,

    initialize: function(client) {
        this.client = client

        // Build html structure
        this.container = document.id('infobox') || new Element('div', {
            id: 'infobox'
        }).inject ($(document.body), 'bottom')

        return this
    },

    set: function(title, html) {
        this.container.set('html', '<h3>' + (title || '') + '</h3>' + (html || ''));

        return this;
    },

    remove: function() {
        this.container.set('html', null);

        return this;
    }
})