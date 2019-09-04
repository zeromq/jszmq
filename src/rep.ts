import Router from './router'
import {IEndpoint, Msg} from './types'
import {Buffer} from "buffer"
import setAsap = require('setasap')

type PendingMsg = [IEndpoint, Buffer[]]

export default class Rep extends Router {
    private static bottom = Buffer.alloc(0)

    sendingReply: boolean
    ids:Buffer[]
    pending:PendingMsg[]

    constructor() {
        super()
        this.sendingReply = false
        this.ids = []
        this.pending = []
    }

    protected xsend(msg: Msg) {
        // If we are in the middle of receiving a request, we cannot send reply.
        if (!this.sendingReply)
            throw new Error("cannot send another reply")

        const withIds = [...this.ids, Rep.bottom, ...msg]
        super.xsend(withIds)

        this.ids = []

        // We are ready to handle next message
        const nextMsg = this.pending.shift()
        if (nextMsg)
            setAsap(() => this.recvInternal(nextMsg[0], nextMsg[1]))
        else
            this.sendingReply = false
    }

    private recvInternal(endpoint: IEndpoint, frames: Buffer[]) {
        while(true) {
            const frame = frames.shift()

            // Invalid msg, dropping current msg
            if (!frame) {
                this.ids = []

                const nextMsg = this.pending.shift()
                if (nextMsg)
                    this.recvInternal(nextMsg[0], nextMsg[1])

                return
            }

            // Reached bottom, enqueue msg
            if (frame.length === 0) {
                this.sendingReply = true
                this.emit('message', ...frames)
                return
            }

            this.ids.push(frame)
        }
    }

    protected xxrecv(endpoint: IEndpoint, ...frames: Buffer[]) {
        // If we are in middle of sending a reply, we cannot receive next request yet, add to pending
        if (this.sendingReply)
            this.pending.push([endpoint, frames])
        else
            this.recvInternal(endpoint, frames)
    }
}