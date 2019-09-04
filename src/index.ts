import Dealer from './dealer'
import Router from './router'
import Sub from './sub'
import XSub from './xsub'
import Pub from './pub'
import XPub from './xpub'
import Pull from './pull'
import Push from './push'
import Pair from './pair'
import Req from './req'
import Rep from './rep'

export function socket(type:'dealer'|'router'|'pub'|'sub'|'xsub'|'xpub'|'pull'|'push'|'pair'|'req'|'rep') {

    switch (type) {
        case 'dealer':
            return new Dealer()
        case 'router':
            return new Router()
        case 'pub':
            return new Pub()
        case 'sub':
            return new Sub()
        case 'xsub':
            return new XSub()
        case 'xpub':
            return new XPub()
        case 'pull':
            return new Pull()
        case 'push':
            return new Push()
        case 'pair':
            return new Pair()
        case 'req':
            return new Req()
        case 'rep':
            return new Rep()
        default:
            throw new Error('Unsupported socket type')
    }
}

export {default as Sub} from './sub'
export {default as XSub} from './xsub'
export {default as Router} from './router'
export {default as Dealer} from './dealer'
export {default as XPub} from './xpub'
export {default as Pub} from './pub'
export {default as Push} from './push'
export {default as Pull} from './pull'
export {default as Pair} from './pair'
export {default as Req} from './req'
export {default as Rep} from './rep'
export {Buffer} from 'buffer'
