/*
 * @Author: renxia
 * @Date: 2024-01-10 16:58:26
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-11 21:03:06
 * @Description: 基于 whistle 的 cookie 自动抓取插件
 */
const micromatch = require('micromatch');
const { LiteStorage, assign, color } = require('@lzwme/fe-utils');
const { getConfig } = require('./lib/getConfig');
const { cookieParse, logger } = require('./lib/helper');
const { updateEnvConfigFile, updateToQlEnvConfig } = require('./lib/update');

const config = getConfig();
const storage = new LiteStorage({ filepath: config.cacheFile || 'w2.scte.json', uuid: 'whistleCookiesCache' });

/**
 * @param {{ rule: import('.').RuleItem; idx: number; url: string; method: string; headers: import('http').IncomingHttpHeaders }}
 */
const ruleHandler = async ({ rule, idx, url, method, headers, req }) => {
  const result = { errmsg: '', envConfig: null };
  if (!rule.handler) result.errmsg = 'rule.handler is required';

  // method
  if (!result.errmsg && rule.method && !micromatch.isMatch(method, rule.method) && rule.method.toLowerCase() !== method.toLowerCase()) {
    result.errmsg = `[method] ${method} not match rule.method ${rule.method}`;
  }

  if (!result.errmsg) {
    // url match
    if (typeof rule.url === 'function') {
      if (!rule.url(url, method, headers)) result.errmsg = '[func] url match failed';
    } else if (rule.url instanceof RegExp) {
      if (!rule.url.test(url)) result.errmsg = '[RegExp] url match failed';
    } else if (typeof rule.url === 'string') {
      if (!url.includes(rule.url) && !micromatch.isMatch(url, rule.url)) {
        result.errmsg = `url ${url} not match rule.url ${color.cyan(rule.url)}`;
      }
    }
  }

  if (result.errmsg) return result;

  const cookieObj = cookieParse(headers.cookie);
  let uidData;
  let uid = typeof rule.getUserUuid === 'function' ? rule.getUserUuid(headers, url, cookieObj, req) : rule.getUserUuid || 'defaults';
  if (uid && typeof uid === 'object') {
    uidData = uid.data;
    uid = uid.uid;
  }

  if (!uid) {
    result.errmsg = '[rule.getUserUuid] `uid` is required';
    return result;
  }

  const cacheData = rule.cacheId ? storage.getItem(rule.cacheId) || {} : {};

  if (cacheData[uid]) {
    if (Date.now() - cacheData[uid].update < 1000 * config.throttleTime) {
      result.errmsg = `[throttle][${Date.now() - cacheData[uid].update}ms][${rule.cacheId}][${uid}] cache hit`;
      return result;
    }

    if (uidData && rule.mergeCache && typeof uidData === 'object') uidData = assign({}, cacheData[uid].data.data, uidData);
  }

  cacheData[uid] = { update: Date.now(), data: { uid, headers, data: uidData } };
  if (rule.cacheId) storage.setItem(rule.cacheId, cacheData);
  const allCacheData = Object.values(cacheData).map(d => d.data);

  if (!rule.desc) rule.desc = `rule-${idx} for ${headers.host}`;

  result.envConfig = await rule.handler(allCacheData, headers, url, cookieObj, req);
  if (!result.envConfig) result.errmsg = 'rule.handler 返回值为空';

  return result;
};

exports.server = server => {
  logger.info(color.green(require('./package.json').name), '插件已加载');
  logger.debug('storage filepath:', storage.config.filepath, '\nconfig:', config);

  server.on('request', async (req, res) => {
    try {
      const { method, headers } = req;
      const { url, ruleValue } = req.originalReq;

      logger.debug('request', method, url, headers);

      if (config.rules?.length > 0) {
        config.rules.forEach(async (rule, idx) => {
          if (rule.disabled) return;

          const result = await ruleHandler({ rule, idx, url, method, headers, req });
          logger.debug(`[rule][${color.green(rule.desc)}]`, result.envConfig ? color.green('通过') : color.gray(`忽略：${result.errmsg}`));

          if (result.envConfig) {
            (Array.isArray(result.envConfig) ? result.envConfig : [result.envConfig]).forEach(envConfig => {
              if (!envConfig?.name) return;

              if (!envConfig.desc) envConfig.desc = rule.desc;
              if (rule.toQL !== false) updateToQlEnvConfig(envConfig, rule.updateEnvValue);
              if (config.qlHost && rule.toEnvFile !== false) updateEnvConfigFile(envConfig, rule.updateEnvValue, config.envConfFile);
            });
          }
        });
      }

      req.passThrough();
    } catch (error) {
      logger.log(error.toString());
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(error.toString());
    }
  });

  // handle websocket request
  // server.on('upgrade', (req /*, socket*/) => {
  //   // todo: 修改 websocket 请求用
  //   req.passThrough();
  // });
  // // handle tunnel request
  // server.on('connect', (req /*, socket*/) => {
  //   // todo: 修改普通 tcp 请求用
  //   req.passThrough();
  // });
  server.on('error', err => logger.log(err));
};
