import { CONFIG } from '@config';

export const DEXUtils = {
  insert: (item: any, price: any, string = '', type: any) => {
    let price_location = string ? string.indexOf(price) : -1;

    if (price_location === -1) {
      let prices = string.split(',');
      if (string !== '') {
        for (let i = 0; i < prices.length; i++) {
          if (type != 'buy') {
            if (parseFloat(prices[i].split('_')[0]) > parseFloat(price)) {
              prices.splice(i, 0, price + '_' + item);
              return prices.join(',');
            }
          } else {
            if (parseFloat(prices[i].split('_')[0]) < parseFloat(price)) {
              prices.splice(i, 0, price + '_' + item);
              return prices.join(',');
            }
          }
        }
        return string + ',' + price + '_' + item;
      } else {
        return price + '_' + item;
      }
    } else {
      let insert_location = string.indexOf(',', price_location);

      if (insert_location === -1) {
        return string + '_' + item;
      } else {
        return (
          string.substring(0, insert_location) +
          '_' +
          item +
          string.substring(insert_location)
        );
      }
    }
  },
  remove: (item: any, string: any) => {
    if (string.indexOf(item + '_') > -1) {
      return string.replace(`${item}_`, '');
    } else {
      let item_location = string.indexOf('_' + item);
      let lowerThan = string.substring(0, item_location);
      let greaterThan = string.substring(item_location).replace(`_${item}`, '');
      let prices = lowerThan.split(',');
      if (prices[prices.length - 1].split('_').length >= 2) {
        return string.replace(`_${item}`, '');
      } else {
        prices.pop();
        let str = prices.join(',') + greaterThan;
        if (!prices.length) return greaterThan.substr(1) || '';
        else if (str.substr(0, 1) == ',') return str.substr(1);
        else if (str != string) return str;
        else return string;
      }
    }
  },
  buyDluxFromDex: (
    amount: any,
    type: any,
    num: any,
    txid: any,
    to: any,
    timestamp: any,
    memo = ''
  ) => {
    return new Promise((resolve, reject) => {
      require('./processing_routes/dex').transfer(
        {
          from: to,
          to: CONFIG.msaccount,
          amount: {
            amount,
            precision: 3,
            nai: type == 'HIVE' ? '@@000000021' : '@@000000013',
          },
          memo,
          block_num: num,
          transaction_id: txid,
          timestamp,
        },
        [resolve, reject, memo]
      );
    });
  },
};
