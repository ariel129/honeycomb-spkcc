const express = require('express');
const authUtils = require('../auth');
const API = require('./../../routes/api');

const router = express();
const { featuresDex, featuresNft, featuresPob, featuresState } = authUtils();

router.get('/', API.root);
router.get('/stats', API.root);
router.get('/coin', API.coin);
router.get('/@:un', API.user);
router.get('/api/mirrors', API.mirrors);
router.get('/api/coin_detail', API.detail);
router.get('/report/:un', API.report); // probably not needed
router.get('/markets', API.markets); //for finding node runner and tasks information
router.get('/feed', API.feed); //all side-chain transaction in current day
router.get('/runners', API.runners); //list of accounts that determine consensus... will also be the multi-sig accounts
router.get('/queue', API.queue);
router.get('/api/protocol', API.protocol);
router.get('/api/status/:txid', API.status);

router.get('/dex', featuresDex, API.dex);
router.get('/api/tickers', featuresDex, API.tickers);
router.get('/api/orderbook', featuresDex, API.orderbook);
router.get('/api/orderbook/:ticker_id', featuresDex, API.orderbook);
router.get('/api/pairs', featuresDex, API.pairs);
router.get('/api/historical', featuresDex, API.historical_trades);
router.get('/api/historical/:ticker_id', featuresDex, API.historical_trades);
router.get('/api/recent/:ticker_id', featuresDex, API.chart);

router.get('/api/nfts/:user', featuresNft, API.nfts);
router.get('/api/nft/:set/:item', featuresNft, API.item);
router.get('/api/sets', featuresNft, API.sets);
router.get('/api/set/:set', featuresNft, API.set);
router.get('/api/auctions', featuresNft, API.auctions);
router.get('/api/auctions/:set', featuresNft, API.auctions);
router.get('/api/mintauctions', featuresNft, API.mint_auctions);
router.get('/api/mintauctions/:set', featuresNft, API.mint_auctions);
router.get('/api/sales', featuresNft, API.sales);
router.get('/api/sales/:set', featuresNft, API.sales);
router.get('/api/mintsales', featuresNft, API.mint_sales);
router.get('/api/mintsales/:set', featuresNft, API.mint_sales);
router.get('/api/mintsupply', featuresNft, API.mint_supply);
router.get('/api/mintsupply/:set', featuresNft, API.mint_supply);
router.get('/api/pfp/:user', featuresNft, API.official);
router.get('/api/trades/:kind/:user', featuresNft, API.limbo);

router.get('/blog/@:un', featuresPob, API.blog);
router.get('/dapps/@:author', featuresPob, API.getAuthorPosts);
router.get('/dapps/@:author/:permlink', featuresPob, API.getPost);
router.get('/new', featuresPob, API.getNewPosts);
router.get('/trending', featuresPob, API.getTrendingPosts);
router.get('/promoted', featuresPob, API.getPromotedPosts);
router.get('/posts/:author/:permlink', featuresPob, API.PostAuthorPermlink);
router.get('/posts', featuresPob, API.posts); //votable posts

router.get('/state', featuresState, API.state); //Do not recommend having a state dump in a production API
router.get('/pending', featuresState, API.pending); // The transaction signer now can sign multiple actions per block and this is nearly always empty, still good for troubleshooting
// Some HIVE APi is wrapped here to support a stateless frontend built on the cheap with dreamweaver
// None of these functions are required for token functionality and should likely be removed from the community version
router.get('/api/:api_type/:api_call', featuresState, API.hive_api);
router.get('/hapi/:api_type/:api_call', featuresState, API.hive_api);
router.get('/getwrap', featuresState, API.getwrap);
router.get('/getauthorpic/:un', featuresState, API.getpic);
router.get('/getblog/:un', featuresState, API.getblog);

module.exports = router;
