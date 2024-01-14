/*
 * 通用工具类方法
 * from https://github.com/whistle-plugins/whistle.script/blob/master/lib/util.js
 */

import zlib from 'node:zlib';
import { EventEmitter } from 'node:events';
import { parse as parseUrl } from 'node:url';
import http from 'node:http';
import https from 'node:https';
import dataSource from './dataSource';

export const AUTH_URL = 'x-whistle-.script-auth-url';
export const SNI_URL = 'x-whistle-.script-sni-url';
export const REQ_RULES_URL = 'x-whistle-.script-req-rules-url';
export const RES_RULES_URL = 'x-whistle-.script-res-rules-url';
export const STATS_URL = 'x-whistle-.script-stats-url';
export const DATA_URL = 'x-whistle-.script-data-url';
export const noop = () => {};

const PREFIX_LEN = 'x-whistle-.script-'.length;
const POLICY = 'x-whistle-.script-policy';
export const isFunction = (fn: unknown) => typeof fn === 'function';
const URL_RE = /^https?:(?:\/\/|%3A%2F%2F)[\w.-]/;

export const getCharset = (headers: http.IncomingHttpHeaders) => {
  if (/charset=([^\s]+)/.test(headers['content-type'])) {
    return RegExp.$1;
  }
  return 'utf8';
};

export const isText = (headers: http.IncomingHttpHeaders) => {
  const type = headers['content-type'];
  return !type || (!isBinary(headers) && /javascript|css|html|json|xml|application\/x-www-form-urlencoded|text\//i.test(type));
};

export const isJSON = (headers: http.IncomingHttpHeaders) => {
  const type = headers['content-type'];
  return !type || /json/i.test(type);
};

export const isBinary = (headers: http.IncomingHttpHeaders) => {
  const type = headers['content-type'];
  return type && /image|stream|video\//.test(type);
};

export const unzipBody = (headers: http.IncomingHttpHeaders, body: Buffer, callback: (err: Error | null, d: any) => void) => {
  let unzip;
  let encoding = headers['content-encoding'];
  if (body && typeof encoding === 'string') {
    encoding = encoding.trim().toLowerCase();
    if (encoding === 'gzip') {
      unzip = zlib.gunzip.bind(zlib);
    } else if (encoding === 'deflate') {
      unzip = zlib.inflate.bind(zlib);
    }
  }
  if (!unzip) {
    return callback(null, body);
  }
  unzip(body, (err: Error, data: string) => {
    if (err) {
      return zlib.inflateRaw(body, callback);
    }
    callback(null, data);
  });
};

export const getStreamBuffer = (stream: any) => {
  return new Promise((resolve, reject) => {
    let buffer: Buffer;
    stream.on('data', (data: Buffer) => {
      buffer = buffer ? Buffer.concat([buffer, data]) : data;
    });
    stream.on('end', () => {
      unzipBody(stream.headers, buffer, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data || null);
        }
      });
    });
    stream.on('error', reject);
  });
};

export const setupContext = (ctx: any, options: any) => {
  ctx.options = options;
  ctx.fullUrl = ctx.req.originalReq.url;
};

export const formateRules = (ctx: any) => {
  if (ctx.rules || ctx.values) {
    return {
      rules: Array.isArray(ctx.rules) ? ctx.rules.join('\n') : `${ctx.rules}`,
      values: ctx.values,
    };
  }
};

export const responseRules = (ctx: any) => {
  if (!ctx.body) {
    ctx.body = formateRules(ctx);
  }
};

export const getDataSource = () => {
  const ds = new EventEmitter();
  const handleData = (type: string, args: any[]) => {
    ds.emit(type, ...args);
  };
  dataSource.on('data', handleData);
  return {
    dataSource: ds,
    clearup: () => {
      dataSource.removeListener('data', handleData);
      ds.removeAllListeners();
    },
  };
};

export const getContext = (req: Whistle.PluginRequest, res: Whistle.PluginResponse) => {
  const fullUrl = req.originalReq.url;
  return {
    req,
    res,
    fullUrl,
    url: fullUrl,
    headers: req.headers,
    method: req.method,
  };
};

export const getFn = <F1, F2>(f1: F1, f2?: F2) => {
  if (isFunction(f1)) {
    return f1;
  }
  if (isFunction(f2)) {
    return f2;
  }
};

const req = <T>(url: string, headers: http.IncomingHttpHeaders, data: any) => {
  return new Promise<T>((resolve, reject) => {
    if (!url) {
      resolve(void 0);
      return;
    }

    const options: https.RequestOptions = parseUrl(url);
    options.headers = Object.assign({}, headers);
    delete options.headers.host;
    if (data) {
      data = Buffer.from(JSON.stringify(data));
      options.method = 'POST';
      options.headers['content-type'] = 'application/json';
    }

    const httpModule = options.protocol === 'https:' ? https : http;
    options.rejectUnauthorized = false;
    const client = httpModule.request(options, res => {
      res.on('error', handleError); // eslint-disable-line
      let body: Buffer;
      res.on('data', chunk => {
        body = body ? Buffer.concat([body, chunk]) : chunk;
      });
      res.on('end', () => {
        clearTimeout(timer); // eslint-disable-line
        resolve(jsonParse(body) || '');
      });
    });
    const handleError = (err: Error) => {
      clearTimeout(timer); // eslint-disable-line
      client.destroy();
      reject(err);
    };
    const timer = setTimeout(() => handleError(new Error('Timeout')), 12000);
    client.on('error', handleError);
    client.end(data);
  });
};

export const request = async <T = any>(url: string, headers: http.IncomingHttpHeaders, data: string) => {
  try {
    return req<T>(url, headers, data);
  } catch (e) {
    if (!data) {
      return req<T>(url, headers, data); // get 请求异常则重试一次
    }
  }
};

const hasPolicy = ({ headers, originalReq: { ruleValue } }: Whistle.PluginRequest, name: string) => {
  const policy = headers[POLICY];
  if (typeof policy === 'string') {
    return policy.toLowerCase().indexOf(name) !== -1;
  }
  if (typeof ruleValue === 'string') {
    return ruleValue.indexOf(`=${name}`) !== -1 || ruleValue.indexOf(`&${name}`) !== -1;
  }
};

export const isRemote = (req: Whistle.PluginRequest) => {
  return hasPolicy(req, 'remote');
};

export const isSni = (req: Whistle.PluginRequest) => {
  return hasPolicy(req, 'sni');
};

const getValue = ({ originalReq: req }: Whistle.PluginRequest, name: string) => {
  const { pluginVars, globalPluginVars } = req;
  const vars = globalPluginVars ? pluginVars.concat(globalPluginVars) : pluginVars;
  const len = vars && vars.length;
  if (!len) {
    return;
  }
  for (let i = 0; i < len; i++) {
    const item = vars[i];
    const index = item.indexOf('=');
    if (index !== -1 && item.substring(0, index) === name) {
      return item.substring(index + 1);
    }
  }
};

const getVarName = (name: string) => name.substring(PREFIX_LEN).replace(/-(.)/g, (_, ch) => ch.toUpperCase());

export const getRemoteUrl = (req: Whistle.PluginRequest, name: string) => {
  let url = req.headers[name];
  if (url && typeof url === 'string') {
    url = decodeURIComponent(url);
  } else {
    url = getValue(req, getVarName(name));
  }
  if (URL_RE.test(url as string)) {
    return url as string;
  }
};

export function jsonParse(body: any) {
  try {
    if (body) {
      if (!Buffer.isBuffer(body) && typeof body === 'object') return body;
      return JSON.parse(body.toString()) || '';
    }
  } catch (e) {}
}

export function toBuffer(body: unknown) {
  if (!body) return;
  if (Buffer.isBuffer(body)) return body;
  return Buffer.from(typeof body !== 'string' ? JSON.stringify(body) : body);
}
