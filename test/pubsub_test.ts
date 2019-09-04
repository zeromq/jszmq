import * as jsmq from '../src'

describe('pubsub', function() {
    it('subscribe', function(done) {
        const pub = new jsmq.XPub()
        const sub = new jsmq.Sub()

        pub.bind('ws://localhost:55556')
        sub.subscribe('A')
        sub.connect('ws://localhost:55556')

        // Waiting for subscriptions before publishing
        pub.once('message', () => {
            pub.send('B')
            pub.send('AAA')

            sub.once('message', topic => {
                expect(topic.toString()).toBe('AAA')
                pub.close()
                sub.close()
                done()
            })
        })
    })

    it('unsubscribe', function (done) {
        const pub = new jsmq.XPub()
        const sub = new jsmq.Sub()

        pub.bind('ws://localhost:55556')
        sub.subscribe('A')
        sub.subscribe('B')
        sub.connect('ws://localhost:55556')

        // Waiting for subscriptions before publishing
        pub.once('message', () => {
            pub.send('A')
            sub.once('message', topic => {
                sub.unsubscribe('A')
                pub.send('A')
                pub.send('B')

                sub.once('message', topic2 => {
                    expect(topic2.toString()).toBe('B')
                    pub.close()
                    sub.close()
                    done()
                })
            })
        })
    })
})