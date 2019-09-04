import {Msg, IEndpoint} from '../types'

export default class LoadBalancer {
    endpoints:IEndpoint[] = []
    current = 0

    attach(endpoint:IEndpoint) {
        this.endpoints.push(endpoint)
    }

    terminated(endpoint:IEndpoint) {
        const index = this.endpoints.indexOf(endpoint)

        if (this.current === this.endpoints.length - 1) {
            this.current = 0
        }

        this.endpoints.splice(index, 1)
    }

    send(msg:Msg) {
        if (this.endpoints.length === 0)
            return false

        const result = this.endpoints[this.current].send(msg)
        this.current = (this.current + 1) % this.endpoints.length

        return result
    }
}
