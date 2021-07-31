'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var CID = _interopDefault(require('cids'));
var multicodec = _interopDefault(require('multicodec'));
var multihashing = _interopDefault(require('multihashing'));
var protons = _interopDefault(require('protons'));
var ishex = require('ishex');
var classIs = _interopDefault(require('class-is'));

var proto = `// Leofcoin Transaction

message LFCOutput {
  required uint64 index = 1;
  required uint64 amount = 2;
  required string address = 3;
}

message LFCInput {
  required uint64 index = 1;
  required string tx = 2;
  required uint64 amount = 3;
  required string address = 4;
  required string signature = 5;
}

message LFCTransaction {
  required string id = 1;
  required uint64 time = 2;
  required string reward = 3;
  required string script = 4;
  repeated LFCInput inputs = 5;
  repeated LFCOutput outputs = 6;
}`;

const codec = multicodec.LEOFCOIN_TX;
const defaultHashAlg = multicodec.KECCAK_256;

const serialize = block => {
  return protons(proto).LFCTransaction.encode(block)
};

const deserialize = buffer => {
  return protons(proto).LFCTransaction.decode(buffer)
};

/**
 * @returns {Promise.<CID>}
 */
const cid = buffer => {
  const multihash = multihashing(buffer, defaultHashAlg);
  const codecName = multicodec.print[codec];
  return new CID(1, codecName, multihash, 'base58btc')
};

const validate = json => {
  if (json.isLFCTx) json = json.toJSON();

  if (json.id.length !== 64) throw new Error(`Expected: 64 got ${json.id.length} @LFCTx.id.length`)
  if (isNaN(json.time)) throw new Error(`Expected: typeof number got ${typeof json.time} @LFCTx.time`)
  if (json.reward && json.reward !== 'mined' && json.reward !== 'minted' && json.reward !== '0x') throw new Error(`Expected: mined or minted got ${json.reward} @LFCTx.reward`)
  if (json.script && typeof json.script !== 'string') throw new Error(`Expected: typeof string got ${typeof json.script} @LFCTx.script`)

  if (json.inputs && json.inputs.length > 0) {
    for (const key of json.inputs) {
      const input = json.inputs[key];
      if (input.tx.length !== 64) throw new Error(`Expected: 64 got ${input.tx.length} @LFCTx.inputs[${key}].tx.length`)
      if (isNaN(input.index)) throw new Error(`Expected: typeof number got ${typeof input.index} @LFCTx.inputs[${key}].index`)
      if (isNaN(input.amount)) throw new Error(`Expected: typeof number got ${typeof input.amount} @LFCTx.inputs[${key}].amount`)
      if (typeof input.address !== 'string') throw new Error(`Expected: string got ${typeof input.address} @LFCTx.inputs[${key}].address`)
      if (!ishex.isHex(input.signature)) throw new Error(`Expected: hex got ${typeof input.signature} @LFCTx.inputs[${key}].signature`)
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
    const serialized = serialize(json);
  } catch (e) {
    throw (e)
  }
};

const isValid = data => {
  try {
    const valid = validate(data);
    return true
  } catch (e) {
    return false
  }
};
var util = { serialize, deserialize, cid, codec, defaultHashAlg, validate, isValid };

const error = text => {
  const stack = new Error().stack;
  const caller = stack.split('\n')[2].trim();
  console.groupCollapsed(text);
  console.log(caller);
  console.groupEnd();
  return
};
/**
 *  Resolves a path within a LFC block
 *
 * @param {Buffer} buffer - Binary representation of an LFC transaction
 * @param {String} [path='/'] - Path to resolve
 * @returns {Object} result - Result of the path if it was resolved successfully
 * @returns {*} result.value - Value the path resolved with
 * @returns {string} result.remainderPath - If the path resolves half-way to a
 *   link, then the `remainderPath` is the part after the link that can be used
 *   for further resolving
 *
 */
const resolve = (buffer, path = '/') => {
  let value = deserialize(buffer);
  
  const parts = path.split('/').filter(Boolean);
  
  while (parts.length) {
    const key = parts.shift();
    if (value[key] === undefined) throw error(`LFCTx has no property '${key}'`)
    
    value = value[key];
    if (CID.isCID(value)) {
      return {
        value,
        remainderPath: parts.join('/')
      }
    }
  }
  return {
    value,
    remainderPath: ''
  }
};

const traverse = function * (node, path) {
  if (Buffer.isBuffer(node) || CID.isCID(node) || typeof node === 'string' ||
      node === null) {
    return
  }
  for (const item of Object.keys(node)) {
    const nextpath = path === undefined ? item : path + '/' + item;
    yield nextpath;
    yield * traverse(node[item], nextpath);
  }
};

const tree = function * (buffer) {
  const node = deserialize(buffer);
  yield * traverse(node);
};

var resolver = { resolve, traverse, tree };

var index = classIs(class LFCTx {
  get _keys() {
    return ['id', 'time', 'reward', 'inputs', 'outputs', 'script']
  }

  constructor(tx) {
    if (Buffer.isBuffer(tx)) {
      this._defineTx(deserialize(tx));
    } else if (tx) {
      this._defineTx(tx);
    }
  }

  serialize() {
    return serialize(this._keys.reduce((p, c) => {
      p[c] = this[c];
      return p
    }, {}))
  }

  _defineTx(tx) {
    return this._keys.forEach(key => {
      if (key === 'script') tx[key] = tx[key] || '0x';
      if (key === 'reward') tx[key] = tx[key] || '0x';
      Object.defineProperty(this, key, {
        value: tx[key],
        writable: false
      });
    })
  }

  toJSON() {
    return this._keys.reduce((p, c) => {
      let value = this[c];
      if (value === undefined && c === 'inputs') value = [];
      if (value === undefined && c === 'script') value = '0x';
      if (value === undefined && c === 'reward') value = '0x';
      p[c] = value;
      return p
    }, {})
  }

  toString () {
    return `LFCTx <id: "${this.id.toString()}", time: "${this.time.toString()}", ${this.reward ? `reward: "${this.reward.toString()}", ` : ', '}inputs: "${this.inputs ? this.inputs.length : 0}", outputs: "${this.outputs.length}"${this.script ? `, script: ${this.script.toString()}` : ''}, size: ${this.size}>`
  }

  get isLFCTx() {
    return true
  }

  get size () {
    return this.serialize().length
  }

}, { className: 'LFCTx', symbolName: '@leofcoin/ipld-lfc-tx/lfc-tx'});

const codec$1 = util.codec;

exports.LFCTx = index;
exports.codec = codec$1;
exports.resolver = resolver;
exports.util = util;
