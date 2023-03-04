const CONFIG = require('../../config');

const authUtils = () => {
  const featuresDex = (req, res, next) => {
    if (CONFIG.features.dex) {
      next();
    } else {
      res.sendStatus(401);
    }
  };

  const featuresNft = (req, res, next) => {
    if (CONFIG.features.nft) {
      next();
    } else {
      res.sendStatus(401);
    }
  };

  const featuresPob = (req, res, next) => {
    if (CONFIG.features.pob) {
      next();
    } else {
      res.sendStatus(401);
    }
  };

  const featuresState = (req, res, next) => {
    if (CONFIG.features.state) {
      next();
    } else {
      res.sendStatus(401);
    }
  };

  return {
    featuresDex,
    featuresNft,
    featuresPob,
    featuresState,
  };
};

module.exports = authUtils;
