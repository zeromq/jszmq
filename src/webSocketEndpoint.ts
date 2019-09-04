import EventEmitter = require('events')
import WebSocket = require('isomorphic-ws')
import {Buffer} from 'buffer'
import SocketOptions from './socketOptions'
import {isString} from 'lodash'
import {IEndpoint, Msg} from './types'

enum State {
    Closed,
    Connecting,
    Reconnecting,
    Active
}

export default class WebSocketEndpoint extends EventEmitter implements IEndpoint {
    socket!: WebSocket;
    state: State
    frames:Buffer[] = []
    queue:Buffer[] = []
    options:SocketOptions
    routingIdReceived = false
    accepted:boolean
    public routingKey:Buffer = Buffer.alloc(0)
    public routingKeyString = ''
    public address:string

    constructor(address:string|WebSocket, options:SocketOptions) {
        super()
        this.options = options
        this.connect = this.connect.bind(this)

        if (isString(address)) {
            this.address = address
            this.state = State.Connecting
            this.accepted = false

            this.connect()
        } else {
            this.routingIdReceived = false
            this.address = ''
            this.socket = address
            this.accepted = true
            this.state = State.Active
            this.socket.binaryType = "arraybuffer"
            this.socket.onclose = this.onClose.bind(this)
            this.socket.onmessage = this.onMessage.bind(this)
            this.send([this.options.routingId])
        }
    }

    private connect() {
        if (this.state === State.Closed)
            return // The socket was already closed, abort

        this.routingIdReceived = false
        this.socket = new WebSocket(this.address, ['ZWS2.0'])
        this.socket.binaryType = "arraybuffer"
        this.socket.onopen = this.onOpen.bind(this)
        this.socket.onclose = this.onClose.bind(this)
        this.socket.onmessage = this.onMessage.bind(this)
    }

    onOpen() {
        const oldState = this.state
        this.state = State.Active

        this.send([this.options.routingId])
        this.queue.forEach(frame => this.socket.send(frame))
        this.queue = []

        if (this.options.immediate)
            this.emit('attach', this)
        else if (oldState === State.Reconnecting)
            this.emit('hiccuped', this)
    }

    onClose() {
        if (this.accepted) {
            this.state = State.Closed
            this.emit('terminated', this)
        }
        else if (this.state !== State.Closed) {
            if ((this.state === State.Active || this.state === State.Connecting) && this.options.immediate)
                this.emit('terminated', this)

            if (this.state === State.Active)
                this.state = State.Reconnecting

            setTimeout(this.connect, this.options.reconnectInterval)
        }
    }

    error() {
        this.socket.close()
    }

    onMessage(message:ArrayBuffer|any) {
        if (!this.routingIdReceived) {
            this.routingIdReceived = true

            if (!this.options.recvRoutingId)
                return
        }

        if (message.data instanceof ArrayBuffer) {
            const buffer = Buffer.from(message.data)

            if (buffer.length > 0) {
                const more = buffer.readUInt8(0) === 1
                const msg = buffer.slice(1)

                this.frames.push(msg)

                if (!more) {
                    this.emit("message", this, ...this.frames)
                    this.frames = []
                }
            }
            else
                this.error()
        }
        else
            this.error()
    }

    close() {
        if (this.state !== State.Closed) {
            this.state = State.Closed

            if (this.socket.readyState === this.socket.CONNECTING || this.socket.readyState === this.socket.OPEN)
                this.socket.close()

            this.emit('terminated', this)
        }
    }

    send(msg:Msg) {
        if (this.state === State.Closed)
            return false

        for (let i = 0, len = msg.length; i < len; i++) {
            const isLast = i === len - 1
            const flags = isLast ? 0 : 1

            let frame = msg[i]

            if (isString(frame))
                frame = Buffer.from(frame, 'utf8')
            else if (frame instanceof ArrayBuffer || frame instanceof Buffer) {
                // Nothing to do, use as is
            } else {
                throw new Error('invalid message type')
            }

            const flagsArray = Buffer.alloc(1)
            flagsArray.writeUInt8(flags, 0)
            const buffer = Buffer.concat([flagsArray, frame])

            if (this.state === State.Active)
                this.socket.send(buffer)
            else
                this.queue.push(buffer)
        }

        return true
    }
}
