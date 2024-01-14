/*
 * @Author: renxia
 * @Date: 2024-01-11 13:17:00
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-18 09:41:53
 * @Description:
 */
import type { W2CookiesConfig } from '../../typings';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { assign, color } from '@lzwme/fe-utils';
import { logger } from './helper';
import { rulesManage } from './rulesManage';

const config: W2CookiesConfig = {
  debug: Boolean(process.env.DEBUG),
  logType: process.env.LOG_TYPE as never,
  qlHost: process.env.QL_HOST || 'http://127.0.0.1:5700',
  qlToken: '',
  envConfFile: 'env-config.sh',
  cacheFile: 'w2.x-scripts.cache.json',
  rules: [],
};
let isLoaded = false;

export function getConfig(useCache = true) {
  if (!useCache || !isLoaded) {
    const configFileName = 'w2.x-scripts.config.js';
    const defaultConfigFile = resolve(homedir(), configFileName);
    const dirList = new Set(
      ['.', process.env.W2_COOKIES_CONFIG || '.', '..', '...', defaultConfigFile].map(d => resolve(process.cwd(), d))
    );

    const isLoadUserConfig = [...dirList].some(configFilePath => {
      try {
        if (!existsSync(configFilePath)) return;
        if (statSync(configFilePath).isDirectory()) configFilePath = resolve(configFilePath, configFileName);
        if (!existsSync(configFilePath)) return;

        assign(config, require(configFilePath));
        config.rules.forEach(d => d._source = configFilePath);
        logger.info('配置文件加载成功', color.cyan(configFilePath));
        return true;
      } catch (e) {
        logger.error('配置文件加载失败', color.red(configFilePath));
        console.log(e);
      }
    });

    if (!config.logType) config.logType = config.debug ? 'debug' : 'info';
    logger.updateOptions({ levelType: config.logType, debug: config.debug });
    if (!isLoadUserConfig) logger.info('请创建配置文件', color.yellow(defaultConfigFile));

    config.throttleTime = Math.max(1, +config.throttleTime || 10);

    const allRules = rulesManage.loadRules(config.ruleDirs, !isLoaded);
    config.rules.forEach(d => allRules.add(d));
    rulesManage.classifyRules([...allRules], !isLoaded);

    isLoaded = true;
  }

  return config;
}