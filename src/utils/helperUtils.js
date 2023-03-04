const fetch = require('node-fetch');
const CONFIG = require('../../config');
const { ipfsSaveState } = require('../../ipfsSaveState');
const { exit, store } = require('../../index');

const helperUtils = () => {
  function unwrapOps(arr) {
    return new Promise((resolve, reject) => {
      var d = [];
      if (arr[arr.length - 1] !== 'W') arr.push('W');
      if (arr.length) write(0);
      else resolve([]);
      function write(int) {
        d = [];
        for (var i = int; i < arr.length; i++) {
          var e = arr[i];
          try {
            e = JSON.parse(e);
          } catch (e) {
            e = arr[i];
          }
          if (e == 'W' && i == arr.length - 1) {
            store.batch(d, [resolve, null, i + 1]);
            break;
          } else if (e == 'W') {
            store.batch(d, [write, null, i + 1]);
            break;
          } else d.push(e);
        }
      }
    });
  }

  function ipfspromise(hash) {
    return new Promise((resolve, reject) => {
      const ipfslinks = CONFIG.ipfsLinks;
      if (CONFIG.ipfshost == 'ipfs') {
        catIPFS(hash, 0, ipfslinks);
      } else {
        catIPFS(hash, 1, ipfslinks);
      }
      function catIPFS(hash, i, arr) {
        fetch(arr[i] + hash)
          .then((r) => r.text())
          .then((res) => {
            if (res.split('')[0] == '<') {
              console.log('HTML IPFS reply');
              catIPFS(hash, i + 1, ipfslinks);
            } else resolve(res);
          })
          .catch((e) => {
            if (i < arr.length - 1) {
              catIPFS(hash, i + 1, ipfslinks);
            } else {
              console.log('End of IPFS tries');
              //reject(e);
            }
          });
      }
    });
  }

  function issc(n, b, i, r, a) {
    ipfsSaveState(n, b, i, r, a)
      .then((pla) => {
        TXID.saveNumber = pla.hashBlock;
        block.chain.push({ hash: pla.hashLastIBlock, hive_block: n - a });
        plasma.hashSecIBlock = plasma.hashLastIBlock;
        plasma.hashLastIBlock = pla.hashLastIBlock;
        plasma.hashBlock = pla.hashBlock;
        if (
          block.chain.length > 2 &&
          block.chain[block.chain.length - 2].hive_block <
            block.chain[block.chain.length - 1].hive_block - 100
        ) {
          exit(block.chain[block.chain.length - 2].hash, 'Chain Out Of Order');
        } else if (typeof i == 'function') {
          console.log('Requesting Blocks from:', CONFIG.clientURL);
          i();
        }
      })
      .catch((e) => {
        if (r < 2) {
          console.log('Retrying IPFS Save');
          setTimeout(() => {
            issc(n, b, i, r++, a);
          }, 1000);
        } else {
          exit(plasma.hashLastIBlock, 'IPFS Save Failed');
        }
      });
  }

  return {
    unwrapOps,
    ipfspromise,
    issc,
  };
};

module.exports = helperUtils;
