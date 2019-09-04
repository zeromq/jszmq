import {Buffer} from 'buffer'
import SocketBase from './socketBase'
import {IEndpoint, Msg} from './types'
import Trie from './utils/trie'
import Distribution from './utils/distribution'

export default class XSub extends SocketBase {
    subscriptions: Trie
    distribution:Distribution

    constructor() {
        super()
        this.subscriptions = new Trie()
        this.distribution = new Distribution()
    }

    protected attachEndpoint(endpoint:IEndpoint) {
        this.distribution.attach(endpoint)

        this.subscriptions.forEach(s => endpoint.send([Buffer.concat([new Buffer([1]), s])]))
    }

    protected hiccuped(endpoint: IEndpoint) {
        this.subscriptions.forEach(s => endpoint.send([Buffer.concat([new Buffer([1]), s])]))
    }

    protected endpointTerminated(endpoint:IEndpoint) {
        this.distribution.terminated(endpoint)
    }

    protected xrecv(endpoint:IEndpoint, ...frames: Buffer[]) {
        const topic = frames[0]

        const subscribed = this.subscriptions.check(topic, 0, topic.length)
        if (subscribed)
            this.emit('message', ...frames)
    }

    protected xsend(msg:Msg) {
        const frame = msg[0]

        if (!Buffer.isBuffer(frame))
            throw new Error("subscription must be a buffer")

        if (frame.length > 0 && frame.readUInt8(0) === 1) {
            this.subscriptions.add(frame, 1, frame.length - 1)
            this.distribution.sendToAll(msg)
        } else if (frame.length > 0 && frame.readUInt8(0) === 0) {
            // Removing only one subscriptions
            const removed = this.subscriptions.remove(frame, 1, frame.length - 1)
            if (removed)
                this.distribution.sendToAll(msg)
        } else {
            // upstream message unrelated to sub/unsub
            this.distribution.sendToAll(msg)
        }
    }
}
