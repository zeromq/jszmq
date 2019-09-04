import WebSocket = require('isomorphic-ws')
import {URL} from 'url'
import {toNumber} from 'lodash'
import EventEmitter = require('events')
import SocketOptions from './socketOptions'
import Endpoint from './webSocketEndpoint'
import * as http from 'http'
import * as https from 'https'
import * as net from "net"
import * as url from 'url'
import {IListener} from './types'

type HttpServer = http.Server | https.Server

class HttpServerListener {
    servers = new Map<string, WebSocket.Server>()

    constructor(private server:HttpServer) {
        server.on('upgrade', this.onUpgrade.bind(this))
    }

    onUpgrade(request:http.IncomingMessage, socket: net.Socket, head: Buffer) {
        // @ts-ignore
        const path = url.parse(request.url).pathname;
        const wsServer = this.servers.get(path)

        if (wsServer)
            wsServer.handleUpgrade(request, socket, head, function done(ws) {
                wsServer.emit('connection', ws, request)
            })
        else {
            socket.destroy()
        }
    }

    add(path:string, wsServer: WebSocket.Server) {
        this.servers.set(path, wsServer)
    }

    remove(path:string) {
        this.servers.delete(path)

        if (this.servers.size === 0)
            listeners.delete(this.server)
    }
}

const listeners = new Map<HttpServer, HttpServerListener>()

function getHttpServerListener(httpServer:HttpServer) {
    let listener = listeners.get(httpServer)

    if (listener)
        return listener

    listener = new HttpServerListener(httpServer)
    listeners.set(httpServer, listener)

    return listener
}

export default class WebSocketListener extends EventEmitter implements IListener {
    server:WebSocket.Server
    path:string|undefined

    constructor(public address:string, private httpServer: HttpServer | undefined, private options:SocketOptions) {
        super()
        this.onConnection = this.onConnection.bind(this)

        if (!WebSocket.Server)
            throw 'binding websocket is not supported on browser'

        const url = new URL(address)

        let port

        if (url.port)
            port = toNumber(url.port)
        else if (url.protocol === 'wss')
            port = 443
        else if (url.protocol == 'ws')
            port = 80
        else
            throw new Error('not a websocket address')

        if (httpServer) {
            this.server = new WebSocket.Server({noServer: true})
            const listener = getHttpServerListener(httpServer)
            this.path = url.pathname
            listener.add(url.pathname, this.server)
        } else {
            this.server = new WebSocket.Server({
                port: port,
                path: url.pathname
            })
        }


        this.server.on('connection', this.onConnection)
    }

    onConnection(connection:WebSocket) {
        const endpoint = new Endpoint(connection, this.options)
        this.emit('attach', endpoint)
    }

    close(): void {
        if (this.path && this.httpServer)
            getHttpServerListener(this.httpServer).remove(this.path)

        this.server.close()
    }
}
