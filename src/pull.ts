import {Buffer} from 'buffer'
import SocketBase from './socketBase'
import {IEndpoint} from './types'

export default class Pull extends SocketBase {
    protected attachEndpoint(endpoint: IEndpoint) {

    }

    protected endpointTerminated(endpoint: IEndpoint) {
    }

    protected xrecv(endpoint: IEndpoint, ...frames: Buffer[]) {
        this.emit('message', ...frames)
    }
}