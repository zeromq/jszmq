import * as assert from 'assert'
import {IEndpoint} from '../types'
import {Buffer} from 'buffer'
import {isUndefined} from 'lodash'
import {copy, resize} from './array'

type RemovedCallback = (endpoint:IEndpoint, buffer:Buffer, bufferSize:number) => void
type MatchCallback = (endpoint:IEndpoint) => void

export default class MultiTrie {
    endpoints?: Set<IEndpoint>
    minCharacter: number
    count:number
    liveNodes: number
    next: Array<MultiTrie|null>

    constructor() {
        this.minCharacter = 0
        this.count = 0
        this.liveNodes = 0
        this.next = []
    }

    get isRedundant() : boolean {
        return isUndefined(this.endpoints) && this.liveNodes === 0
    }

    add(prefix:Buffer, start:number, size:number, endpoint:IEndpoint) : boolean {
        return this.addHelper(prefix, start, size, endpoint)
    }

    private addHelper(prefix:Buffer, start:number, size:number, endpoint:IEndpoint) : boolean {
        // We are at the node corresponding to the prefix. We are done.
        if (size === 0) {
            let result = isUndefined(this.endpoints)

            if (isUndefined(this.endpoints))
                this.endpoints = new Set<IEndpoint>()

            this.endpoints.add(endpoint)

            return result
        }

        const currentCharacter = prefix.readUInt8(start)

        if (currentCharacter < this.minCharacter || currentCharacter >= this.minCharacter + this.count) {
            // The character is out of range of currently handled
            // characters. We have to extend the table.
            if (this.count === 0) {
                this.minCharacter = currentCharacter
                this.count = 1
                this.next = Array(1).fill(null)
            }
            else if (this.count === 1) {
                let oldc = this.minCharacter
                const oldp = this.next[0]
                this.count = (this.minCharacter < currentCharacter ? currentCharacter - this.minCharacter : this.minCharacter - currentCharacter) + 1
                this.next = Array(this.count).fill(null)
                this.minCharacter = Math.min(this.minCharacter, currentCharacter)
                this.next[oldc - this.minCharacter] = oldp
            }
            else if (this.minCharacter < currentCharacter) {
                // The new character is above the current character range.
                this.count = currentCharacter - this.minCharacter + 1
                this.next = resize(this.next, this.count, true)
            }
            else {
                // The new character is below the current character range.
                this.count = (this.minCharacter + this.count) - currentCharacter
                this.next = resize(this.next, this.count, false)
                this.minCharacter = currentCharacter
            }
        }

        if (this.next[currentCharacter - this.minCharacter] === null) {
            this.next[currentCharacter - this.minCharacter] = new MultiTrie()
            this.liveNodes++
        }

        // @ts-ignore
        return this.next[currentCharacter - this.minCharacter].addHelper(prefix, start + 1, size - 1, endpoint)
    }

    public removeEndpoint(endpoint:IEndpoint, func:RemovedCallback) {
        return this.removeEndpointHelper(endpoint, Buffer.alloc(0), 0, 0, func)
    }

    private removeEndpointHelper(endpoint:IEndpoint, buffer:Buffer, bufferSize:number, maxBufferSize:number, func:RemovedCallback) : boolean {
        // Remove the subscription from this node.
        if (this.endpoints && this.endpoints.delete(endpoint) && this.endpoints.size === 0) {
            func(endpoint, buffer, bufferSize)
            this.endpoints = undefined
        }

        // Adjust the buffer.
        if (bufferSize >= maxBufferSize) {
            maxBufferSize = bufferSize + 256
            const newBuffer = Buffer.alloc(maxBufferSize, 0)
            buffer.copy(newBuffer)
            buffer = newBuffer
        }

        // If there are no subnodes in the trie, return.
        if (this.count === 0)
            return true

        // If there's one subnode (optimisation).
        if (this.count === 1) {
            buffer.writeUInt8(this.minCharacter, bufferSize)
            bufferSize++
            // @ts-ignore
            this.next[0].removeEndpointHelper(endpoint, buffer, bufferSize, maxBufferSize, func);

            // Prune the node if it was made redundant by the removal
            // @ts-ignore
            if (this.next[0].isRedundant) {
                this.next = []
                this.count = 0
                this.liveNodes--
            }

            return true
        }

        // If there are multiple subnodes.

        // New min non-null character in the node table after the removal
        let newMin = this.minCharacter + this.count - 1

        // New max non-null character in the node table after the removal
        let newMax = this.minCharacter

        for (let currentCharacter = 0; currentCharacter != this.count; currentCharacter++) {
            buffer.writeUInt8(this.minCharacter + currentCharacter, bufferSize)

            const next = this.next[currentCharacter]
            if (next) {
                next.removeEndpointHelper(endpoint, buffer, bufferSize + 1, maxBufferSize, func)

                // Prune redundant nodes from the mtrie
                if (next.isRedundant) {
                    this.next[currentCharacter] = null
                    this.liveNodes--
                }
                else {
                    // The node is not redundant, so it's a candidate for being
                    // the new min/max node.
                    //
                    // We loop through the node array from left to right, so the
                    // first non-null, non-redundant node encountered is the new
                    // minimum index. Conversely, the last non-redundant, non-null
                    // node encountered is the new maximum index.
                    if (currentCharacter + this.minCharacter < newMin)
                        newMin = currentCharacter + this.minCharacter

                    if (currentCharacter + this.minCharacter > newMax)
                        newMax = currentCharacter + this.minCharacter
                }
            }
        }

        // Free the node table if it's no longer used.
        if (this.liveNodes === 0) {
            this.next = []
            this.count = 0
        }
        // Compact the node table if possible
        else if (this.liveNodes === 1) {
            // If there's only one live node in the table we can
            // switch to using the more compact single-node
            // representation
            const node = this.next[newMin - this.minCharacter]
            assert(node)
            this.next = [ node ]
            this.count = 1
            this.minCharacter = newMin
        }
        else if (this.liveNodes > 1 && (newMin > this.minCharacter || newMax < this.minCharacter + this.count - 1))
        {
            let oldTable = this.next
            this.count = newMax - newMin + 1
            this.next = Array(this.count).fill(null)

            copy(oldTable, (newMin - this.minCharacter), this.next, 0, this.count)

            this.minCharacter = newMin
        }
        return true;
    }

    public remove(prefix:Buffer, start:number, size:number, endpoint:IEndpoint) : boolean {
        if (size === 0) {
            if (this.endpoints) {
                const erased = this.endpoints.delete(endpoint)
                assert(erased)
                if (this.endpoints.size === 0)
                    this.endpoints = undefined
            }
            return !this.endpoints
        }

        const currentCharacter = prefix.readUInt8(start)
        if (this.count == 0 || currentCharacter < this.minCharacter || currentCharacter >= this.minCharacter + this.count)
            return false;

        const nextNode = this.count == 1 ? this.next[0] : this.next[currentCharacter - this.minCharacter]
        if (nextNode === null)
            return false;

        let ret = nextNode.remove(prefix, start + 1, size - 1, endpoint)
        if (nextNode.isRedundant)
        {
            assert(this.count > 0)

            if (this.count === 1) {
                this.next = []
                this.count = 0
                this.liveNodes--
            }
            else
            {
                this.next[currentCharacter - this.minCharacter] = null
                this.liveNodes--

                // Compact the table if possible
                if (this.liveNodes === 1) {
                    // If there's only one live node in the table we can
                    // switch to using the more compact single-node
                    // representation
                    let i = 0
                    for (; i < this.count; i++) {
                        if (this.next[i] !== null)
                            break;
                    }

                    this.minCharacter += i
                    this.count = 1
                    const old = this.next[i]
                    this.next = [ old ]
                } else if (currentCharacter == this.minCharacter) {
                    // We can compact the table "from the left"
                    let i = 1;
                    for (;i < this.count; i++) {
                        if (this.next[i] !== null)
                            break;
                    }

                    this.minCharacter += i
                    this.count -= i
                    this.next = resize(this.next, this.count, false)
                } else if (currentCharacter === this.minCharacter + this.count - 1) {
                    // We can compact the table "from the right"
                    let i = 1;
                    for (;i < this.count; i++) {
                        if (this.next[this.count - 1 - i] !== null)
                            break;
                    }

                    this.count -= i
                    this.next = resize(this.next, this.count, true)
                }
            }
        }

        return ret;
    }

    match(data:Buffer, offset:number, size:number, func:MatchCallback)
    {
        let current = this
        let index = offset

        while (true) {
            // Signal the pipes attached to this node.
            if (current.endpoints)
                current.endpoints.forEach(e => func(e))

            // If we are at the end of the message, there's nothing more to match.
            if (size === 0)
                break;

            // If there are no subnodes in the trie, return.
            if (current.count === 0)
                break;

            const c = data.readUInt8(index)
            // If there's one subnode (optimisation).
            if (current.count === 1) {
                if (c != current.minCharacter)
                    break;
                // @ts-ignore
                current = current.next[0]
                index++
                size--
                continue
            }

            // If there are multiple subnodes.
            if (c < current.minCharacter || c >= current.minCharacter + current.count)
                break;
            if (current.next[c - current.minCharacter] === null)
                break;
            // @ts-ignore
            current = current.next[c - current.minCharacter]
            index++
            size--
        }
    }
}