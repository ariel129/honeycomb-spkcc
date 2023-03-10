import fetch from 'node-fetch';
import { CONFIG } from '@config';
import {
  BLOCK,
  PLASMA,
  STARTING_BLOCK,
  TXIDUtils,
  unwrapOps,
} from '@src/utils';
import { store } from '..';

const IpfsService = () => {
  const ipfspromise = async (hash: string) => {
    return new Promise((resolve, reject) => {
      const ipfslinks = CONFIG.ipfsLinks;
      if (CONFIG.ipfshost == 'ipfs') {
        catIPFS(hash, 0, ipfslinks);
      } else {
        catIPFS(hash, 1, ipfslinks);
      }

      function catIPFS(hash: string, i: number, arr: string[]) { 
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
              reject(e);
            }
          });
      }
    });
  };

  const rundelta = async (arr: any, ops: any, sb: any, pr: any) => {
    return new Promise((resolve, reject) => {
      const promises = [];

      for (let i = 0; i < arr.length; i++) {
        promises.push(ipfspromise(arr[i].hash));
        PLASMA.hashBlock = arr[i].hive_block;
        PLASMA.hashLastIBlock = arr[i].hash;
      }

      Promise.all(promises)
        .then((values) => {
          delta(values);
          function delta(a: any) {
            if (a.length) {
              console.log('Blocks to apply:', a.length);
              var b;
              try {
                b = JSON.parse(a.shift());
                BLOCK.ops = [];
                BLOCK.chain = b[1].chain;
                BLOCK.prev_root = pr;
                STARTING_BLOCK.startingBlock = b[0];
                TXIDUtils.saveNumber = b[0];
                unwrapOps(b[1].ops).then((last: any) => {
                  if (last.length) {
                    store.batch(last, [delta, reject, a ? a : []]);
                  } else delta(a ? a : []);
                });
              } catch (e) {
                resolve([]);
              }
            } else {
              console.log('Current Block');
              BLOCK.ops = [];
              BLOCK.chain = arr;
              BLOCK.prev_root = pr;
              STARTING_BLOCK.startingBlock = sb;
              TXIDUtils.saveNumber = sb;
              unwrapOps(ops).then((last: any) => {
                if (last.length) {
                  store.batch(last, [reorderOps, reject, a ? a : []]);
                } else reorderOps();
              });
            }
            function reorderOps() {
              BLOCK.ops = ops;
              resolve([]);
            }
          }
        })
        .catch((e) => reject(e));
    });
  };

  return {
    ipfspromise,
    rundelta,
  };
};

export default IpfsService;
