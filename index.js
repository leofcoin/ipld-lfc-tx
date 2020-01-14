'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var CID = _interopDefault(require('cids'));
var multicodec = _interopDefault(require('multicodec'));
var multihashing = _interopDefault(require('multihashing-async'));
var protons = _interopDefault(require('protons'));
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
  optional string reward = 4;
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
const cid = async buffer => {
  const multihash = await multihashing(buffer, defaultHashAlg);
  const codecName = multicodec.print[codec];

  return new CID(1, codecName, multihash, 'base58btc')
};
var util = { serialize, deserialize, cid, codec, defaultHashAlg };

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

var LFCTx = classIs(class LFCTx {
  get _keys() {
    return ['id', 'time', 'reward', 'inputs', 'outputs']
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
      Object.defineProperty(this, key, {
        value: tx[key],
        writable: false
      });
    })
  }
  
  toJSON() {
    return this._keys.reduce((p, c) => {
      p[c] = this[c];
      return p
    }, {})
  }
  
  toString () {
    return `LFCTx <id: "${this.id.toString()}", time: "${this.time.toString()}", reward: "${this.reward.toString()}", inputs: "${this.inputs ? this.inputs.length : 0}", outputs: "${this.outputs.length}", size: ${this.size}>`
  }
  
  get size () {
    return this.serialize().length
  }

}, { className: 'LFCTx', symbolName: '@leofcoin/ipld-lfc-tx/lfc-tx'});

var index = { 
  util, codec: util.codec, defaultHashAlg: util.defaultHashAlg, LFCTx, resolver
};

module.exports = index;
