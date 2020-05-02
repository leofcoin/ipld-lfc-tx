import classIs from 'class-is'
import { serialize, deserialize } from './util'

export default classIs(class LFCInput {
  get _keys() {
    return ['tx', 'index', 'amount', 'address', 'signature', 'script']
  }
  constructor(input) {
    if (Buffer.isBuffer(tx)) {
      this._defineInput(deserialize(tx))
    } else if (tx) {
      this._defineInput(tx)
    }
  }
  
  serialize() {
    return serialize(this._keys.reduce((p, c) => {
      p[c] = this[c]
      return p
    }, {}))
  }
  
  _defineInput(input) {
    return this._keys.forEach(key => {
      Object.defineProperty(this, key, {
        value: input[key],
        writable: false
      })
    })
  }
  
  toJSON() {
    return this._keys.reduce((p, c) => {
      p[c] = this[c]
      return p
    }, {})
  }
  
  toString () {
    return `LFCInput <tx: "${this.tx.toString()}", index: "${this.index.toString()}", amount: "${this.amount.toString()}", address: "${this.address.toString()}", signature: "${this.signature.toString()}", size: ${this.size}>`
  }
  
  get size () {
    return this.serialize().length
  }

}, { className: 'LFCInput', symbolName: '@leofcoin/ipld-lfc-input/lfc-input'})