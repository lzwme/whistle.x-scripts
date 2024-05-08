/*
 * @Author: renxia
 * @Date: 2024-01-10 16:58:26
 * @LastEditors: renxia
 * @LastEditTime: 2024-05-08 15:19:51
 * @Description: 基于 whistle 的 cookie 自动抓取插件
 */

import { assign, color, cookieParse } from '@lzwme/fe-utils';
import micromatch from 'micromatch';
import type { EnvConfig, RuleHandlerParams, RuleHandlerResult, RuleItem } from '../../typings';
import { getConfig } from './getConfig';
import { type CacheStorItem, getCacheStorage, logger } from './helper';
import { updateEnvConfigFile, updateToQlEnvConfig } from './update';
import { X } from './X';
import * as util from '../util/util';

type RuleHandlerOptions = {
  rule: RuleItem;
  req: (Whistle.PluginServerRequest | Whistle.PluginReqCtx) & { _reqBody?: Buffer | Record<string, any> };
  res: (Whistle.PluginResponse | Whistle.PluginResCtx) & { _resBody?: Buffer | Record<string, any> | string };
  reqBody?: Buffer | Record<string, any> | string;
  resBody?: Buffer;
};

export function ruleMatcher({ rule, req }: RuleHandlerOptions) {
  let errmsg = '';

  // method
  const { method } = req;
  if (rule.method && rule.method.toLowerCase() !== method.toLowerCase() && !micromatch.isMatch(method, rule.method)) {
    errmsg = `[method] ${method} not match rule.method ${rule.method}`;
  }

  // url match
  if (!errmsg) {
    const { url } = req.originalReq;
    const urlMatchList = Array.isArray(rule.url) ? rule.url : [rule.url];
    const isUrlMatch = urlMatchList.some(ruleUrl => {
      if (typeof ruleUrl === 'function') {
        return ruleUrl(url, method, req.headers);
      } else if (ruleUrl instanceof RegExp) {
        return ruleUrl.test(url);
      } else if (typeof ruleUrl === 'string') {
        return url == ruleUrl || micromatch.isMatch(url, ruleUrl);
      }
    });

    if (!isUrlMatch) errmsg = `[url] ${url} not match rule.url`;
  }

  if (errmsg) {
    errmsg = `[ruleMatcher][${rule.ruleId}] ${errmsg}`;
    logger.trace(errmsg);
  }
  return errmsg;
}

export async function ruleHandler({ rule, req, res, reqBody, resBody }: RuleHandlerOptions) {
  const result: RuleHandlerResult = { errmsg: ruleMatcher({ rule, req, res }), envConfig: null, body: null };
  if (result.errmsg) return result;

  const config = getConfig();
  const { headers, fullUrl: url } = req;
  const cookieObj = cookieParse(headers.cookie);
  const resHeaders = (res as Whistle.PluginResCtx).headers;

  // decode reqBody
  if (reqBody && !req._reqBody) {
    if ('getJson' in req) {
      req._reqBody = await new Promise(rs => req.getJson((err, json) => (err ? rs(util.jsonParse(reqBody) || reqBody) : rs(json))));
    } else {
      req._reqBody = util.jsonParse(reqBody) || reqBody;
    }
  }

  // decode resBody
  if (resBody && !res._resBody) {
    if ('getJson' in res) {
      res._resBody = await new Promise(rs => res.getJson((_err, json) => rs(json)));
    }

    if (!res._resBody) {
      let ubody = await new Promise(rs => util.unzipBody(resHeaders, resBody, (_e, d) => rs(d)));
      if (ubody && util.isText(resHeaders)) ubody = String(ubody || '');
      res._resBody = util.isJSON(resHeaders) || util.isJSON(headers) ? util.jsonParse(ubody) || ubody : ubody;
    }
  }

  const params: RuleHandlerParams = { req, reqBody: req._reqBody, resBody: res._resBody, headers, url, cookieObj, cacheData: [], X };
  if (resHeaders) params.resHeaders = resHeaders;

  if (rule.getCacheUid) {
    let uidData;
    let uid = typeof rule.getCacheUid === 'function' ? rule.getCacheUid(params) : rule.getCacheUid;

    if (typeof uid === 'object') {
      uidData = uid.data;
      uid = uid.uid;
    }

    if (uid) {
      const storage = getCacheStorage();
      const now = Date.now();
      const cacheData: CacheStorItem = rule.ruleId ? storage.getItem(rule.ruleId) || {} : {};

      if (cacheData[uid]) {
        if (now - cacheData[uid].update < 1000 * config.throttleTime!) {
          result.errmsg = `[throttle][${Date.now() - cacheData[uid].update}ms][${rule.ruleId}][${uid}] cache hit`;
          return result;
        }

        if (uidData && rule.mergeCache && typeof uidData === 'object') uidData = assign({}, cacheData[uid].data.data, uidData);
      }

      cacheData[uid] = { update: now, data: { uid, headers: req.originalReq.headers, data: uidData } };

      params.cacheData = [];
      const cacheDuration = 1000 * (Number(rule.cacheDuration || config.cacheDuration) || (rule.updateEnvValue ? 12 : 24 * 10) * 3600);
      for (const [key, value] of Object.entries(cacheData)) {
        if (cacheDuration && now - value.update > cacheDuration) delete cacheData[key];
        else params.cacheData.push(value.data);
      }
      params.allCacheData = params.cacheData;

      storage.setItem(rule.ruleId, cacheData);
    } else {
      result.errmsg = '[rule.getCacheUid] `uid` is required';
      return result;
    }
  }

  const r = await rule.handler(params);
  if (r) {
    if (typeof r === 'string' || Buffer.isBuffer(r)) result.body = r;
    else if ('envConfig' in r || 'errmsg' in r || 'body' in r) Object.assign(result, r);
    else if (rule.getCacheUid) {
      if (Array.isArray(r)) result.envConfig = r;
      else if ('name' in r && 'value' in r) result.envConfig = r as EnvConfig;
      else result.body = JSON.stringify(r);
    } else {
      result.body = JSON.stringify(r);
    }

    if (result.envConfig) {
      (Array.isArray(result.envConfig) ? result.envConfig : [result.envConfig]).forEach(async envConfig => {
        if (!envConfig || !('value' in envConfig)) return;

        if (!envConfig.name) envConfig.name = rule.ruleId;
        if (!envConfig.desc) envConfig.desc = rule.desc;
        if (config.ql?.enable !== false && rule.toQL !== false) await updateToQlEnvConfig(envConfig, rule.updateEnvValue);
        if (config.envConfFile && rule.toEnvFile !== false) updateEnvConfigFile(envConfig, rule.updateEnvValue, config.envConfFile);
      });
    }
  } else logger.trace(`[rule.handler][${rule.on}]未返回有效数据格式`, rule.ruleId, rule.desc, req.fullUrl);

  return result;
}
