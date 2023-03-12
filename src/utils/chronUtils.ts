import { CONFIG } from '@config';
import { store } from '..';

export const ChronUtils = {
  govDownOp: (
    promies: any,
    from: any,
    delkey: any,
    num: any,
    id: any,
    b: any
  ) => {
    return new Promise((resolve, reject) => {
      Promise.all(promies)
        .then((bals) => {
          let lbal = bals[0],
            tgov = bals[1],
            gbal = bals[2],
            ops = [];
          if (gbal - b.amount < 0) {
            b.amount = gbal;
          }
          ops.push({
            type: 'put',
            path: ['balances', from],
            data: lbal + b.amount,
          });
          ops.push({ type: 'put', path: ['gov', from], data: gbal - b.amount });
          ops.push({ type: 'put', path: ['gov', 't'], data: tgov - b.amount });
          ops.push({
            type: 'put',
            path: ['feed', `${num}:vop_${id}`],
            data: `@${b.by}| ${parseFloat((b.amount / 1000).toString()).toFixed(
              3
            )} ${CONFIG.TOKEN} withdrawn from governance.`,
          });
          ops.push({ type: 'del', path: ['chrono', delkey] });
          ops.push({ type: 'del', path: ['govd', b.by, delkey] });
          store.batch(ops, [resolve, reject]);
        })
        .catch((e) => {
          console.log(e);
        });
    });
  },
  powerDownOp: (
    promies: any,
    from: any,
    delkey: any,
    num: any,
    id: any,
    b: any
  ) => {
    return new Promise((resolve, reject) => {
      Promise.all(promies)
        .then((bals) => {
          let lbal = bals[0],
            tpow = bals[1],
            pbal = bals[2],
            ops = [];
          if (pbal - b.amount < 0) {
            b.amount = pbal;
          }
          ops.push({
            type: 'put',
            path: ['balances', from],
            data: lbal + b.amount,
          });
          ops.push({ type: 'put', path: ['pow', from], data: pbal - b.amount });
          ops.push({ type: 'put', path: ['pow', 't'], data: tpow - b.amount });
          ops.push({
            type: 'put',
            path: ['feed', `${num}:vop_${id}`],
            data: `@${b.by}| powered down ${parseFloat(
              (b.amount / 1000).toString()
            ).toFixed(3)} ${CONFIG.TOKEN}`,
          });
          ops.push({ type: 'del', path: ['chrono', delkey] });
          ops.push({ type: 'del', path: ['powd', b.by, delkey] });
          store.batch(ops, [resolve, reject]);
        })
        .catch((e) => {
          console.log(e);
        });
    });
  },
  postRewardOP: (l: any, num: any, id: any, delkey: any) => {
    return new Promise((resolve, reject) => {
      store.get(['posts', `${l.author}/${l.permlink}`], (e, b) => {
        let ops = [];
        let totals: any = {
          totalWeight: 0,
          linearWeight: 0,
        };
        for (const vote in b.votes) {
          totals.totalWeight += b.votes[vote].v;
          const linearWeight = parseInt(
            (
              b.votes[vote].v *
              ((201600 - (b.votes[vote].b - b.block)) / 201600)
            ).toString()
          );
          totals.linearWeight += linearWeight;
          b.votes[vote].w = linearWeight;
        }
        let half = parseInt((totals.totalWeight / 2).toString());
        totals.curationTotal = half;
        totals.authorTotal = totals.totalWeight - half;
        b.t = totals;
        ops.push({
          type: 'put',
          path: ['pendingpayment', `${b.author}/${b.permlink}`],
          data: b,
        });
        ops.push({ type: 'del', path: ['chrono', delkey] });
        ops.push({
          type: 'put',
          path: ['feed', `${num}:vop_${id}`],
          data: `@${b.author}| Post:${b.permlink} voting expired.`,
        });
        ops.push({ type: 'del', path: ['posts', `${b.author}/${b.permlink}`] });
        store.batch(ops, [resolve, reject]);
      });
    });
  },
  postVoteOP: (l: any, delkey: any) => {
    return new Promise((resolve, reject) => {
      store.get(['posts', `${l.author}/${l.permlink}`], (e, b) => {
        let ops = [];
        let totalWeight = 0;
        for (const vote in b.votes) {
          totalWeight += b.votes[vote].v;
        }
        b.v = totalWeight;
        if (b.v > 0) {
          ops.push({
            type: 'put',
            path: ['pendingvote', `${l.author}/${l.permlink}`],
            data: b,
          });
        }
        ops.push({ type: 'del', path: ['chrono', delkey] });
        store.batch(ops, [resolve, reject]);
      });
    });
  },
};
