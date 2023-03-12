import { RootController } from '@src/controller';
import { CONFIG, VERSION } from '@config';
import { store } from '..';
import { BLOCK, RAM, STARTING_BLOCK } from '@src/utils';
import { IpfsService } from '@src/services';
import { Hive } from '.';

const {
  ChainTypes,
  makeBitMaskFilter,
} = require('@hiveio/hive-js/lib/auth/serializer');

const op = ChainTypes.operations;
const walletOperationsBitmask = makeBitMaskFilter([op.custom_json]);

const AppStart = () => {
  const { Start } = RootController();
  const { ipfspromise, rundelta } = IpfsService();

  const dynStart = () => {
    Start();

    Hive.getOwners(CONFIG.msaccount).then((oa: any) => {
      console.log('Starting URL: ', CONFIG.startURL);
      let consensus_init: any = {
        accounts: oa,
        reports: [],
        hash: {},
        start: false,
        first: CONFIG.engineCrank,
      };

      for (const i in oa) {
        consensus_init.reports.push(
          Hive.getRecentReport(oa[i][0], walletOperationsBitmask)
        );
      }

      Promise.all(consensus_init.reports).then((r) => {
        console.log(r);
        for (let i = 0; i < r.length; i++) {
          if (r[i]) {
            if (CONFIG.engineCrank == consensus_init.first)
              consensus_init.first = r[i][0];
            if (consensus_init.hash[r[i][0]]) {
              consensus_init.hash[r[i][0]]++;
            } else {
              consensus_init.hash[r[i][0]] = 1;
            }
          }
        }

        for (var i in consensus_init.hash) {
          if (consensus_init.hash[i] > consensus_init.reports.length / 2) {
            console.log('Starting with: ', i);
            startWith(i, true);
            consensus_init.start = true;
            break;
          }
        }

        if (!consensus_init.start) {
          console.log('Starting with: ', consensus_init.first);
          startWith(consensus_init.first, false);
        }
      });
    });
  };

  const startWith = (hash: string, second: boolean) => {
    console.log(`${VERSION} =>\n ${hash} inserted`);
    if (hash && hash != 'pending') {
      console.log(`Attempting to start from IPFS save state ${hash}`);
      ipfspromise(hash)
        .then((blockInfo: any) => {
          if (blockInfo[0] == 'D') console.log(blockInfo);
          const blockinfo = JSON.parse(blockInfo);
          ipfspromise(blockinfo[1].root ? blockinfo[1].root : hash).then(
            (file: any) => {
              const data = JSON.parse(file);
              STARTING_BLOCK.startingBlock = data[0];
              BLOCK.root = blockinfo[1].root ? blockinfo[1].root : hash;
              BLOCK.prev_root = data[1].prev_rootarting
                ? data[1].prev_root
                : data[1].stats.root || '';
              console.log('root', BLOCK.root, STARTING_BLOCK);
              if (!STARTING_BLOCK.startingBlock) {
                // startWith(sh);  Comment temporary due to missing SH
              } else {
                store.del([], {}, (e: any) => {
                  if (!e && (second || data[0] > RAM.head - 325)) {
                    if (hash) {
                      const cleanState = data[1];

                      store.put([], cleanState, {}, (err: any) => {
                        if (err) {
                          console.log('errr', err);
                        } else {
                          if (blockinfo[1].chain) {
                            rundelta(
                              blockinfo[1].chain,
                              blockinfo[1].ops,
                              blockinfo[0],
                              blockinfo[1].prev_root
                            );
                          }
                        }
                      });
                    }
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
    }
  };

  return { dynStart, startWith };
};

export default AppStart;
