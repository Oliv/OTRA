var MooWebSocket = new Class({
    Implements: [Options, Events],

    options: {
        logging: false,

        events: {
            onSocketOpen:       function() { this.log('Connected to server'); },
            onSocketMessage:    function(e) { this.log('Data recieved from server : ', e.data); },
            onSocketClose:      function() { this.log('Disconnected from server'); },
            onLog:              function() {}
        }
    },

    initialize: function(adress, options) {
        this.setOptions(options);

		// WebSocket initialisation
        this.log('Connecting to server : ', adress);
		this.cnx = new WebSocket(adress);

        // Events bindings
        this.addEvents(this.options.events);

		// Fire custom events
		this.cnx.onopen =       function() { this.fireEvent('onSocketOpen'); }.bind(this);
		this.cnx.onmessage =    function(e) { this.fireEvent('onSocketMessage', e); }.bind(this);
		this.cnx.onclose =      function() { this.fireEvent('onSocketClose'); }.bind(this);

        return this;
    },

    log: function() {
        if (this.options.logging) {
            if (typeof(console.log) === 'function')
                console.log(arguments);
        }

        this.fireEvent('onLog', arguments);

        return this;
    },

	send: function(data) {
		this.cnx.send(JSON.encode(data));

		return this;
	},

    disconnect: function() {
        this.cnx.close();

		return this;
    }
});