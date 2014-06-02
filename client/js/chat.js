var Chat = new Class({
    Implements: Options,

    client: null,
    webSocket: null,

    messages: [],
    historySize: 200,

    initialize: function(webSocket, client, options) {
        this.setOptions(options)

        this.webSocket = webSocket
        this.client = client

        // Build html structure
        var container = document.id('chatbox') || new Element('div', {
            id: 'chatbox'
        }).inject ($(document.body), 'bottom')

        container.adopt(
            new Element('header').adopt(
                new Element('nav').adopt(
                    new Element('img', {
                        id: 'chatboxMenu',
                        src: 'img/chat/menu.png'
                    })
                )
            ),
            new Element('div', {
                id: 'chatboxMenuContent'
            }).adopt(
                new Element('input', {
                    id: 'chatboxMenuAutoscroll',
                    type: 'checkbox',
                    checked: 'checked'
                }),
                new Element('span', {
                    html: ' Autoscroll to new message',
                })
            ),
            new Element('form', {
                id: 'chatboxSubmit'
            }).adopt(
                new Element('input', {
                    id: 'chatboxInput',
                    autocomplete: 'off'
                }),
                new Element('input', {
                    id: 'chatboxButton',
                    value: 'Send',
                    type: 'submit'
                })
            ),
            new Element('div', {
                id: 'chatboxMessages'
            })
        )

        document.id('chatboxMenu').addEvent('click', function() {
            var toggleMenu = new Fx.Reveal(document.id('chatboxMenuContent'), { duration: 200 }).toggle()
        })

        document.id('chatboxSubmit').addEvent('submit', function(e) {
            e.preventDefault()

            var val = document.id('chatboxInput').get('value')

            if (val) {
                this.webSocket.send({ action: 'parle', parametres: val })
                document.id('chatboxInput').set('value', '')
            }
        }.bind(this))

        window.addEvent('keyup', function(e) { if (e.key === 'enter') document.id('chatboxInput').focus() })

        return this
    },

    write: function(message) {
        if (message.type !== 'info') {
            var messages = $$('#chatboxMessages div[class!=info]')

            if (messages.length >= this.historySize)
                messages.getLast().remove()

            var el = new Element('div', {
                html: '<span class="name">' + message.name + ': </span> ' + message.message,
                'class': message.type,
                'data-name': message.name
            }).inject(document.id('chatboxMessages'), 'bottom')

            if (document.id('chatboxMenuAutoscroll').get('checked'))
                new Fx.Scroll(document.id('chatboxMessages'), { duration: 200 }).toElement(el)
        }

        return this
    }
})