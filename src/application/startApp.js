const CONFIG = require('../../config');
const { processor, store, ipfs, TXID, client } = require('../../index');
const { release } = require('../../processing_routes/dex');
const { enforce } = require('../../enforce');
const { tally } = require('../../tally');
const { voter } = require('../../voter');
const { report, sig_submit, osig_submit } = require('../../report');
const { ipfsSaveState } = require('../../ipfsSaveState');
const { dao, Liquidity } = require('../../dao');
const { recast } = require('../../lil_ops');
const hiveState = require('../../processor');
const { getPathObj, getPathNum, getPathSome } = require('../../getPathObj');
const { consolidate, osign, sign } = require('../../msa');
const HR = require('../../processing_routes/index');
const { NFT, Chron, Log } = require('../../helpers');

var startingBlock = CONFIG.starting_block;

/* Starts block processor after memory has been loaded */
function startApp() {
  TXID.blocknumber = 0;
  if (CONFIG.ipfshost == 'ipfs')
    ipfs.id(function (err, res) {
      if (err) {
      }
      if (res) plasma.id = res.id;
    });
  processor = hiveState(client, startingBlock, CONFIG.prefix, CONFIG.username);
  processor.on('send', HR.send);
  processor.on('spk_send', HR.spk_send);
  processor.on('claim', HR.drop_claim);
  processor.on('shares_claim', HR.shares_claim);
  processor.on('node_add', HR.node_add);
  //processor.on("node_delete", HR.node_delete);
  processor.on('report', HR.report);
  processor.on('gov_down', HR.gov_down); //larynx collateral
  processor.on('gov_up', HR.gov_up); //larynx collateral
  processor.on('val_reg', HR.val_reg); //register a validator node
  processor.on('val_add', HR.val_add); //add more branded shares to a validator node
  processor.on('val_bytes', HR.val_bytes); //validate contract size in bytes
  processor.on('val_del', HR.val_del); //contest contract sie
  processor.on('val_bundle', HR.val_bundle); //Place IPFS bundle on storage market
  processor.on('val_report', HR.val_report); //Validator report
  processor.on('val_check', HR.val_check); //Validator second check -> merge to val_report
  processor.onOperation('account_update', HR.account_update);
  processor.onOperation('comment', HR.comment);
  processor.on('queueForDaily', HR.q4d);
  processor.on('nomention', HR.nomention);
  processor.on('power_up', HR.power_up);
  processor.on('power_down', HR.power_down);
  processor.on('power_grant', HR.power_grant);
  if (CONFIG.features.pob) {
    processor.on('power_up', HR.power_up); // power up tokens for vote power in layer 2 token proof of brain
    processor.on('power_down', HR.power_down);
    processor.on('power_grant', HR.power_grant);
    processor.on('vote_content', HR.vote_content);
    processor.onOperation('vote', HR.vote); //layer 2 voting
    processor.onOperation(
      'delegate_vesting_shares',
      HR.delegate_vesting_shares
    );
    processor.onOperation('comment_options', HR.comment_options);
    processor.on('cjv', HR.cjv);
    processor.on('cert', HR.cert); // json.cert is an open ended hope to interact with executable posts... unexplored
  }
  if (CONFIG.features.dex) {
    processor.on('dex_sell', HR.dex_sell);
    processor.on('dex_clear', HR.dex_clear);
    processor.on('sig_submit', HR.sig_submit); //dlux is for putting executable programs into IPFS... this is for additional accounts to sign the code as non-malicious
    processor.on('osig_submit', HR.osig_submit);
  }
  if (CONFIG.features.dex || CONFIG.features.nft || CONFIG.features.ico) {
    processor.onOperation('transfer', HR.transfer);
  }
  if (CONFIG.features.nft) {
    processor.on('ft_bid', HR.ft_bid);
    processor.on('ft_auction', HR.ft_auction);
    processor.on('ft_sell_cancel', HR.ft_sell_cancel);
    processor.on('ft_buy', HR.ft_buy);
    processor.on('ft_sell', HR.ft_sell);
    processor.on('ft_escrow_cancel', HR.ft_escrow_cancel);
    processor.on('ft_escrow_complete', HR.ft_escrow_complete);
    processor.on('ft_escrow', HR.ft_escrow);
    processor.on('fts_sell_h', HR.fts_sell_h);
    processor.on('fts_sell_hcancel', HR.fts_sell_hcancel);
    processor.on('nft_buy', HR.nft_buy);
    processor.on('nft_sell', HR.nft_sell);
    processor.on('nft_sell_cancel', HR.nft_sell_cancel);
    processor.on('ft_transfer', HR.ft_transfer);
    processor.on('ft_airdrop', HR.ft_airdrop);
    processor.on('nft_transfer', HR.nft_transfer);
    processor.on('nft_auction', HR.nft_auction);
    processor.on('nft_hauction', HR.nft_hauction);
    processor.on('nft_bid', HR.nft_bid);
    processor.on('nft_transfer_cancel', HR.nft_transfer_cancel);
    processor.on('nft_reserve_transfer', HR.nft_reserve_transfer);
    processor.on('nft_reserve_complete', HR.nft_reserve_complete);
    processor.on('nft_define', HR.nft_define);
    processor.on('nft_add_roy', HR.nft_add_roy);
    processor.on('nft_div', HR.nft_div);
    processor.on('nft_define_delete', HR.nft_define_delete);
    processor.on('nft_melt', HR.nft_delete);
    processor.on('nft_mint', HR.nft_mint);
    processor.on('nft_pfp', HR.nft_pfp);
  }
  //do things in cycles based on block time
  processor.onBlock(function (num, pc, prand, bh) {
    Log.block(num);
    if (num < TXID.blocknumber) {
      require('process').exit(2);
    } else {
      TXID.clean(num);
    }
    return new Promise((resolve, reject) => {
      let Pchron = getPathSome(['chrono'], {
        gte: '' + num - 1,
        lte: '' + (num + 1),
      });
      let Pmss = getPathSome(['mss'], {
        gte: '' + (num - 1000000),
        lte: '' + (num - 100),
      }); //resign mss
      let Pmsso = getPathSome(['msso'], {
        gte: '' + (num - 1000000),
        lte: '' + (num - 100),
      });
      let Pmsa = getPathObj(['msa']);
      let Pmso = getPathObj(['mso']);
      Promise.all([Pchron, Pmss, Pmsa, Pmso, Pmsso]).then((mem) => {
        var a = mem[0],
          mss = mem[1], //resign mss
          msa = mem[2], //if length > 80... sign these
          mso = mem[3],
          msso = mem[4],
          mso_keys = Object.keys(mso);
        let chrops = {},
          msa_keys = Object.keys(msa);
        for (var i in a) {
          chrops[a[i]] = a[i];
        }
        var ints = 0;
        let j = Object.keys(chrops);
        loop(0, ints, j);
        function loop(i, ints, j) {
          ints++;
          let delKey = chrops[j[i]];
          if (i < j.length)
            ChonOp(delKey, ints, prand, num).then((x) => {
              i++;
              if (i < j.length) loop(i, ints, j);
              else every();
            });
          else every();
          function ChonOp(delKey, ints, prand, num) {
            return new Promise((res, rej) => {
              store.getWith(
                ['chrono', chrops[j[i]]],
                { delKey, ints },
                function (e, b, passed) {
                  switch (b.op) {
                    case 'rm':
                      store.batch(
                        [
                          { type: 'del', path: ['f', b.f] },
                          {
                            type: 'del',
                            path: ['chrono', passed.delKey],
                          },
                        ],
                        [res, rej, 'info']
                      );
                      break;
                    case 'mint':
                      //{op:"mint", set:json.set, for: from}
                      let setp = getPathObj(['sets', b.set]);
                      NFT.mintOp(
                        [setp],
                        passed.delKey,
                        num,
                        b,
                        `${passed.ints}${prand}`
                      ).then((x) => res(x));
                      break;
                    case 'ahe':
                      let ahp = getPathObj(['ah', b.item]),
                        setahp = '';
                      if (b.item.split(':')[0] != 'Qm')
                        setahp = getPathObj(['sets', b.item.split(':')[0]]);
                      else
                        setahp = getPathObj([
                          'sets',
                          `Qm${b.item.split(':')[1]}`,
                        ]);
                      NFT.AHEOp([ahp, setahp], passed.delKey, num, b).then(
                        (x) => res(x)
                      );
                      break;
                    case 'ahhe':
                      let ahhp = getPathObj(['ahh', b.item]),
                        setahhp = '';
                      if (b.item.split(':')[0] != 'Qm')
                        setahhp = getPathObj(['sets', b.item.split(':')[0]]);
                      else
                        setahhp = getPathObj([
                          'sets',
                          `Qm${b.item.split(':')[1]}`,
                        ]);
                      NFT.AHHEOp(
                        [ahhp, setahhp],
                        passed.delKey,
                        num,
                        b,
                        bh.timestamp
                      ).then((x) => res(x));
                      break;
                    case 'ame':
                      let amp = getPathObj(['am', b.item]),
                        setamp = '';
                      if (b.item.split(':')[0] != 'Qm')
                        setamp = getPathObj(['sets', b.item.split(':')[0]]);
                      else
                        setamp = getPathObj([
                          'sets',
                          `Qm${b.item.split(':')[1]}`,
                        ]);
                      NFT.AMEOp([amp, setamp], passed.delKey, num, b).then(
                        (x) => res(x)
                      );
                      break;
                    case 'div':
                      let contract = getPathObj(['div', b.set]),
                        set = getPathObj(['sets', b.set]),
                        sales = getPathObj(['ls']),
                        auctions = getPathObj(['ah']);
                      NFT.DividendOp(
                        [contract, set, sales, auctions],
                        passed.delKey,
                        num,
                        b
                      ).then((x) => res(x));
                      break;
                    case 'del_pend':
                      store.batch(
                        [
                          { type: 'del', path: ['chrono', passed.delKey] },
                          {
                            type: 'del',
                            path: ['pend', `${b.author}/${b.permlink}`],
                          },
                        ],
                        [res, rej, 'info']
                      );
                      break;
                    case 'ms_send':
                      recast(b.attempts, b.txid, num);
                      store.batch(
                        [{ type: 'del', path: ['chrono', passed.delKey] }],
                        [res, rej, 'info']
                      );
                      break;
                    case 'expire':
                      release(b.from, b.txid, num);
                      store.batch(
                        [{ type: 'del', path: ['chrono', passed.delKey] }],
                        [res, rej, 'info']
                      );
                      break;
                    case 'check':
                      enforce(b.agent, b.txid, { id: b.id, acc: b.acc }, num);
                      store.batch(
                        [{ type: 'del', path: ['chrono', passed.delKey] }],
                        [res, rej, 'info']
                      );
                      break;
                    case 'denyA':
                      enforce(b.agent, b.txid, { id: b.id, acc: b.acc }, num);
                      store.batch(
                        [{ type: 'del', path: ['chrono', passed.delKey] }],
                        [res, rej, 'info']
                      );
                      break;
                    case 'denyT':
                      enforce(b.agent, b.txid, { id: b.id, acc: b.acc }, num);
                      store.batch(
                        [{ type: 'del', path: ['chrono', passed.delKey] }],
                        [res, rej, 'info']
                      );
                      break;
                    case 'gov_down': //needs work and testing
                      let plb = getPathNum(['balances', b.by]),
                        tgovp = getPathNum(['gov', 't']),
                        govp = getPathNum(['gov', b.by]);
                      Chron.govDownOp(
                        [plb, tgovp, govp],
                        b.by,
                        passed.delKey,
                        num,
                        passed.delKey.split(':')[1],
                        b
                      ).then((x) => res(x));
                      break;
                    case 'power_down': //needs work and testing
                      let lbp = getPathNum(['balances', b.by]),
                        tpowp = getPathNum(['pow', 't']),
                        powp = getPathNum(['pow', b.by]);
                      Chron.powerDownOp(
                        [lbp, tpowp, powp],
                        b.by,
                        passed.delKey,
                        num,
                        passed.delKey.split(':')[1],
                        b
                      ).then((x) => res(x));
                      break;
                    case 'post_reward':
                      Chron.postRewardOP(
                        b,
                        num,
                        passed.delKey.split(':')[1],
                        passed.delKey
                      ).then((x) => res(x));
                      break;
                    case 'post_vote':
                      Chron.postVoteOP(b, passed.delKey).then((x) => res(x));
                      break;
                    default:
                  }
                }
              );
            });
          }
        }
        function every() {
          return new Promise((res, rej) => {
            let promises = [HR.margins()];
            if (num % 100 !== 50) {
              if (mso_keys.length) {
                promises.push(
                  new Promise((res, rej) => {
                    osig_submit(osign(num, 'mso', mso_keys, bh))
                      .then((nodeOp) => {
                        res('SAT');
                        try {
                          if (plasma.rep && JSON.parse(nodeOp[1][1].json).sig)
                            NodeOps.unshift(nodeOp);
                        } catch (e) {}
                      })
                      .catch((e) => {
                        rej(e);
                      });
                  })
                );
              } else if (msso.length) {
                promises.push(
                  new Promise((res, rej) => {
                    osig_submit(osign(num, 'msso', msso, bh))
                      .then((nodeOp) => {
                        res('SAT');
                        try {
                          if (plasma.rep && JSON.parse(nodeOp[1][1].json).sig)
                            NodeOps.unshift(nodeOp); //check to see if sig
                        } catch (e) {}
                      })
                      .catch((e) => {
                        rej(e);
                      });
                  })
                );
              } else if (msa_keys.length > 80) {
                promises.push(
                  new Promise((res, rej) => {
                    sig_submit(consolidate(num, plasma, bh))
                      .then((nodeOp) => {
                        res('SAT');
                        if (plasma.rep) NodeOps.unshift(nodeOp);
                      })
                      .catch((e) => {
                        rej(e);
                      });
                  })
                );
              }
              for (var missed = 0; missed < mss.length; missed++) {
                if (mss[missed].split(':').length == 1) {
                  missed_num = mss[missed];
                  promises.push(
                    new Promise((res, rej) => {
                      sig_submit(sign(num, plasma, missed_num, bh))
                        .then((nodeOp) => {
                          res('SAT');
                          if (JSON.parse(nodeOp[1][1].json).sig) {
                            NodeOps.unshift(nodeOp);
                          }
                        })
                        .catch((e) => {
                          rej(e);
                        });
                    })
                  );
                  break;
                }
              }
            }
            if (num % 100 === 0 && processor.isStreaming()) {
              client.database
                .getDynamicGlobalProperties()
                .then(function (result) {
                  console.log(
                    'At block',
                    num,
                    'with',
                    result.head_block_number - num,
                    `left until real-time. DAO in ${
                      30240 - ((num - 20000) % 28800)
                    } blocks`
                  );
                });
            }
            if (num % 100 === 50) {
              promises.push(
                new Promise((res, rej) => {
                  report(plasma, consolidate(num, plasma, bh))
                    .then((nodeOp) => {
                      res('SAT');
                      if (processor.isStreaming()) NodeOps.unshift(nodeOp);
                    })
                    .catch((e) => {
                      rej(e);
                    });
                })
              );
            }
            if ((num - 18505) % 28800 === 0) {
              //time for daily magic
              promises.push(dao(num));
              block.prev_root = block.root;
              block.root = '';
            }
            if (num % 100 === 0) {
              promises.push(tally(num, plasma, processor.isStreaming()));
            }
            if (num % 100 === 99) {
              if (CONFIG.features.liquidity) promises.push(Liquidity());
            }
            if ((num - 2) % 3000 === 0) {
              promises.push(voter());
            }
            Promise.all(promises).then(() => resolve(pc));
          });
        }
        if (num % 100 === 1 && !block.root) {
          block.root = 'pending';
          block.chain = [];
          block.ops = [];
          store.get([], function (err, obj) {
            const blockState = Buffer.from(stringify([num + 1, obj]));
            ipfsSaveState(num, blockState, ipfs)
              .then((pla) => {
                TXID.saveNumber = pla.hashBlock;
                block.root = pla.hashLastIBlock;
                plasma.hashSecIBlock = plasma.hashLastIBlock;
                plasma.hashLastIBlock = pla.hashLastIBlock;
                plasma.hashBlock = pla.hashBlock;
              })
              .catch((e) => {
                console.log(e);
              });
          });
        } else if (num % 100 === 1) {
          const blockState = Buffer.from(stringify([num + 1, block]));
          block.ops = [];
          issc(num, blockState, null, 0, 0);
        }
        if (CONFIG.active && processor.isStreaming()) {
          store.get(['escrow', CONFIG.username], function (e, a) {
            if (!e) {
              for (b in a) {
                if (!plasma.pending[b]) {
                  NodeOps.push([[0, 0], JSON.parse(a[b])]);
                  plasma.pending[b] = true;
                }
              }
              var ops = [],
                cjbool = false,
                votebool = false;
              signerloop: for (i = 0; i < NodeOps.length; i++) {
                if (NodeOps[i][0][1] == 0 && NodeOps[i][0][0] <= 100) {
                  if (
                    NodeOps[i][1][0] == 'custom_json' &&
                    JSON.parse(NodeOps[i][1][1].json).sig_block &&
                    num - 100 > JSON.parse(NodeOps[i][1][1].json).sig_block
                  ) {
                    NodeOps.splice(i, 1);
                    continue signerloop;
                  }
                  if (NodeOps[i][1][0] == 'custom_json' && !cjbool) {
                    ops.push(NodeOps[i][1]);
                    NodeOps[i][0][1] = 1;
                    cjbool = true;
                  } else if (NodeOps[i][1][0] == 'custom_json') {
                    // don't send two jsons at once
                  } else if (NodeOps[i][1][0] == 'vote' && !votebool) {
                    ops.push(NodeOps[i][1]);
                    NodeOps[i][0][1] = 1;
                    votebool = true;
                  } else if (NodeOps[i][1][0] == 'vote') {
                    // don't send two votes at once
                  } else {
                    //need transaction limits here... how many votes or transfers can be done at once?
                    ops.push(NodeOps[i][1]);
                    NodeOps[i][0][1] = 1;
                  }
                } else if (NodeOps[i][0][0] < 100) {
                  NodeOps[i][0][0]++;
                } else if (NodeOps[i][0][0] == 100) {
                  NodeOps[i][0][0] = 0;
                }
              }
              for (i = 0; i < NodeOps.length; i++) {
                if (NodeOps[i][0][2] == true) {
                  NodeOps.splice(i, 1);
                }
              }
              if (ops.length) {
                console.log('attempting broadcast', ops);
                broadcastClient.broadcast.send(
                  {
                    extensions: [],
                    operations: ops,
                  },
                  [CONFIG.active],
                  (err, result) => {
                    if (err) {
                      console.log(err); //push ops back in.
                      for (q = 0; q < ops.length; q++) {
                        if (NodeOps[q][0][1] == 1) {
                          NodeOps[q][0][1] = 3;
                        }
                      }
                    } else {
                      console.log('Success! txid: ' + result.id);
                      for (q = ops.length - 1; q > -1; q--) {
                        if ((NodeOps[q][0][0] = 1)) {
                          NodeOps.splice(q, 1);
                        }
                      }
                    }
                  }
                );
              }
            } else {
              console.log(e);
            }
          });
        }
      });
    });
  });
  processor.onStreamingStart(HR.onStreamingStart);
  processor.start();
  setTimeout(function () {
    API.start();
  }, 3000);
}

module.exports = startApp;
