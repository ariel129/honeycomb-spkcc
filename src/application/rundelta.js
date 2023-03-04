const { plasma, block, store, TXID } = require('../../index');
const helperUtils = require('../utils/helperUtils');

const { unwrapOps, ipfspromise } = helperUtils();

function rundelta(arr, ops, sb, pr, startingBlock) {
  return new Promise((resolve, reject) => {
    var promises = [];

    for (var i = 0; i < arr.length; i++) {
      promises.push(ipfspromise(arr[i].hash));
      plasma.hashBlock = arr[i].hive_block;
      plasma.hashLastIBlock = arr[i].hash;
    }

    Promise.all(promises)
      .then((values) => {
        delta(values);
        function delta(a) {
          if (a.length) {
            console.log('Blocks to apply:', a.length);
            var b;
            try {
              b = JSON.parse(a.shift());
              block.ops = [];
              block.chain = b[1].chain;
              block.prev_root = pr;
              startingBlock = b[0];
              TXID.saveNumber = b[0];
              unwrapOps(b[1].ops).then((last) => {
                if (last.length) {
                  store.batch(last, [delta, reject, a ? a : []]);
                } else delta(a ? a : []);
              });
            } catch (e) {
              resolve([]);
            }
          } else {
            console.log('Current Block');
            block.ops = [];
            block.chain = arr;
            block.prev_root = pr;
            startingBlock = sb;
            TXID.saveNumber = sb;
            unwrapOps(ops).then((last) => {
              if (last.length) {
                store.batch(last, [reorderOps, reject, a ? a : []]);
              } else reorderOps();
            });
          }
          function reorderOps() {
            block.ops = ops;
            resolve([]);
          }
        }
      })
      .catch((e) => reject(e));
  });
}

module.exports = rundelta;
