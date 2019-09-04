import {Buffer} from 'buffer'
import SocketBase from './socketBase'
import {IEndpoint, Msg} from './types'

export default class Pair extends SocketBase {
    private endpoint?:IEndpoint
    private pending: Msg[] = []

    protected attachEndpoint(endpoint: IEndpoint) {
        if (this.endpoint) {
            endpoint.close()
            return
        }

        this.endpoint = endpoint

        while(true) {
            const msg = this.pending.shift()
            if (!msg)
                break

            if (!endpoint.send(msg))
                break
        }
    }

    protected endpointTerminated(endpoint: IEndpoint) {
        if (endpoint === this.endpoint)
            this.endpoint = undefined
    }

    protected xrecv(endpoint: IEndpoint, ...frames: Buffer[]) {
        if (endpoint === this.endpoint)
            this.emit('message', ...frames)
    }

    protected xsend(msg: Msg) {
        if (this.endpoint)
            this.endpoint.send(msg)
        else
            this.pending.push(msg)
    }
}