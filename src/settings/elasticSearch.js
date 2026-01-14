// todo: 修复路径 1
const { configs } = require('@/settings/env');
const ES = require('elasticsearch');

const { address, port } = configs.elasticSearch;

module.exports = () => {
  return new ES.Client({
    host: address + ':' + port,
    requestTimeout: 90000,
    apiVersion: '6.8',
  });
};
