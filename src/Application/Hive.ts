import { CONFIG } from '@config';

const hiveClient = require('@hiveio/hive-js');

const Hive = {
  getOwners: function (account: string) {
    return new Promise(function (resolve, reject) {
      hiveClient.api.setOptions({ url: CONFIG.startURL });
      hiveClient.api.getAccounts(
        [account],
        function (err: any, result: { active: { account_auths: unknown } }[]) {
          hiveClient.api.setOptions({ url: CONFIG.clientURL });
          if (err) reject(err);
          else resolve(result[0].active.account_auths);
        }
      );
    });
  },
  getRecentReport: function (account: any, walletOperationsBitmask: any) {
    return new Promise(function (resolve, reject) {
      hiveClient.api.setOptions({ url: CONFIG.startURL });
      hiveClient.api.getAccountHistory(
        account,
        -1,
        100,
        ...walletOperationsBitmask,
        function (err: any, result: any[]) {
          hiveClient.api.setOptions({ url: CONFIG.clientURL });
          if (err) reject(err);
          let ebus = result.filter(
              (tx) => tx[1].op[1].id === `${CONFIG.prefix}report`
            ),
            recents = [];
          for (let i = ebus.length - 1; i >= 0; i--) {
            if (
              JSON.parse(ebus[i][1].op[1].json).hash &&
              parseInt(JSON.parse(ebus[i][1].op[1].json).block) >
                parseInt(CONFIG.override)
            ) {
              recents.push([
                JSON.parse(ebus[i][1].op[1].json).hash,
                JSON.parse(ebus[i][1].op[1].json).block,
              ]);
            }
          }
          resolve(recents.shift());
        }
      );
    });
  },
};

export default Hive;
