import { store } from '..';

export const getPathObj = (path: string) => {
  return new Promise((resolve, reject) => {
    store.get(path, (err, obj) => {
      if (err) {
        console.log(path);
        resolve({});
      } else {
        resolve(obj);
      }
    });
  });
};

export const getPathNum = (path: string) => {
  return new Promise((resolve, reject) => {
    store.get(path, (err, obj) => {
      if (err) {
        reject(err);
      } else {
        if (typeof obj != 'number') {
          resolve(0);
        } else {
          resolve(obj);
        }
      }
    });
  });
};

export const getPathSome = (path: string, arg: any) => {
  return new Promise(function (resolve, reject) {
    store.someChildren(path, arg, (err: any, obj: any) => {
      if (err) {
        reject(err);
        resolve({});
      } else {
        resolve(obj);
      }
    });
  });
};

export const deleteObjs = (paths: string[]) => {
  return new Promise((resolve, reject) => {
    const ops = [];
    for (let i = 0; i < paths.length; i++) {
      ops.push({ type: 'del', path: paths[i] });
    }
    store.batch(ops, [resolve, reject, paths.length]);
  });
};
