var OTRAGui = new Class({
    Implements: Options,

	options: {
		sTitle 	: null,
		iSizeX 	: null,
		iSizeY 	: null,
		bDrag 	: false,
		bShow 	: true,
		sFile 	: null,
		sColor 	: "rgba(255, 255, 255, 0.9)",
        oStyles : {},
        oParams : {}
    },

    windows: [],

	initialize: function(options) {
        this.setOptions(options);
		this.date = +new Date();
    },

	add: function(id, options) {
		this.windows[id] = { ctx : null, events : null };

		for (i in this.options)
			if (!options[i]) options[i] = this.options[i];

		var container = $(id + 'DivLayer');
		if (container) this.toggle(id);
        else {
            container = new Element('div', {
                'id'	: id + 'DivLayer',
                'class'	: 'Div' + id.capitalize(),
                'styles': options.oStyles
            }).inject('gui');

			var canvas = new Element('canvas', {
				'id'	: id + 'Layer',
				'class'	: 'Canvas' + id.capitalize(),
				'width' : options.iSizeX,
				'height': options.iSizeY
			}).inject(container);

			this.windows[id].ctx = canvas.getContext("2d");

			this.windows[id].ctx.fillStyle = options.sColor;
			this.windows[id].ctx.beginPath();
			this.windows[id].ctx.fillRect(0, 0, options.iSizeX, options.iSizeY);
			this.windows[id].ctx.fill();

			var header = new Element('div').set({
				class: 'WindowHead',
				styles: {
					width: container.getStyle('width').toInt() - 16
				}
			}).inject(container).adopt(new Element('div').set({
				class: 'WindowTitle',
				'html': options.sTitle,
				'styles': {
					'width': options.iSizeX.toInt() - 48
				}
			}), new Element('div').set({
				class: 'WindowClose',
				'html': '<a href="javascript:Client.toggle(\'' + id + '\', true);">[X]</a>'
			}));

			if (options.sFile) {
				var content = new Element('div').set({
					class: 'WindowContent',
					styles: {
						height: container.getStyle('height').toInt() - 24,
						width: container.getStyle('width').toInt() - 16
					}
				}).inject(container);


				var a = new Request.HTML({
					evalResponse: true,
					url			: 'ajax/' + options.sFile + '?' + this.date,
					onSuccess	: function (responseHTML) {
						content.adopt(responseHTML);
					}
				}).get(options.oParams);
			}

			if (options.bDrag) new Drag(container, { handle: header });
        }

        return container;
    },

	toggle: function(o, reset) {
        if (typeOf(o) === 'string') o = $(o + 'DivLayer');
		if (reset) this.page(o);

        if (o) o.setStyle('display', o.getStyle('display') === 'none' ? 'block' : 'none');
    },

	page: function(o, id) {
        if (typeOf(o) === 'element') o = o.getElement('.WindowContent');
        else if (typeOf(o) === 'string') o = $(o + 'DivLayer').getElement('.WindowContent');

        if (o) o.getElements('div').each(id !== undefined ? function(e) {
				e.setStyle('display', e.hasClass('Page' + id) ? 'block' : 'none');
			} : function(e) {
				e.setStyle('display', e.hasClass('First') ? 'block' : 'none');
			});
    }
});