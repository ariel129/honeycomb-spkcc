import stringify from 'json-stable-stringify';
import { CONFIG } from '@config';
import { DiscordService } from '@src/services';
import { store } from '..';
import { Base64Utils, DEXUtils, DISTRO, TXIDUtils } from '.';

const { getNFTtoDiscord, postToDiscord } = DiscordService();

export const NFTUtils = {
  place: (item: string, account: string, string: string) => {
    if (string.indexOf(`_${account},`) >= 0) {
      return (
        string.slice(0, string.indexOf(`_${account},`)) +
        '_' +
        item +
        string.slice(string.indexOf(`_${account},`))
      );
    }

    return string + item + '_' + account + ',';
  },
  move: (item: string, to: string, string: string) => {
    const index = string.indexOf(item + '_');
    const itemsAndOwner = string
      .slice(string.lastIndexOf(',', index))
      .split(',')[1]
      .split('_');

    let newString =
      itemsAndOwner.length === 2
        ? string.replace(`${item}_${itemsAndOwner[1]},`, '')
        : string.replace(`${item}_`, '');

    if (newString.indexOf(`_${to},`) >= 0) {
      return (
        newString.slice(0, newString.indexOf(`_${to},`)) +
        '_' +
        item +
        newString.slice(newString.indexOf(`_${to},`))
      );
    }

    return newString + item + '_' + to + ',';
  },
  delete: (item: string, string: string) => {
    const index = string.indexOf(item);
    const itemsAndOwner = string
      .slice(string.lastIndexOf(',', index))
      .split(',')[0]
      .split('_');

    let newString =
      itemsAndOwner.length === 2
        ? string.replace(`${item}_${itemsAndOwner[1]},`, '')
        : string.replace(`${item}_`, '');

    if (newString.indexOf('_D,') >= 0) {
      return (
        newString.slice(0, newString.indexOf('_D,')) +
        '_' +
        item +
        newString.slice(newString.indexOf('_D,'))
      );
    }

    return newString + item + '_D,';
  },
  last: (number: number, string: string) => {
    const last = string.split(',')[0];

    return string.replace(last, Base64Utils.fromNumber(number));
  },
  mintOp: (promies: any, delkey: any, num: number, b: any, rand: any) => {
    return new Promise((resolve, reject) => {
      const seed = parseInt(rand.slice(0, 12), 16);
      console.log({ rand, seed });
      Promise.all(promies).then((mem) => {
        const set = mem[0];
        let nft;
        if (set.i === '0') NFTUtils.finalizeFee(set.f);
        const max = Base64Utils.toNumber(set.m);
        const len = set.m.split('').length;
        const min = Base64Utils.toNumber(set.o);
        const total = max - min;
        var select = seed % total;
        var selected = Base64Utils.fromNumber(min + select);
        var inserted = false;
        if (set.u) {
          while (!inserted) {
            while (selected.split('').length < len) {
              selected = '0' + selected;
            }
            if (set.u.indexOf(`${selected}_`) == -1) {
              set.u = NFTUtils.place(selected, b.for, set.u);
              inserted = true;
            } else {
              select = (select + 1) % total;
              selected = Base64Utils.fromNumber(min + select);
            }
          }
        } else {
          while (selected.split('').length < len) {
            selected = '0' + selected;
          }
          set.u = `${selected}_${b.for},`;
        }
        switch (set.t) {
          case 4:
            nft = {
              s: `${Base64Utils.fromNumber(num - 1)},,`,
            };
            break;
          default:
            nft = {
              s: `${Base64Utils.fromNumber(num - 1)},`,
            };
        }
        set.i = Base64Utils.fromNumber(Base64Utils.toNumber(set.i) + 1);
        let ops = [];
        ops.push({
          type: 'put',
          path: ['nfts', b.for, `${b.set}:${selected}`],
          data: nft,
        });
        ops.push({ type: 'put', path: ['sets', b.set], data: set });
        ops.push({
          type: 'put',
          path: ['feed', `${num}:vop_${delkey.split(':')[1]}`],
          data: `${b.for} minted ${selected} from the ${b.set} set.`,
        });

        if (CONFIG.hookurl) getNFTtoDiscord(set.s, selected, b.for, b.set);

        TXIDUtils.store(
          `${b.for} minted ${selected} from the ${b.set} set.`,
          `${num}:${b.txid}`
        );
        ops.push({ type: 'del', path: ['chrono', delkey] });
        store.batch(ops, [resolve, reject]);
      });
    });
  },
  AHEOp: (promies: any, delkey: any, num: any, b: any) => {
    return new Promise((resolve, reject) => {
      //NEEDS no bids
      Promise.all(promies)
        .then((mem) => {
          let listing: any = mem[0],
            set = mem[1],
            ops: any = [],
            promises: any = [],
            nft = listing.nft;

          const last_modified = nft.s.split(',')[0];

          nft.s.replace(last_modified, Base64Utils.fromNumber(num)); //update last modified
          if (listing.b) {
            //winner
            promises = DISTRO(
              'AH',
              listing.o,
              listing.b,
              set.r,
              set.a,
              set.ra,
              set.n
            );
            if (b.item.split(':')[0] != 'Qm')
              set.u = NFTUtils.move(b.item.split(':')[1], listing.f, set.u);
            //update set
            else set.u = listing.f;
            ops.push({
              type: 'put',
              path: ['nfts', listing.f, b.item],
              data: nft,
            }); //update nft
            const msg = `Auction of ${listing.o}'s ${
              b.item
            } has ended for ${parseFloat((listing.b / 1000).toString()).toFixed(
              3
            )} ${CONFIG.TOKEN} to ${listing.f}`;
            ops.push({
              type: 'put',
              path: ['feed', `${num}:vop_${delkey.split(':')[1]}`],
              data: msg,
            });
            if (CONFIG.hookurl)
              postToDiscord(msg, `${num}:vop_${delkey.split(':')[1]}`);
          } else {
            //no bidders
            const msg = `Auction of ${listing.o}'s ${b.item} has ended with no bidders`;
            ops.push({
              type: 'put',
              path: ['feed', `${num}:vop_${delkey.split(':')[1]}`],
              data: msg,
            });
            if (CONFIG.hookurl)
              postToDiscord(msg, `${num}:vop_${delkey.split(':')[1]}`);
            if (b.item.split(':')[0] != 'Qm')
              set.u = NFTUtils.move(b.item.split(':')[1], listing.o, set.u);
            //update set
            else set.u = listing.o;
            ops.push({
              type: 'put',
              path: ['nfts', listing.o, b.item],
              data: nft,
            });
          }
          if (b.item.split(':')[0] != 'Qm')
            ops.push({
              type: 'put',
              path: ['sets', b.item.split(':')[0]],
              data: set,
            });
          //update set
          else
            ops.push({
              type: 'put',
              path: ['sets', `Qm${b.item.split(':')[1]}`],
              data: set,
            });
          ops.push({ type: 'del', path: ['chrono', delkey] });
          ops.push({ type: 'del', path: ['ah', b.item] });
          if (promises.length)
            Promise.all(promises).then((empty) => {
              store.batch(ops, [resolve, reject, 'waiting']);
            });
          else store.batch(ops, [resolve, reject, 'not waiting']);
        })
        .catch((e) => {
          console.log(e);
        });
    });
  },
  AHHEOp: (promies: any, delkey: any, num: any, b: any, ts: any) => {
    return new Promise((resolve, reject) => {
      //NEEDS no bids
      Promise.all(promies)
        .then((mem) => {
          let listing: any = mem[0],
            set = mem[1],
            ops: any = [],
            promises: any = [],
            nft = listing.nft;

          const last_modified = nft.s.split(',')[0];

          nft.s.replace(last_modified, Base64Utils.fromNumber(num)); //update last modified
          if (listing.b) {
            //winner
            let royalties = parseInt((listing.b * (set.r / 10000)).toString());
            let fee = parseInt(
              (listing.b * (CONFIG.hive_service_fee / 10000)).toString()
            );
            let total = listing.b - royalties - fee;
            const Transfer = [
              'transfer',
              {
                from: CONFIG.msaccount,
                to: listing.o,
                amount:
                  parseFloat((total / 1000).toString()).toFixed(3) +
                  ` ${listing.h}`,
                memo: `${b.item} sold at auction.`,
              },
            ];
            if (royalties) {
              DEXUtils.buyDluxFromDex(
                royalties,
                listing.h,
                num,
                `roy_${delkey.split(':')[1]}`,
                `n:${set.n}`,
                ts,
                'royalty'
              ).then((empty: any) => {
                DEXUtils.buyDluxFromDex(
                  fee,
                  listing.h,
                  num,
                  `fee_${delkey.split(':')[1]}`,
                  `rn`,
                  ts,
                  'fee'
                ).then((emp: any) => {
                  finish();
                });
              });
            } else {
              DEXUtils.buyDluxFromDex(
                fee,
                listing.h,
                num,
                `fee_${delkey.split(':')[1]}`,
                `rn`,
                ts
              ).then((emp: any) => {
                finish();
              });
            }
            function finish() {
              if (b.item.split(':')[0] != 'Qm')
                set.u = NFTUtils.move(b.item.split(':')[1], listing.f, set.u);
              //update set
              else set.u = listing.f;
              ops.push({
                type: 'put',
                path: ['nfts', listing.f, b.item],
                data: nft,
              }); //update nft
              const msg = `Auction of ${listing.o}'s ${
                b.item
              } has ended for ${parseFloat(
                (listing.b / 1000).toString()
              ).toFixed(3)} ${listing.h} to ${listing.f}`;
              ops.push({
                type: 'put',
                path: ['feed', `${num}:vop_${delkey.split(':')[1]}`],
                data: msg,
              });
              ops.push({
                type: 'put',
                path: ['msa', `${num}:vop_${delkey.split(':')[1]}`],
                data: stringify(Transfer),
              });
              if (CONFIG.hookurl)
                postToDiscord(msg, `${num}:vop_${delkey.split(':')[1]}`);
              if (b.item.split(':')[0] != 'Qm')
                ops.push({
                  type: 'put',
                  path: ['sets', b.item.split(':')[0]],
                  data: set,
                });
              //update set
              else
                ops.push({
                  type: 'put',
                  path: ['sets', `Qm${b.item.split(':')[1]}`],
                  data: set,
                });
              ops.push({ type: 'del', path: ['chrono', delkey] });
              ops.push({ type: 'del', path: ['ahh', b.item] });
              store.batch(ops, [resolve, reject, 'bidders']);
            }
          } else {
            //no bidders
            const msg = `Auction of ${listing.o}'s ${b.item} has ended with no bidders`;
            ops.push({
              type: 'put',
              path: ['feed', `${num}:vop_${delkey.split(':')[1]}`],
              data: msg,
            });
            if (CONFIG.hookurl)
              postToDiscord(msg, `${num}:vop_${delkey.split(':')[1]}`);
            if (b.item.split(':')[0] != 'Qm')
              set.u = NFTUtils.move(b.item.split(':')[1], listing.o, set.u);
            //update set
            else set.u = listing.o;
            ops.push({
              type: 'put',
              path: ['nfts', listing.o, b.item],
              data: nft,
            });
            if (b.item.split(':')[0] != 'Qm')
              ops.push({
                type: 'put',
                path: ['sets', b.item.split(':')[0]],
                data: set,
              });
            //update set
            else
              ops.push({
                type: 'put',
                path: ['sets', `Qm${b.item.split(':')[1]}`],
                data: set,
              });
            ops.push({ type: 'del', path: ['chrono', delkey] });
            ops.push({ type: 'del', path: ['ahh', b.item] });
            store.batch(ops, [resolve, reject, 'no bidders']);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    });
  },
  AMEOp: (promies: any, delkey: any, num: any, b: any) => {
    return new Promise((resolve, reject) => {
      Promise.all(promies)
        .then((mem) => {
          let listing = mem[0],
            set = mem[1],
            ops: any = [],
            promises: any = [];
          // const fee = parseInt(listing.b /100); add('n', fee); listingb = listing.b - fee;
          if (listing.b) {
            //winner
            promises = DISTRO(
              'AH',
              listing.o,
              listing.b,
              set.r,
              set.a,
              set.ra,
              set.n
            );
            // addMT(['rnfts', b.item.split(':')[0], listing.f], 1);
            const msg = `Auction of ${listing.o}'s ${
              b.item
            } mint token has ended for ${parseFloat(
              (listing.b / 1000).toString()
            ).toFixed(3)} ${CONFIG.TOKEN} to ${listing.f}`;
            ops.push({
              type: 'put',
              path: ['feed', `${num}:vop_${delkey.split(':')[1]}`],
              data: msg,
            });
            if (CONFIG.hookurl)
              postToDiscord(msg, `${num}:vop_${delkey.split(':')[1]}`);
          } else {
            //no bidders
            const msg = `Auction of ${b.item} mint token has ended with no bidders`;
            ops.push({
              type: 'put',
              path: ['feed', `${num}:vop_${delkey.split(':')[1]}`],
              data: msg,
            });
            if (CONFIG.hookurl)
              postToDiscord(msg, `${num}:vop_${delkey.split(':')[1]}`);
            // addMT(['rnfts', b.item.split(':')[0], listing.o], 1);
          }
          ops.push({ type: 'del', path: ['chrono', delkey] });
          ops.push({ type: 'del', path: ['am', b.item] });
          if (promises.length)
            Promise.all(promises).then((empty) => {
              store.batch(ops, [resolve, reject]);
            });
          else store.batch(ops, [resolve, reject]);
        })
        .catch((e) => {
          console.log(e);
        });
    });
  },
  DividendOp: (promies: any, delkey: any, num: any, b: any) => {
    return new Promise((resolve, reject) => {
      Promise.all(promies)
        .then((mem) => {
          let contract = mem[0],
            set = mem[1],
            sales = mem[2],
            auc = mem[3],
            ops: any = [],
            promises: any = [];
          if (!contract.m) contract.m = {};

          for (const item in sales) {
            if (item.split(':')[0] == set.n) {
              contract.m[sales[item].o] = 0;
            }
          }

          for (const item in auc) {
            if (item.split(':')[0] == set.n) {
              contract.m[auc[item].o] = 0;
            }
          }

          promises = divDistro(
            contract.b,
            set.u,
            contract.m,
            contract.s,
            contract.l
          ); //balance, owners, movers, setname(for refund)
          const msg = `Dividends of ${contract.s}'s ${
            contract.b
              ? parseFloat(
                  (contract.b / Math.pow(10, CONFIG.precision)).toString()
                ).toFixed(CONFIG.precision)
              : 0
          } ${CONFIG.TOKEN} have been distributed to ${
            promises.length
          } accounts`;
          promises
            .push
            // chronAssign(num + contract.p, { op: 'div', set: contract.s })
            ();
          ops.push({
            type: 'put',
            path: ['feed', `${num}:vop_${delkey.split(':')[1]}`],
            data: msg,
          });
          if (CONFIG.hookurl)
            postToDiscord(msg, `${num}:vop_${delkey.split(':')[1]}`);
          ops.push({ type: 'del', path: ['chrono', delkey] });
          ops.push({ type: 'del', path: ['div', contract.s, 'm'] });
          if (promises.length)
            Promise.all(promises).then((empty) => {
              store.batch(ops, [resolve, reject]);
            });
          else store.batch(ops, [resolve, reject]);
          function divDistro(
            balance: any,
            owners: any,
            movers: any,
            setname: any,
            last: any
          ) {
            let accounts = owners.split(','),
              tos = [],
              items = [],
              promies: any = [],
              total = 0,
              no = Object.keys(movers);
            no.push('ls', 'D', 'ah', 't', 'hh');
            if (accounts.length > 0)
              for (var i = 0; i < accounts.length; i++) {
                const len = accounts[i].split('_').length - 1;
                const who = accounts[i].split('_')[len];
                if (no.indexOf(who) == -1) {
                  tos.push(who);
                  items.push(len);
                  total += len;
                }
              }
            let cada = parseInt((balance / total).toString());
            let truco = balance % total;
            // promies.push(addMT(['div', setname, 'b'], truco - balance));
            // promies.push(addMT(['div', setname, 'e'], cada));
            // promies.push(addMT(['div', setname, 'l'], cada - last));
            for (var i = 0; i < items.length; i++) {
              // promies.push(add(tos[i], cada * items[i]));
            }

            return promies;
          }
        })
        .catch((e) => {
          console.log(e);
        });
    });
  },
  finalizeFee: (fee: any) => {
    const val: string = (fee / 2).toString();
    const toNodes = parseInt(val);

    // add('rn', toNodes)
    // burn(fee - toNodes)
  },
};
