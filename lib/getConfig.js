/*
 * @Author: renxia
 * @Date: 2024-01-11 13:17:00
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-11 22:21:47
 * @Description:
 */
const { existsSync } = require('node:fs');
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
      cacheId: 'JD_COOKIE',
      desc: '京东 cookie 自动抓取并同步至青龙环境变量',
      url: 'api.m.jd.com',
      method: '*',
      toQL: false,
      toEnvFile: true,
      mergeCache: false,
      /** 获取当前用户唯一性的 uid */
      getUserUuid: (headers, url, cookieObj, req) => ({ uid: cookieObj.pt_pin, data: cookieObj }),
      handler: (allCacheData, headers, url, cookieObj, req) => {
        if (!cookieObj.pt_pin || !cookieObj.pt_key) return;

        // 生成环境变量配置
        const envConfig = {
          name: 'JD_COOKIE',
          // value: allCacheData.map(d => d.headers.cookie).join('&'),
          value: allCacheData.map(d => `pt_key=${d.data.pt_key};pt_pin=${d.data.pt_pin}`).join('&'),
          desc: '京东 cookie',
        };

        // console.log('JD_COOKIE:', cookieObj.pt_pin, cookieObj.pt_key, envConfig);
        // 可以根据需要返回多个环境变量的配置
        return [envConfig];
      },
      updateEnvValue(envConfig, oldValue) {
        const oldValues = oldValue.includes('&') ? oldValue.split('&') : oldValue.split('\n');

        for (const cookie of oldValues) {
          const pt_pin = cookie.match(/pt_pin=(\w+)/)?.[0];
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
    const defaultConfigFile = resolve(homedir(), '.w2.scte.config.js');
    const fileList = [defaultConfigFile, process.env.W2_COOKIES_CONFIG || './.w2.scte.config.js'];

    for (let configFilePath of fileList) {
      try {
        configFilePath = resolve(process.cwd(), configFilePath);
        if (existsSync(configFilePath)) {
          assign(config, require(configFilePath));
          logger.info('配置文件加载成功', color.cyan(configFilePath));
          isLoadUserConfig = true;
        }
      } catch (e) {
        logger.error('配置文件加载失败', color.red(configFilePath), e);
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
