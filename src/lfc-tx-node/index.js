import classIs from 'class-is'
import { serialize, deserialize } from './../util'

export default classIs(class LFCTx {
  get _keys() {
    return ['id', 'time', 'reward', 'inputs', 'outputs']
  }
  
  constructor(tx) {
    if (Buffer.isBuffer(tx)) {
      this._defineTx(deserialize(tx))
    } else if (tx) {
      this._defineTx(tx)
    }
  }
  
  serialize() {
    return serialize(this._keys.reduce((p, c) => {
      p[c] = this[c]
      return p
    }, {}))
  }
  
  _defineTx(tx) {
    return this._keys.forEach(key => {
      Object.defineProperty(this, key, {
        value: tx[key],
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
    return `LFCTx <id: "${this.id.toString()}", time: "${this.time.toString()}", hash: "${this.hash.toString()}", reward: "${this.reward.toString()}", inputs: "${this.inputs.length}", outputs: "${this.outputs.length}", size: ${this.size}>`
  }
  
  get size () {
    return this.serialize().length
  }

}, { className: 'LFCTx', symbolName: '@leofcoin/ipld-lfc-tx/lfc-tx'})