import {pull} from 'lodash'
import {IEndpoint, Msg} from '../types'

function swap<T>(items: Array<T>, index1: number, index2: number) {
    if (index1 === index2)
        return;

    let item1 = items[index1]
    let item2 = items[index2]
    if (item1 !== null)
        items[index2] = item1
    if (item2 !== null)
        items[index1] = item2
}

export default class Distribution {
    endpoints: IEndpoint[] = []
    matching = 0
    active = 0

    attach(endpoint: IEndpoint) {
        this.endpoints.push(endpoint)
        swap(this.endpoints, this.active, this.endpoints.length - 1)
        this.active++
    }

    match(endpoint: IEndpoint) {
        const index = this.endpoints.indexOf(endpoint)

        // If pipe is already matching do nothing.
        if (index < this.matching)
            return;

        // If the pipe isn't active, ignore it.
        if (index >= this.active)
            return;

        // Mark the pipe as matching.
        swap(this.endpoints, index, this.matching)
        this.matching++
    }

    unmatch() {
        this.matching = 0;
    }

    terminated(endpoint: IEndpoint) {
        // Remove the endpoint from the list; adjust number of matching, active and/or
        // eligible endpoint accordingly.
        if (this.endpoints.indexOf(endpoint) < this.matching)
            this.matching--
        if (this.endpoints.indexOf(endpoint) < this.active)
            this.active--

        pull(this.endpoints, endpoint)
    }

    activated(endpoint: IEndpoint) {
        // Move the pipe from passive to active state.
        swap(this.endpoints, this.endpoints.indexOf(endpoint), this.active)
        this.active++
    }

    sendToAll(msg: Msg) {
        this.matching = this.active
        this.sendToMatching(msg)
    }

    sendToMatching(msg: Msg) {
        // If there are no matching pipes available, simply drop the message.
        if (this.matching === 0)
            return;

        for (let i = 0; i < this.matching; i++) {
            if (!this.write(this.endpoints[i], msg))
                --i; //  Retry last write because index will have been swapped
        }
    }

    write(endpoint: IEndpoint, msg: Msg) {
        if (!endpoint.send(msg)) {
            swap(this.endpoints, this.endpoints.indexOf(endpoint), this.matching - 1)
            this.matching--
            swap(this.endpoints, this.endpoints.indexOf(endpoint), this.active - 1)
            this.active--
            return false;
        }

        return true;
    }
}