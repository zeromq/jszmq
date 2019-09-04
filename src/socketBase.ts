import {Buffer} from 'buffer'
import EventEmitter = require('events')
import SocketOptions from './socketOptions'
import {find, pull} from 'lodash'
import {Frame, IEndpoint, IListener, Msg} from './types'
import WebSocketListener from './webSocketListener'
import * as http from 'http'
import * as https from 'https'
import WebSocketEndpoint from './webSocketEndpoint'

class SocketBase extends EventEmitter {
    private endpoints: IEndpoint[] = []
    private binds: IListener[] = []
    public readonly options = new SocketOptions()

    constructor() {
        super()
        this.bindAttachEndpoint = this.bindAttachEndpoint.bind(this)
        this.bindEndpointTerminated = this.bindEndpointTerminated.bind(this)
        this.attachEndpoint = this.attachEndpoint.bind(this)
        this.endpointTerminated = this.endpointTerminated.bind(this)
        this.xrecv = this.xrecv.bind(this)
        this.hiccuped = this.hiccuped.bind(this)
    }

    connect(address: string) {
        if (address.startsWith("ws://") || address.startsWith("wss://")) {
            const endpoint = new WebSocketEndpoint(address, this.options)
            endpoint.on('attach', this.attachEndpoint)
            endpoint.on('terminated', this.endpointTerminated)
            endpoint.on('message', this.xrecv)
            endpoint.on('hiccuped', this.hiccuped)
            this.endpoints.push(endpoint)

            if (!this.options.immediate)
                this.attachEndpoint(endpoint)
        } else {
            throw new Error('unsupported transport')
        }
    }

    disconnect(address: string) {
        const endpoint = find(this.endpoints, e => e.address === address)

        if (endpoint) {
            endpoint.removeListener('attach', this.attachEndpoint)
            endpoint.removeListener('terminated', this.endpointTerminated)
            endpoint.removeListener('message', this.xrecv)
            endpoint.removeListener('hiccuped', this.hiccuped)
            endpoint.close()
            pull(this.endpoints, endpoint)
            this.endpointTerminated(endpoint)
        }
    }

    bind(address: string, server?: http.Server | https.Server) {
        if (address.startsWith("ws://") || address.startsWith("wss://")) {
            const listener = new WebSocketListener(address, server, this.options)
            listener.on('attach', this.bindAttachEndpoint)
            this.binds.push(listener)
        } else {
            throw new Error('unsupported transport')
        }
    }

    bindSync(address: string, server?: http.Server | https.Server) {
        return this.bind(address, server)
    }

    unbind(address: string) {
        const listener = find(this.binds, b => b.address === address)

        if (listener) {
            listener.removeListener('attach', this.attachEndpoint)
            listener.close()
            pull(this.binds, listener)
        }
    }

    close() {
        this.binds.forEach(listener => {
            listener.removeListener('attach', this.attachEndpoint)
            listener.close()
        })

        this.binds = []

        this.endpoints.forEach(endpoint => {
            endpoint.removeListener('attach', this.attachEndpoint)
            endpoint.removeListener('terminated', this.endpointTerminated)
            endpoint.removeListener('message', this.xrecv)
            endpoint.removeListener('hiccuped', this.hiccuped)
            endpoint.close()
            pull(this.endpoints, endpoint)
            this.endpointTerminated(endpoint)
        })
    }

    subscribe(topic: Frame) {
        throw new Error('not supported')
    }

    unsubscribe(topic: Frame) {
        throw new Error('not supported')
    }

    private bindAttachEndpoint(endpoint: IEndpoint) {
        endpoint.on('terminated', this.bindEndpointTerminated)
        endpoint.on('message', this.xrecv)

        this.attachEndpoint(endpoint)
    }

    private bindEndpointTerminated(endpoint: IEndpoint) {
        endpoint.removeListener('terminated', this.bindEndpointTerminated)
        endpoint.removeListener('message', this.xrecv)

        this.endpointTerminated(endpoint)
    }

    protected attachEndpoint(endpoint: IEndpoint) {
    }

    protected endpointTerminated(endpoint: IEndpoint) {

    }

    protected hiccuped(endpoint: IEndpoint) {

    }

    protected xrecv(endpoint: IEndpoint, ...frames: Buffer[]) {
    }

    protected xsend(msg: Msg) {

    }

    send(msg: Msg | Frame) {
        if (Array.isArray(msg))
            this.xsend(msg)
        else
            this.xsend([msg])
    }
}

export default SocketBase
