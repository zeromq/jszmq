import {Buffer} from "buffer"
import XPub from './xpub'
import {IEndpoint} from './types'

export default class Pub extends XPub {
    protected xxrecv(endpoint: IEndpoint, ...frames: Buffer[]) {
        // Drop any message sent to pub socket
    }

    protected sendUnsubscription() {

    }
}
