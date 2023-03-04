const {
  ChainTypes,
  makeBitMaskFilter,
} = require('@hiveio/hive-js/lib/auth/serializer');
const CONFIG = require('../../config');
const API = require('../../routes/api');
const startWith = require('./startWith');
 
const op = ChainTypes.operations;
const walletOperationsBitmask = makeBitMaskFilter([op.custom_json]);
//pulls the latest activity of an account to find the last state put in by an account to dynamically start the node.
//this will include other accounts that are in the node network and the consensus state will be found if this is the wrong chain
function dynStart(account) {
  API.start();
  const { Hive } = require('../../hive');
  Hive.getOwners(CONFIG.msaccount).then((oa) => {
    console.log('Starting URL: ', CONFIG.startURL);
    let consensus_init = {
      accounts: oa,
      reports: [],
      hash: {},
      start: false,
      first: CONFIG.engineCrank,
    };

    for (i in oa) {
      consensus_init.reports.push(
        Hive.getRecentReport(oa[i][0], walletOperationsBitmask)
      );
    }

    Promise.all(consensus_init.reports).then((r) => {
      console.log(r);
      for (i = 0; i < r.length; i++) {
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
}

module.exports = dynStart;
