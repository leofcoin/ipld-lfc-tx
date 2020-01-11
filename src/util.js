import CID from 'cids'
import multicodec from 'multicodec'
import multihashing from 'multihashing-async'
import protons from 'protons'
import proto from './proto.js'

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
export const cid = async buffer => {
  const multihash = await multihashing(buffer, defaultHashAlg)
  const codecName = multicodec.print[codec]

  return new CID(1, codecName, multihash, 'base58btc')
}

export { codec, defaultHashAlg }
export default { serialize, deserialize, cid, codec, defaultHashAlg }