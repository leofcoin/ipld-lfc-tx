const test = require('tape');
const { util, LFCTx, resolver } = require('./index.js');

const hashBuffer = Buffer.alloc(32)
const hash = hashBuffer.toString('hex')
const time = new Date().getTime()

const transactions = [{
  id: hash,
  time,
  hash,
  reward: 'minted',
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
  console.log(serialized.length);
  tape.ok(Boolean(serialized.length === 426))
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

test('LFCTx', async tape => {
  tape.plan(1)
  const node = new LFCTx(serialized)
  console.log(node.toJSON());
  const tree = await resolver.resolve(node.serialize())
  console.log(tree);
  tape.ok(Boolean(node.reward === 'minted'))
})