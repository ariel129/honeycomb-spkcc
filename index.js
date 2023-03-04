const cors = require('cors');
const express = require('express');
const hive = require('@hiveio/dhive');
const IPFS = require('ipfs-http-client-lite');
const config = require('./config');

const VERSION = 'v1.1.6'; //Did you change the package version?
exports.VERSION = VERSION;
exports.exit = exit;
exports.processor = processor;

var client = new hive.Client(config.clients);

exports.client = client;
var block = {
  ops: [],
  root: '',
  prev_root: '',
  chain: [],
};
exports.block = block;

var ipfs = IPFS(
  `${config.ipfsprotocol}://${config.ipfshost}:${config.ipfsport}`
);
console.log(
  `IPFS: ${config.ipfshost == 'ipfs' ? 'DockerIPFS' : config.ipfshost}:${
    config.ipfsport
  }`
);
exports.ipfs = ipfs;

const rtrades = require('./rtrades');
var Pathwise = require('./pathwise');
var level = require('level');

var store = new Pathwise(level('./db', { createIfEmpty: true }));
exports.store = store;

const hiveClient = require('@hiveio/hive-js');
const broadcastClient = require('@hiveio/hive-js');
broadcastClient.api.setOptions({ url: config.startURL });
hiveClient.api.setOptions({ url: config.clientURL });
console.log('Using APIURL: ', config.clientURL);
exports.hiveClient = hiveClient;
//non-consensus node memory
var plasma = {
    consensus: '',
    pending: {},
    page: [],
    hashLastIBlock: 0,
    hashSecIBlock: 0,
    //pagencz: []
  },
  jwt;
exports.plasma = plasma;
var NodeOps = [];
//are these used still?
exports.GetNodeOps = function () {
  return NodeOps;
};
exports.newOps = function (array) {
  NodeOps = array;
};
exports.unshiftOp = function (op) {
  NodeOps.unshift(op);
};
exports.pushOp = function (op) {
  NodeOps.push(op);
};
exports.spliceOp = function (i) {
  NodeOps.splice(i, 1);
};
var status = {
  cleaner: [],
};
exports.status = status;

let TXID = {
  store: function (msg, txid) {
    try {
      status[txid.split(':')[1]] = msg;
      status.cleaner.push(txid);
    } catch (e) {
      console.log(e);
    }
  },
  clean: function (blocknum) {
    TXID.blocknumber = blocknum;
    try {
      if (status.cleaner.length) {
        var again = false;
        do {
          if (
            parseInt(status.cleaner[0].split(':')[0]) <=
            blocknum - config.history
          ) {
            delete status[status.cleaner[0].split(':')[1]];
            status.cleaner.shift();
            again = true;
          } else {
            again = false;
          }
        } while (again);
      }
    } catch (e) {
      console.log('Try Clean Status failed:', e);
    }
  },
  getBlockNum: function () {
    return TXID.blocknumber;
  },
  blocknumber: 0,
  saveNumber: 0,
  streaming: false,
  current: function () {
    TXID.streaming = true;
  },
  reset: function () {
    (TXID.streaming = false),
      (TXID.blocknumber = 0),
      (saveNumber = 0),
      (status = {
        cleaner: [],
      });
  },
};
exports.TXID = TXID;
const API = require('./routes/api');
const { Watchdog } = require('./helpers');

const router = require('./src/routes');
const startWith = require('./src/application/startWith');
const dynStart = require('./src/application/dynStart');

const api = express();
var http = require('http').Server(api);
var escrow = false;
exports.escrow = escrow;
const streamMode = config.stream || 'irreversible';
console.log('Streaming using mode', streamMode);
var processor;
exports.processor = processor;

//Start Program Options
dynStart();
//startWith("Qmf3jthuvSDv5Eto5eAnZVBzUdhbErEdFxUdicWHct9sF9", true);
Watchdog.monitor();

// API defs
api.use(API.https_redirect);
api.use(cors());
api.use(router);

//grabs an API token for IPFS pinning of TOKEN posts
if (config.rta && config.rtp) {
  rtrades.handleLogin(config.rta, config.rtp);
}

function exit(consensus, reason) {
  console.log(`Restarting with ${consensus}. Reason: ${reason}`);

  if (processor) processor.stop(function () {});

  if (consensus) {
    startWith(consensus, true);
  } else {
    dynStart(config.msaccount);
  }
}

http.listen(config.port, function () {
  console.log(`${config.TOKEN} token API listening on port ${config.port}`);
});
