import assert from 'assert';
import bytewise from 'bytewise';
import stringify from 'json-stable-stringify';
import streamToArray from 'stream-to-array';
import { arrToObjUtils, BLOCK } from './helperUtils';

const defaults = require('levelup-defaults');
const type = require('component-type');
const after = require('after');

const Pathwise = (db: any) => {
  assert(db, 'db required');

  const _db = defaults(db, {
    keyEncoding: bytewise,
    valueEncoding: 'json',
  });

  const put = (path: any, obj: any, opts: any, fn: (err?: any) => void) => {
    if (typeof opts == 'function') {
      fn = opts;
      opts = {};
    }
    const batch = opts.batch || _db.batch();
    _write(batch, path, obj, fn);

    if (opts.batch) {
      setImmediate(fn);
    } else {
      batch.write(fn);
    }
  };

  const _write = (
    batch: { put: (arg0: Buffer, arg1: any) => void },
    key: string | any[],
    obj: { [x: string]: any },
    fn?: () => void
  ) => {
    switch (type(obj)) {
      case 'object':
        const keys = Object.keys(obj);
        const next = after(keys.length, fn);
        keys.forEach(function (k) {
          _write(batch, key.concat(k), obj[k], next);
        });
        break;
      case 'array':
        _write(batch, key, arrToObjUtils(obj), fn);
        break;
      default:
        batch.put(bytewise.encode(key), stringify(obj));
        break;
    }
  };

  const batch = (ops: any[], pc: string | any[]) => {
    const batch = _db.batch();

    const next = after(ops.length, (err: any) => {
      if (err && pc[1]) {
        console.log('fail', err);
        pc[1](err);
      } else if (pc.length > 2) {
        BLOCK.ops.push('W');
        batch.write(() => {
          pc[0](pc[2]);
        });
      } else {
        BLOCK.ops.push('W');
        batch.write(() => {
          pc[0]();
        });
      }
    });

    ops.forEach(function (op) {
      BLOCK.ops.push(
        stringify({ type: op.type, path: op.path, data: op.data })
      );
      if (op.type == 'put') put(op.path, op.data, { batch: batch }, next);
      else if (op.type == 'del') del(op.path, { batch: batch }, next);
    });
  };

  const get = (path: any, fn: (d1: any, d2?: any) => void) => {
    let ret = {};
    let el: any = ret;

    streamToArray(
      _db.createReadStream({
        start: path,
        end: path.concat(undefined),
      }),
      (err: any, data) => {
        console.log('PATH', data);
        if (err) return fn(err);
        let er = null;
        try {
          console.log(data);
          data.forEach(function (kv) {
            const segs = kv.key.slice(path.length);
            if (segs.length) {
              segs.forEach((seg: any, idx: number) => {
                if (!el[seg]) {
                  if (idx == segs.length - 1) {
                    el[seg] = kv.value;
                  } else {
                    el[seg] = {};
                  }
                }
                el = el[seg];
              });
              el = ret;
            } else {
              ret = kv.value;
            }
          });
        } catch (err) {
          er = err;
        }
        fn(er, ret);
      }
    );
  };

  const getWith = (path: any[], obj: any, fn: any) => {
    let ret = {};
    let el: any = ret;

    streamToArray(
      _db.createReadStream({
        start: path,
        end: path.concat(undefined),
      }),
      function (err: any, data: any[]) {
        if (err) return fn(err);
        let er = null;
        try {
          data.forEach((kv) => {
            var segs = kv.key.slice(path.length);
            if (segs.length) {
              segs.forEach((seg: any, idx: number) => {
                if (!el[seg]) {
                  if (idx == segs.length - 1) {
                    el[seg] = kv.value;
                  } else {
                    el[seg] = {};
                  }
                }
                el = el[seg];
              });
              el = ret;
            } else {
              ret = kv.value;
            }
          });
        } catch (err) {
          er = err;
        }
        fn(er, ret, obj);
      }
    );
  };

  const del = (path: any, opts: any, fn: (err?: any) => void) => {
    if (typeof opts == 'function') {
      fn = opts;
      opts = {};
    }
    const batch = opts.batch || _db.batch();

    streamToArray(
      _db.createKeyStream({
        start: path,
        end: path.concat(undefined),
      }),
      (err: any, keys: any[]) => {
        if (err) return fn(err);
        keys.forEach(function (key) {
          batch.del(bytewise.encode(key));
        });
        if (opts.batch) fn();
        else batch.write(fn);
      }
    );
  };

  const children = (path: any[], fn: any) => {
    streamToArray(
      _db.createReadStream({
        start: path,
        end: path.concat(undefined),
      }),
      function (err: any, kv: any[]) {
        if (err) return fn(err);
        fn(
          null,
          kv.map(function (_kv) {
            return _kv.key[path.length] || _kv.value;
          })
        );
      }
    );
  };

  const someChildren = (
    path: string | any[],
    opts: { gte: any; lte: any },
    fn: any
  ) => {
    streamToArray(
      _db.createReadStream({
        start: [...path, opts.gte],
        end: [...path, opts.lte].concat(undefined),
      }),
      function (err: any, kv: any[]) {
        if (err) return fn(err);
        fn(
          null,
          kv.map(function (_kv) {
            return _kv.key[path.length] || _kv.value;
          })
        );
      }
    );
  };

  return {
    put,
    _write,
    batch,
    get,
    getWith,
    del,
    children,
    someChildren,
  };
};

export default Pathwise;
