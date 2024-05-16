/*
 * @Author: renxia
 * @Date: 2024-01-11 13:38:34
 * @LastEditors: renxia
 * @LastEditTime: 2024-05-16 14:58:45
 * @Description:
 */
import fs from 'node:fs';
import { color } from '@lzwme/fe-utils';
import type { EnvConfig, RuleItem } from '../../typings';
import { getConfig } from './getConfig';
import { logger } from './helper';
import { X } from './X';
import { QingLoing, type QLResponse, type QLEnvItem } from './QingLong';

const { green, magenta, gray, cyan } = color;
const updateCache = { qlEnvList: [] as QLEnvItem[], updateTime: 0 };

export async function updateToQlEnvConfig(envConfig: EnvConfig, updateEnvValue?: RuleItem['updateEnvValue']) {
  const config = getConfig();
  const ql = QingLoing.getInstance({ ...config.ql, debug: config.debug });
  if (!(await ql.login())) return;

  if (Date.now() - updateCache.updateTime > 1000 * 60 * 60 * 1) updateCache.qlEnvList = [];
  const { name, value, desc, sep = '\n' } = envConfig;
  let item = updateCache.qlEnvList.find(d => d.name === name);
  if (!item) {
    updateCache.qlEnvList = await ql.getEnvList();
    updateCache.updateTime = Date.now();
    item = updateCache.qlEnvList.find(d => d.name === name);
  }

  let r: QLResponse;
  const params: Partial<QLEnvItem> = { name, value };
  if (desc) params.remarks = desc;

  if (item) {
    if (item.value.includes(value)) {
      logger.log(`[${magenta('updateToQL')}]${cyan(name)} is already ${gray(value)}`);
      return;
    }

    if (updateEnvValue) {
      if (updateEnvValue instanceof RegExp) params.value = updateEnvValueByRegExp(updateEnvValue, envConfig, item.value);
      else params.value = await updateEnvValue(envConfig, item.value, X);
    } else if (value.includes('##') && item.value.includes('##')) {
      // 支持配置以 ## 隔离 uid
      params.value = updateEnvValueByRegExp(/##([a-z0-9_\-*]+)/i, envConfig, item.value);
    }

    if (!params.value) return;

    if (params.value.length + 10 < item.value.length) {
      logger.warn(`[QL]更新值长度小于原始值！\nOLD: ${item.value}\nNEW: ${params.value}`);
    }

    params.id = item.id;
    params.remarks = desc || item.remarks || '';
    item.value = params.value;
    r = await ql.updateEnv(params as QLEnvItem);
  } else {
    r = await ql.addEnv([params as QLEnvItem]);
  }

  const isSuccess = r.code === 200;
  const count = params.value.includes(sep) ? params.value.trim().split(sep).length : 1;
  logger.info(`${item ? green('更新') : magenta('新增')}QL环境变量[${green(name)}][${count}]`, isSuccess ? '成功' : r);

  return value;
}

export async function updateEnvConfigFile(envConfig: EnvConfig, updateEnvValue: RuleItem['updateEnvValue'], filePath: string) {
  if (!filePath) return;

  let { name, value, desc } = envConfig;
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const isExist = content.includes(`export ${name}=`);

  if (isExist) {
    const oldValue = content.match(new RegExp(`export ${name}="([^"]+)"`))?.[1] || '';

    if (oldValue.includes(value)) {
      logger.log(`[UpdateEnv]${color.cyan(name)} 已存在`, color.gray(value));
      return;
    }

    if (updateEnvValue) {
      if (updateEnvValue instanceof RegExp) value = updateEnvValueByRegExp(updateEnvValue, envConfig, oldValue);
      else value = (await updateEnvValue(envConfig, oldValue, X)) as string;
      if (!value) return;
    } else if (value.includes('##') && value.includes('##')) {
      // 支持配置以 ## 隔离 uid
      value = updateEnvValueByRegExp(/##([a-z0-9_\-*]+)/i, envConfig, value);
    }

    content = content.replace(`export ${name}="${oldValue}"`, `export ${name}="${value}"`);
  } else {
    if (desc) content += `\n# ${desc}`;
    content += `\nexport ${name}="${value}"`;
  }
  await fs.promises.writeFile(filePath, content, 'utf8');
  logger.info(`[${cyan(filePath)}]${isExist ? green('更新') : magenta('新增')}环境变量`, `${green(name)}="${gray(value)}"`);
  return value;
}

/** 更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
function updateEnvValueByRegExp(re: RegExp, { name, value, sep }: EnvConfig, oldValue: string) {
  if (!(re instanceof RegExp)) throw Error(`[${name}]updateEnvValue 应为一个正则匹配表达式`);

  const sepList = ['\n', '&'];
  const oldSep = sep && oldValue.includes(sep) ? sep : sepList.find(d => oldValue.includes(d));
  const curSep = sep || sepList.find(d => value.includes(d));
  if (!sep) sep = oldSep || curSep || '\n';
  // if (sep !== '&') value = value.replaceAll('&', sep);

  const val: string[] = [];
  const values = value.split(curSep || sep).map(d => ({ value: d, id: d.match(re)?.[0] }));

  oldValue.split(oldSep || sep).forEach(cookie => {
    if (!cookie) return;

    const uidValue = cookie.match(re)?.[0];
    if (uidValue) {
      const item = values.find(d => d.id === uidValue);
      val.push(item ? item.value : cookie);
    } else {
      logger.warn(`[${name}][updateEnvValueByRegExp]oldValue未匹配到uid`, re.toString(), cookie);
      val.push(cookie);
    }
  });

  values.forEach(d => !val.includes(d.value) && val.push(d.value));

  return val.join(sep);
}
