/*
 * @Author: renxia
 * @Date: 2024-01-10 16:58:26
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-18 09:44:09
 * @Description: 基于 whistle 的 cookie 自动抓取插件
 */

import { type AnyObject, assign, color, cookieParse } from '@lzwme/fe-utils';
import micromatch from 'micromatch';
import type { EnvConfig, RuleItem } from '../../typings';
import { getConfig } from './getConfig';
import { type CacheStorItem, getCacheStorage, logger } from './helper';
import { updateEnvConfigFile, updateToQlEnvConfig } from './update';
import { X } from './X';

type RuleHandlerOptions = {
  rule: RuleItem;
  req: Whistle.PluginRequest | Whistle.PluginReqCtx;
  res: Whistle.PluginResponse | Whistle.PluginResCtx;
  reqBody?: Record<string, any> | Buffer;
  resBody?: Record<string, any> | Buffer;
};

function ruleMatcher({ rule, req }: RuleHandlerOptions) {
  let errmsg = '';

  // method
  const { method } = req;
  if (rule.method && rule.method.toLowerCase() !== method.toLowerCase() && !micromatch.isMatch(method, rule.method)) {
    errmsg = `[method] ${method} not match rule.method ${rule.method}`;
  }

  // url match
  if (!errmsg) {
    const { url } = req.originalReq;
    if (typeof rule.url === 'function') {
      if (!rule.url(url, method, req.headers)) errmsg = '[func] url match failed';
    } else if (rule.url instanceof RegExp) {
      if (!rule.url.test(url)) errmsg = '[RegExp] url match failed';
    } else if (typeof rule.url === 'string') {
      if (!url.includes(rule.url) && !micromatch.isMatch(url, rule.url)) {
        errmsg = `url ${url} not match rule.url ${color.cyan(rule.url)}`;
      }
    }
  }

  if (errmsg) {
    errmsg = `[ruleMatcher][${rule.ruleId}] ${errmsg}`;
    logger.trace(errmsg);
  }
  return errmsg;
}

export async function saveCookieRuleHandler({ rule, req, res }: RuleHandlerOptions) {
  const result = { errmsg: ruleMatcher({ rule, req, res }), envConfig: void 0 as EnvConfig | EnvConfig[] | undefined };

  if (result.errmsg) return result;

  const config = getConfig();
  const { headers } = req;
  const { url } = req.originalReq;
  const cookieObj = cookieParse(headers.cookie);
  let uidData;
  let uid = typeof rule.getUid === 'function' ? rule.getUid({ headers, url, cookieObj, req }) : rule.getUid || 'defaults';

  if (typeof uid === 'object') {
    uidData = uid.data;
    uid = uid.uid;
  }

  if (!uid) {
    result.errmsg = '[rule.getUid] `uid` is required';
    return result;
  }

  const storage = getCacheStorage();
  const cacheData: CacheStorItem = rule.ruleId ? storage.getItem(rule.ruleId) || {} : {};

  if (cacheData[uid]) {
    if (Date.now() - cacheData[uid].update < 1000 * config.throttleTime!) {
      result.errmsg = `[throttle][${Date.now() - cacheData[uid].update}ms][${rule.ruleId}][${uid}] cache hit`;
      return result;
    }

    if (uidData && rule.mergeCache && typeof uidData === 'object') uidData = assign({}, cacheData[uid].data.data, uidData);
  }

  cacheData[uid] = { update: Date.now(), data: { uid, headers, data: uidData } };
  if (rule.ruleId) storage.setItem(rule.ruleId, cacheData);
  const allCacheData = Object.values(cacheData).map(d => (d as AnyObject).data);
  const r = await rule.saveCookieHandler({ req, allCacheData, headers, url, cookieObj, X });
  if (r) {
    if (Array.isArray(r)) result.envConfig = r;
    else if ('envConfig' in r || 'errmsg' in r) Object.assign(result, r);
    else if ('name' in r && 'value' in r) result.envConfig = r;
  } else logger.trace(`[rule.saveCookieHandler]未返回有效数据格式`, rule.ruleId, rule.desc, req.fullUrl);

  if (result.envConfig) {
    (Array.isArray(result.envConfig) ? result.envConfig : [result.envConfig]).forEach(async envConfig => {
      if (!envConfig?.name) return;

      if (!envConfig.desc) envConfig.desc = rule.desc;
      if (config.qlHost && rule.toQL !== false) await updateToQlEnvConfig(envConfig, rule.updateEnvValue);
      if (config.envConfFile && rule.toEnvFile !== false) updateEnvConfigFile(envConfig, rule.updateEnvValue, config.envConfFile);
    });
  } else if (!result.errmsg) result.errmsg = 'rule.handler 返回值为空';

  return result;
}

export async function mockRuleHandler({ rule, req, res, reqBody }: RuleHandlerOptions) {
  const result = { errmsg: ruleMatcher({ rule, req, res }), body: null as Buffer | string };
  if (result.errmsg) return result;

  const cookieObj = cookieParse(req.headers.cookie);
  const r = await rule.mockHandler({ req, url: req.fullUrl, headers: req.headers, cookieObj, reqBody, X });
  if (r) {
    if (typeof r === 'string' || Buffer.isBuffer(r)) result.body = r;
    else if ('body' in r || 'errmsg' in r) Object.assign(result, r);
    else result.body = JSON.stringify(r);
  } else logger.trace(`[rule.mockHandler]未返回有效数据格式`, rule.ruleId, rule.desc, req.fullUrl);

  return result;
}

export async function modifyRuleHandler({ rule, req, res, resBody, reqBody }: RuleHandlerOptions) {
  const result = { errmsg: ruleMatcher({ rule, req, res }), body: '' as Buffer | string | object };
  if (result.errmsg) return result;

  const headers = (res as Whistle.PluginResCtx).headers;
  const r = await rule.modifyHandler({ req, resBody, reqBody, url: req.fullUrl, headers, X });
  if (r) {
    if (typeof r === 'string' || Buffer.isBuffer(r)) result.body = r;
    else if ('body' in r || 'errmsg' in r) Object.assign(result, r);
    else result.body = JSON.stringify(r);
  } else logger.trace(`[rule.modifyRuleHandler]未返回有效数据格式`, rule.ruleId, rule.desc, req.fullUrl);

  return result;
}

export const ruleHandler = {
  saveCookie: saveCookieRuleHandler,
  mock: mockRuleHandler,
  modify: modifyRuleHandler,
};
