/*
 * @Author: renxia
 * @Date: 2024-01-11 13:38:34
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-11 22:17:49
 * @Description:
 */
const { Request, color } = require('@lzwme/fe-utils');
const fs = require('node:fs');
const { getConfig } = require('./getConfig');
const { logger } = require('./helper');

const { green, magenta, gray, cyan } = color;
const qlReq = new Request('', { accept: 'application/json' });
const updateCache = { qlEnvList: [] };

async function updateToQlEnvConfig({ name, value, desc }, updateEnvValue) {
  const config = getConfig();
  if (!config.qlToken) {
    if (fs.existsSync('/ql/data/config/auth.json')) {
      config.qlToken = fs.readFileSync('/ql/data/config/auth.json').token;
    }
    if (!config.qlToken) {
      logger.warn('请在配置文件中配置 qlToken 变量');
      return;
    }
  }

  qlReq.setHeaders({ Authorization: `Bearer ${config.qlToken}` });

  let item = updateCache.qlEnvList.find(d => d.name === name);
  if (!item) {
    const { data: list } = await qlReq.get(`${config.qlHost}/api/envs?searchValue=&t=${Date.now()}`);
    if (list.code !== 200) {
      logger.error('[updateToQlEnvConfig]获取环境变量列表失败！', list.message);
      return;
    }

    updateCache.qlEnvList = list.data || [];
    item = updateCache.qlEnvList.find(d => d.name === name);
  }

  let r;
  const params = { value, name: name };
  if (desc) params.remarks = desc;

  if (item) {
    if (item.value.includes(value)) {
      logger.debug('updateToQlEnvConfig', `${cyan(name)} is already ${gray(value)}`);
      return;
    }

    if (updateEnvValue) {
      params.value = await updateEnvValue({ name, value, desc }, item.value);
      if (!params.value) return;
    }

    params.id = item.id;
    params.remarks = desc || item.remarks || '';
    r = await qlReq.request('PUT', `${config.qlHost}/api/envs?t=${Date.now()}`, params);
  } else {
    r = await qlReq.post(`${config.qlHost}/api/envs?t=${Date.now()}`, params);
  }

  const isSuccess = r.data.code === 200;
  logger.info(`${item ? green('更新') : magenta('新增')}QL环境变量[${name}]`, isSuccess ? '成功' : r.data.message || '失败');
  if (isSuccess && item) item.value = value;

  return isSuccess;
}

async function updateEnvConfigFile({ name, value, desc }, updateEnvValue, filePath) {
  if (!filePath) return;

  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const isExist = content.includes(`export ${name}=`);

  if (isExist) {
    const oldValue = content.match(new RegExp(`export ${name}="(.*)"`))[1];

    if (String(oldValue).includes(value)) {
      logger.debug(`[${color.cyan(name)}]已存在相同的环境变量配置：`, color.gray(`export ${name}="${value}"`));
      return;
    }

    if (updateEnvValue) {
      value = await updateEnvValue({ name, value, desc }, oldValue);
      if (!value) return;
    }

    content = content.replace(new RegExp(`export ${name}=.*`, 'g'), `export ${name}="${value}"`);
  } else {
    if (desc) content += `\n# ${desc}`;
    content += `\nexport ${name}="${value}"`;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  logger.info(`[${cyan(filePath)}]${isExist ? green('更新') : magenta('新增')}环境变量`, `${green(name)}="${gray(value)}"`);
  return true;
}

module.exports = {
  updateToQlEnvConfig,
  updateEnvConfigFile,
};
