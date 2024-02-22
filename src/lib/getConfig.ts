/*
 * @Author: renxia
 * @Date: 2024-01-11 13:17:00
 * @LastEditors: renxia
 * @LastEditTime: 2024-02-22 21:39:14
 * @Description:
 */
import type { W2XScriptsConfig } from '../../typings';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { homedir } from 'node:os';
import { assign, color } from '@lzwme/fe-utils';
import { logger } from './helper';
import { rulesManage } from './rulesManage';
import { Watcher } from './watch';

const config: W2XScriptsConfig = {
  debug: Boolean(process.env.DEBUG),
  watch: 30000,
  logType: process.env.LOG_TYPE as never,
  ql: {
    host: process.env.QL_HOST || 'http://127.0.0.1:5700',
    token: process.env.QL_TOKEN || '',
    username: process.env.QL_USERNAME || '',
    password: process.env.QL_PASSWORD || '',
    twoFactorSecret: process.env.QL_2FA_SECRET || '',
  },
  envConfFile: 'env-config.sh',
  cacheFile: 'w2.x-scripts.cache.json',
  cacheDuration: 60 * 60 * 12,
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
        config.rules.forEach(d => (d._source = configFilePath));
        logger.info('配置文件加载成功', color.cyan(configFilePath));

        Watcher.add(configFilePath, type => {
          if (type === 'update') {
            logger.info('配置文件更新', color.cyan(configFilePath));
            delete require.cache[require.resolve(configFilePath)];
            getConfig(false);
          }
        });
        return true;
      } catch (e) {
        logger.error('配置文件加载失败', color.red(configFilePath));
        console.log(e);
      }
    });

    if (!config.logType) config.logType = config.debug ? 'debug' : 'info';
    logger.updateOptions({ levelType: config.logType, debug: config.debug });
    if (!isLoadUserConfig) {
      logger.info(
        `请创建配置文件: ${color.yellow(defaultConfigFile)}`,
        `\n参考: ${color.cyan(resolve(__dirname, '../../w2.x-scripts.config.sample.js'))}`
      );
    }

    config.throttleTime = Math.max(1, +config.throttleTime || 10);

    if (!Array.isArray(config.ruleDirs)) config.ruleDirs = [config.ruleDirs as never as string];
    if (basename(process.cwd()).includes('x-scripts-rules')) config.ruleDirs.push(process.cwd());
    readdirSync(process.cwd()).forEach(d => d.includes('x-scripts-rule') && config.ruleDirs!.push(d));

    const allRules = rulesManage.loadRules(config.ruleDirs, !isLoaded);
    config.rules.forEach(d => {
      if (Array.isArray(d)) d.forEach(d => d.ruleId && allRules.set(d.ruleId, d));
      else if (d?.ruleId) allRules.set(d.ruleId, d);
    });
    rulesManage.classifyRules([...allRules.values()], config, !isLoaded);

    isLoaded = true;
    config.watch ? Watcher.start() : Watcher.stop();
  }

  return config;
}
