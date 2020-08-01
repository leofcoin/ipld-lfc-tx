const test = require('tape');
const { util, LFCTx, resolver } = require('./index.js');

const hashBuffer = Buffer.alloc(32)
const hash = hashBuffer.toString('hex')
const time = new Date().getTime()

const transactions = [{
  id: hash,
  time,
  reward: 'minted',
  script: '',
  inputs: [{
    index: 0,
    tx: hash,
    amount: 150,
    address: hash,
    signature: hash
  }],
  outputs: [{
    index: 0,
    amount: 150,
    address: hash
  }]
}]

let serialized;
let deserialized;

test('can serialize', tape => {
  tape.plan(1)
  serialized = util.serialize(transactions[0])
  tape.ok(Boolean(serialized.length === 362))
})

test('can deserialize', tape => {
  tape.plan(1)
  deserialized = util.deserialize(serialized)
  tape.ok(Boolean(Object.keys(deserialized).length === 6))
})

test('deserialized is equal to serialized', tape => {
  tape.plan(1)
  let equal = true;
  for (const key of Object.keys(transactions[0])) {
    if (deserialized[key] === undefined) equal = false
  }  
  tape.ok(equal)  
})

test('can serialize without inputs.', tape => {
  tape.plan(1)
  delete transactions[0].inputs
  serialized = util.serialize(transactions[0])
  tape.ok(Buffer.isBuffer(serialized))
})

test('can convert toString() without inputs.', tape => {
  tape.plan(1)
  delete transactions[0].inputs
  serialized = util.serialize(transactions[0])
  const node = new LFCTx(serialized)
  tape.ok(node.toString())
})

test('tree', async tape => {
  tape.plan(1)
  const node = new LFCTx(serialized)
  const tree = await resolver.resolve(node.serialize())
  tape.ok(Boolean(node.reward === 'minted'))
})

test('validate', async tape => {
  tape.plan(1)
  const node = new LFCTx(serialized)
  try {
    util.validate(node)
    tape.ok(true)
  } catch (e) {
    tape.ok(false, e)  
  }
})

test('isValid', async tape => {
  tape.plan(2)
  const node = new LFCTx(serialized)
  tape.ok(util.isValid(node))
  tape.ok(node.isLFCTx, 'isLFCTx')
})

