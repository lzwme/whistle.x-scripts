/*
 * @Author: renxia
 * @Date: 2024-01-11 13:17:00
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-11 22:21:47
 * @Description:
 */
const { existsSync, statSync } = require('node:fs');
const { resolve } = require('node:path');
const { homedir } = require('node:os');
const { assign, color } = require('@lzwme/fe-utils');
const { logger } = require('./helper');

/** @type {import('../index').W2CookiesConfig} */
const config = {
  debug: Boolean(process.env.DEBUG),
  qlHost: 'http://127.0.0.1:5700',
  qlToken: '',
  envConfFile: 'env-config.sh',
  cacheFile: 'w2.scte.json',
  rules: [
    {
      disabled: false,
      /** 保存缓存数据ID，应唯一 */
      cacheId: 'JD_COOKIE',
      desc: '京东 cookie 自动抓取并同步至青龙环境变量',
      /** url 匹配规则 */
      url: '.jd.com',
      /** 请求方法匹配 */
      method: '*',
      toQL: true,
      toEnvFile: true,
      mergeCache: false,
      // getUserUid: (headers, url, cookieObj, req) => cookieObj.pt_pin,
      /** 获取当前用户唯一性的 uid */
      getUserUid: (headers, url, cookieObj, req) => {
        // console.log('getUserUid:', url, cookieObj);
        if (cookieObj.wskey && !cookieObj.pin) return;
        if (cookieObj.wskey) console.log('wskey', cookieObj);

        return { uid: cookieObj.pt_pin || cookieObj.pin, data: cookieObj };
      },
      /** 规则处理并返回环境变量配置。可以数组的形式返回多个 */
      handler: (allCacheData, headers, url, cookieObj, req) => {
        if (!cookieObj.pt_pin && !cookieObj.wskey) return;

        // 生成环境变量配置
        const envConfig = [
          {
            name: 'JD_COOKIE',
            // value: allCacheData.filter(d => d.data.pt_pin).map(d => d.headers.cookie).join('&'),
            value: allCacheData
              .filter(d => d.data.pt_pin)
              .map(d => `pt_key=${d.data.pt_key};pt_pin=${d.data.pt_pin};`)
              .join('&'),
            desc: '京东 cookie',
          },
        ];

        if (cookieObj.pin && cookieObj.wskey) {
          envConfig.push({
            name: 'JD_WSCK',
            value: allCacheData
              .filter(d => d.data.wskey)
              .map(d => `pin=${d.data.pin};wskey=${d.data.wskey};`)
              .join('&'),
            desc: '京东 cookie',
          });
        }

        return envConfig;
      },
      /** 更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
      updateEnvValue(envConfig, oldValue) {
        const oldValues = oldValue.includes('&') ? oldValue.split('&') : oldValue.split('\n');

        for (const cookie of oldValues) {
          const pt_pin = cookie.match(/pin=(\w+)/)?.[0];
          if (pt_pin && !envConfig.value.includes(pt_pin)) envConfig.value += `&${cookie}`;
        }

        return envConfig.value;
      },
    },
  ],
};
let isLoaded = false;

function getConfig(useCache = true) {
  if (!useCache || !isLoaded) {
    let isLoadUserConfig = false;
    const configFileName = 'w2.scte.config.js';
    const defaultConfigFile = resolve(homedir(), configFileName);
    const dirList = new Set(['.', process.env.W2_COOKIES_CONFIG || '.', '..', '...', defaultConfigFile].map(d => resolve(process.cwd(), d)));

    for (let configFilePath of dirList) {
      try {
        if (!existsSync(configFilePath)) continue;
        if (statSync(configFilePath).isDirectory()) configFilePath = resolve(configFilePath, configFileName);
        if (!existsSync(configFilePath)) continue;

        assign(config, require(configFilePath));
        logger.info('配置文件加载成功', color.cyan(configFilePath));
        isLoadUserConfig = true;
      } catch (e) {
        logger.error('配置文件加载失败', color.red(configFilePath));
        console.log(e);
      }
    }

    config.throttleTime = Math.max(1, +config.throttleTime || 10);

    if (!isLoadUserConfig) logger.info('请创建配置文件', color.yellow(defaultConfigFile));
    if (config.debug) logger.updateOptions({ levelType: 'debug' });

    isLoaded = true;
  }

  return config;
}

exports.getConfig = getConfig;
