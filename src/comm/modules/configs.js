// todo: 修复路径 1
const moleculer = require('@/settings/env').configs.moleculer;
function GetWebConfigs() {
  return {
    enabled: moleculer.web.enabled,
    host: moleculer.web.host,
    port: moleculer.web.port,
  };
}

function GetMoleculerConfigs() {
  return {
    ...moleculer,
  };
}

module.exports = {
  GetWebConfigs,
  GetMoleculerConfigs,
};
