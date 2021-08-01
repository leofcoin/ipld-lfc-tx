import CID from 'cids'
import multicodec from 'multicodec'
import multihashing from 'multihashing'
import protons from 'protons'
import proto from './proto.js'
import { isHex } from 'ishex'

const codec = multicodec.LEOFCOIN_TX
const defaultHashAlg = multicodec.KECCAK_256

export const serialize = block => {
  return protons(proto).LFCTransaction.encode(block)
}

export const deserialize = buffer => {
  return protons(proto).LFCTransaction.decode(buffer)
}

/**
 * @returns {Promise.<CID>}
 */
export const cid = buffer => {
  const multihash = multihashing(buffer, defaultHashAlg)
  const codecName = multicodec.print[codec]
  return new CID(1, codecName, multihash, 'base58btc')
}

export const validate = json => {
  if (json.isLFCTx) json = json.toJSON()

  if (json.id.length !== 64) throw new Error(`Expected: 64 got ${json.id.length} @LFCTx.id.length`)
  if (isNaN(json.time)) throw new Error(`Expected: typeof number got ${typeof json.time} @LFCTx.time`)
  if (json.reward && json.reward !== 'mined' && json.reward !== 'minted' && json.reward !== '0x') throw new Error(`Expected: mined or minted got ${json.reward} @LFCTx.reward`)
  if (json.script && typeof json.script !== 'string') throw new Error(`Expected: typeof string got ${typeof json.script} @LFCTx.script`)

  if (json.inputs && json.inputs.length > 0) {
    for (const input of json.inputs) {      
      if (input.tx.length !== 64) throw new Error(`Expected: 64 got ${input.tx.length} @LFCTx.inputs[${key}].tx.length`)
      if (isNaN(input.index)) throw new Error(`Expected: typeof number got ${typeof input.index} @LFCTx.inputs[${key}].index`)
      if (isNaN(input.amount)) throw new Error(`Expected: typeof number got ${typeof input.amount} @LFCTx.inputs[${key}].amount`)
      if (typeof input.address !== 'string') throw new Error(`Expected: string got ${typeof input.address} @LFCTx.inputs[${key}].address`)
      if (!isHex(input.signature)) throw new Error(`Expected: hex got ${typeof input.signature} @LFCTx.inputs[${key}].signature`)
    }
  }
  if (json.outputs && json.outputs.length === 0) throw new Error('Transaction needs output!')
  if (json.outputs && json.outputs.length > 0) {
    for (const output of json.outputs) {

      if (isNaN(output.index)) throw new Error(`Expected: typeof number got ${typeof output.index} @LFCTx.outputs[${key}].index`)
      if (isNaN(output.amount)) throw new Error(`Expected: typeof number got ${typeof output.amount} @LFCTx.outputs[${key}].amount`)
      if (typeof output.address !== 'string') throw new Error(`Expected: string got ${typeof output.address} @LFCTx.outputs[${key}].address`)
    }
  }
  try {
    const serialized = serialize(json)
  } catch (e) {
    throw (e)
  }
}

export const isValid = data => {
  try {
    const valid = validate(data)
    return true
  } catch (e) {
    return false
  }
}

export { codec, defaultHashAlg }
export default { serialize, deserialize, cid, codec, defaultHashAlg, validate, isValid }
