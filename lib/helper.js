/*
 * @Author: renxia
 * @Date: 2024-01-11 13:15:52
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-11 22:07:37
 * @Description:
 */

const { NLogger } = require('@lzwme/fe-utils');

function cookieParse(cookie = '') {
  const obj = {};
  if (typeof cookie === 'string' && cookie.length > 0) {
    cookie.split(';').forEach(d => {
      const [name, value] = d
        .trim()
        .split('=')
        .map(d => d.trim());
        try {
          if (value != null) obj[name] = decodeURIComponent(value);
        } catch(e1) {
          try {
            obj[name] = unescape(value);
          } catch(e2) {
            obj[name] = value || '';
            logger.warn('decodeURIComponent Failed!', name, value);
          }
        }
    });
  }
  return obj;
}

function cookieStringfiy(cookieObj, filterKeys = []) {
  if (filterKeys.length > 0) {
    cookieObj = { ...cookieObj };
    filterKeys.forEach(key => delete cookieObj[key]);
  }

  return Object.keys(cookieObj)
    .map(key => `${key}=${encodeURIComponent(cookieObj[key])}`)
    .join('; ');
}

const logger = new NLogger('[W2_SCTE]');

module.exports = {
  cookieParse,
  cookieStringfiy,
  logger,
};
