import {Buffer} from 'buffer'
import SocketBase from './socketBase'
import {IEndpoint, Msg} from './types'
import MultiTrie from './utils/multiTrie'
import Distribution from './utils/distribution'

export default class XPub extends SocketBase {
    subscriptions = new MultiTrie()
    distribution = new Distribution()

    constructor() {
        super()

        this.markAsMatching = this.markAsMatching.bind(this)
        this.sendUnsubscription = this.sendUnsubscription.bind(this)
    }

    private markAsMatching(endpoint: IEndpoint) {
        this.distribution.match(endpoint)
    }

    protected sendUnsubscription(endpoint: IEndpoint, data: Buffer, size: number) {
        const unsubscription = Buffer.concat([Buffer.from([0]), data.slice(0, size)])
        endpoint.send([unsubscription])
    }

    protected attachEndpoint(endpoint: IEndpoint) {
        this.distribution.attach(endpoint)
    }

    protected endpointTerminated(endpoint: IEndpoint) {
        this.subscriptions.removeEndpoint(endpoint, this.sendUnsubscription)
        this.distribution.terminated(endpoint)
    }

    protected xsend(msg: Msg) {
        let topic: Buffer

        if (Buffer.isBuffer(msg[0])) {
            // @ts-ignore
            topic = msg[0]
        } else {
            // @ts-ignore
            topic = Buffer.from(msg[0], 'utf8')
        }

        this.subscriptions.match(topic, 0, topic.length, this.markAsMatching)
        this.distribution.sendToMatching(msg)
    }

    protected xrecv(endpoint: IEndpoint, subscription:Buffer, ...frames: Buffer[]) {
        if (subscription.length > 0) {
            const type = subscription.readUInt8(0)
            if (type === 0 || type === 1) {
                let unique

                if (type === 0)
                    unique = this.subscriptions.remove(subscription, 1, subscription.length - 1, endpoint)
                else
                    unique = this.subscriptions.add(subscription, 1, subscription.length - 1, endpoint)

                if (unique || this.options.xpubVerbose)
                    this.xxrecv(endpoint, subscription, ...frames)

                return
            }
        }

        this.xxrecv(endpoint, subscription, ...frames)
    }

    protected xxrecv(endpoint: IEndpoint, ...frames: Buffer[]) {
        this.emit('message', ...frames)
    }
}
