const stringify = require('json-stable-stringify');
const {
  ChainTypes,
  makeBitMaskFilter,
} = require('@hiveio/hive-js/lib/auth/serializer');
const CONFIG = require('../../config');
const { VERSION, block, store, hiveClient, TXID } = require('../../index');
const API = require('../../routes/api');
 
const helperUtils = require('../utils/helperUtils');
const startApp = require('./startApp');
const rundelta = require('./rundelta');

const { ipfspromise, issc } = helperUtils();
const op = ChainTypes.operations;
const walletOperationsBitmask = makeBitMaskFilter([op.custom_json]);

var startingBlock = CONFIG.starting_block;

//pulls state from IPFS, loads it into memory, starts the block processor
function startWith(hash, second) {
  console.log(`${VERSION} =>\n ${hash} inserted`);
  if (hash && hash != 'pending') {
    console.log(`Attempting to start from IPFS save state ${hash}`);
    ipfspromise(hash)
      .then((blockInfo) => {
        if (blockInfo[0] == 'D') console.log(blockInfo);
        var blockinfo = JSON.parse(blockInfo);
        ipfspromise(blockinfo[1].root ? blockinfo[1].root : hash).then(
          (file) => {
            var data = JSON.parse(file);
            startingBlock = data[0];
            block.root = blockinfo[1].root ? blockinfo[1].root : hash;
            block.prev_root = data[1].prev_root
              ? data[1].prev_root
              : data[1].stats.root || '';
            console.log('root', block.root);
            if (!startingBlock) {
              startWith(sh);
            } else {
              store.del([], function (e) {
                if (!e && (second || data[0] > API.RAM.head - 325)) {
                  if (hash) {
                    var cleanState = data[1];
                    // cleanState.stats.spk_rate_lgov = "0.001"
                    // cleanState.stats.spk_rate_ldel = "0.00015"
                    // cleanState.stats.spk_rate_lpow = "0.0001"
                    // cleanState.runners = {
                    //   regardspk: {
                    //     g: 1,
                    //   }
                    // };
                    store.put([], cleanState, function (err) {
                      if (err) {
                        console.log('errr', err);
                      } else {
                        if (blockinfo[1].chain) {
                          rundelta(
                            blockinfo[1].chain,
                            blockinfo[1].ops,
                            blockinfo[0],
                            blockinfo[1].prev_root,
                            startingBlock
                          )
                            .then((empty) => {
                              const blockState = Buffer.from(
                                stringify([startingBlock, block])
                              );
                              block.ops = [];
                              issc(startingBlock, blockState, startApp, 0, 1);
                              store.get(
                                ['stats', 'lastBlock'],
                                function (error, returns) {
                                  if (!error) {
                                    console.log(
                                      `State Check:  ${returns}\nAccount: ${
                                        CONFIG.username
                                      }\nKey: ${CONFIG.active.substr(0, 3)}...`
                                    );
                                    let info = API.coincheck(cleanState);
                                    console.log('check', info.check);
                                    if (
                                      cleanState.stats.tokenSupply !=
                                      info.supply
                                    ) {
                                      console.log('check', info.info);
                                    }
                                  }
                                }
                              );
                              //getPathNum(['balances', 'ra']).then(r=>console.log(r))
                            })
                            .catch((e) =>
                              console.log('Failure of rundelta', e)
                            );
                        } else {
                          console.log('No Chain');
                          TXID.saveNumber = startingBlock;
                          startApp();
                        }
                      }
                    });
                  } else {
                    store.put([], data[1], function (err) {
                      if (err) {
                        console.log(err);
                      } else {
                        store.get(
                          ['balances', 'ra'],
                          function (error, returns) {
                            if (!error) {
                              console.log('there' + returns);
                            }
                          }
                        );
                        startApp();
                      }
                    });
                  }
                } else if (!second) {
                  var promises = [];
                  for (var runner in data[1].runners) {
                    promises.push(
                      new Promise((resolve, reject) => {
                        console.log('runner', runner);
                        hiveClient.api.setOptions({ url: CONFIG.startURL });
                        hiveClient.api.getAccountHistory(
                          runner,
                          -1,
                          100,
                          ...walletOperationsBitmask,
                          function (err, result) {
                            var recents = { block: 0 };
                            if (err) {
                              console.log('error in retrieval');
                              resolve({ hash: null, block: null });
                            } else {
                              let ebus = result.filter(
                                (tx) =>
                                  tx[1].op[1].id === `${CONFIG.prefix}report`
                              );
                              for (i = ebus.length - 1; i >= 0; i--) {
                                if (JSON.parse(ebus[i][1].op[1].json).hash) {
                                  if (
                                    recents.block <
                                    JSON.parse(ebus[i][1].op[1].json).block
                                  ) {
                                    recents = {
                                      hash: JSON.parse(ebus[i][1].op[1].json)
                                        .hash,
                                      block: parseInt(
                                        JSON.parse(ebus[i][1].op[1].json).block
                                      ),
                                    };
                                  } else {
                                    recents[0] = {
                                      hash: JSON.parse(ebus[i][1].op[1].json)
                                        .hash,
                                      block: parseInt(
                                        JSON.parse(ebus[i][1].op[1].json).block
                                      ),
                                    };
                                  }
                                }
                              }
                              if (recents.block) {
                                resolve(recents);
                              } else {
                                console.log('error in processing');
                                resolve({ hash: null, block: null });
                              }
                            }
                          }
                        );
                      })
                    );
                  }
                  Promise.all(promises).then((values) => {
                    hiveClient.api.setOptions({ url: CONFIG.clientURL });
                    var newest = 0,
                      votes = {},
                      blocks = {};
                    for (var acc in values) {
                      if (
                        values[acc].block >= newest &&
                        !votes[values[acc].hash]
                      ) {
                        newest = values[acc].block;
                        votes[values[acc].hash] = 1;
                        blocks[values[acc].hash] = values[acc].block;
                      } else if (
                        values[acc].block >= newest &&
                        votes[values[acc].hash]
                      ) {
                        votes[values[acc].hash]++;
                      }
                    }
                    var tally = 0,
                      winner = null;
                    for (hash in votes) {
                      if (
                        votes[hash] >= tally &&
                        blocks[values[acc].hash] == newest
                      ) {
                        tally = votes[hash];
                        var winner = hash;
                      }
                    }
                    if (winner) startWith(winner, true);
                    else startWith(hash, true);
                    return;
                  });
                }
              });
            }
          }
        );
      })
      .catch((e) => {
        console.log('error in ipfs', e);
        process.exit(4);
      });
  } else {
    startingBlock = CONFIG.starting_block;
    store.del([], function (e) {
      if (e) {
        console.log({ e });
      }
      store.put([], statestart, function (err) {
        if (err) {
          console.log({ err });
        } else {
          store.get(['stats', 'hashLastIBlock'], function (error, returns) {
            if (!error) {
              console.log(
                `State Check:  ${returns}\nAccount: ${
                  CONFIG.username
                }\nKey: ${CONFIG.active.substr(0, 3)}...`
              );
            }
          });
          TXID.saveNumber = CONFIG.starting_block;
          startApp();
        }
      });
    });
  }
}

module.exports = startWith;
