/*
 * @Author: renxia
 * @Date: 2024-01-11 13:38:34
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-23 08:44:19
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
const updateCache = { qlEnvList: [] as QLEnvItem[] };

export async function updateToQlEnvConfig({ name, value, desc }: EnvConfig, updateEnvValue?: RuleItem['updateEnvValue']) {
  const config = getConfig();
  const ql = QingLoing.getInstance({ token: config.qlToken, host: config.qlHost });
  if (!(await ql.login())) return;

  let item = updateCache.qlEnvList.find(d => d.name === name);
  if (!item) {
    updateCache.qlEnvList = await ql.getEnvList();
    item = updateCache.qlEnvList.find(d => d.name === name);
  }

  let r: QLResponse;
  const params: Partial<QLEnvItem> = { value, name: name };
  if (desc) params.remarks = desc;

  if (item) {
    if (item.value.includes(value)) {
      logger.log(`[${magenta('updateToQL')}]${cyan(name)} is already ${gray(value)}`);
      return;
    }

    if (updateEnvValue) {
      if (updateEnvValue instanceof RegExp) params.value = updateEnvValueByRegExp(updateEnvValue, { name, value, desc }, item.value);
      else params.value = await updateEnvValue({ name, value }, item.value, X);
      if (!params.value) return;
    }

    params.id = item.id;
    params.remarks = desc || item.remarks || '';
    r = await ql.addEnv(params as QLEnvItem);
  } else {
    r = await ql.updateEnv([params as QLEnvItem]);
  }

  const isSuccess = r.code === 200;
  logger.info(`${item ? green('更新') : magenta('新增')}QL环境变量[${name}]`, isSuccess ? '成功' : r);
  if (isSuccess && item) item.value = value;

  return value;
}

export async function updateEnvConfigFile({ name, value, desc }: EnvConfig, updateEnvValue: RuleItem['updateEnvValue'], filePath: string) {
  if (!filePath) return;

  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const isExist = content.includes(`export ${name}=`);

  if (isExist) {
    const oldValue = content.match(new RegExp(`export ${name}="(.*)"`))?.[1] || '';

    if (oldValue.includes(value)) {
      logger.log(`[UpdateEnv]${color.cyan(name)} 已存在`, color.gray(value));
      return;
    }

    if (updateEnvValue) {
      if (updateEnvValue instanceof RegExp) value = updateEnvValueByRegExp(updateEnvValue, { name, value }, oldValue);
      else value = (await updateEnvValue({ name, value }, oldValue, X)) as string;
      if (!value) return;
    }

    content = content.replace(new RegExp(`export ${name}=.*`, 'g'), `export ${name}="${value}"`);
  } else {
    if (desc) content += `\n# ${desc}`;
    content += `\nexport ${name}="${value}"`;
  }
  await fs.promises.writeFile(filePath, content, 'utf8');
  logger.info(`[${cyan(filePath)}]${isExist ? green('更新') : magenta('新增')}环境变量`, `${green(name)}="${gray(value)}"`);
  return value;
}

/** 更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
function updateEnvValueByRegExp(re: RegExp, { name, value }: EnvConfig, oldValue: string) {
  if (!(re instanceof RegExp)) throw Error(`[${name}]updateEnvValue 应为一个正则匹配表达式`);

  const sep = oldValue.includes('\n') ? '\n' : '&';
  if (sep !== '&') value = value.replaceAll('&', sep);
  oldValue.split(sep).forEach(cookie => {
    const uidValue = cookie.match(re)?.[0];
    if (uidValue && !value.includes(uidValue)) value += `${sep}${cookie}`;
  });
  return value;
}
