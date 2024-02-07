/*
 * @Author: renxia
 * @Date: 2024-01-18 10:12:52
 * @LastEditors: renxia
 * @LastEditTime: 2024-02-05 22:52:18
 * @Description: 青龙面板 API 简易封装
 */
import { existsSync } from 'node:fs';
import { Request, readJsonFileSync, color } from '@lzwme/fe-utils';
import { logger } from './helper';
import { TOTP } from './TOTP';

export class QingLoing {
  private static inc: QingLoing;
  static getInstance(config?: QLOptions) {
    if (!QingLoing.inc) QingLoing.inc = new QingLoing(config);
    return QingLoing.inc;
  }
  private loginStatus: number = 0;
  private req = new Request('', { 'content-type': 'application/json' });
  public async request<T>(method: 'POST' | 'GET' | 'PUT' | 'DELETE', url: string, params?: any): Promise<QLResponse<T>> {
    if (!url.startsWith('http')) url = this.config.host + (url.startsWith('/') ? '' : '/') + url;
    const { data } = await this.req.request<QLResponse<T>>(method, url, params);

    if (data.code === 401 && this.loginStatus === 1) {
      this.loginStatus = 0;
      this.config.token = '';
      if (await this.login()) return this.request(params, url, params);
    }
    logger.debug(`[QL][req][${color.cyan(method)}]`, color.gray(url), '\n res:', data, '\n req:', params);
    return data;
  }
  constructor(private config: QLOptions = {}) {}
  async login(config?: QLOptions) {
    if (this.loginStatus === 1) return true;

    if (config || this.loginStatus >= -3) {
      config = Object.assign(this.config, config || {});
      if (!this.config.host) this.config.host = 'http://127.0.0.1:5700';
      if (this.config.host.endsWith('/')) this.config.host = this.config.host.slice(0, -1);

      for (const filepath of ['/ql/data/config/auth.json', '/ql/config/auth.json']) {
        if (existsSync(filepath)) {
          const r = readJsonFileSync<{ token: string; username: string; password: string; twoFactorSecret: string }>(filepath);
          if (r.token && r.username) {
            Object.assign(this.config, r);
            break;
          }
        }
      }

      if (!config.token && !config.username) {
        this.loginStatus = -100;
        logger.debug('未设置青龙面板相关相关信息');
        return false;
      }

      // 验证 token 有效性
      if (this.config.token) {
        this.req.setHeaders({ Authorization: `Bearer ${this.config.token}` });
        const r = await this.request('GET', `/api/user?t=${Date.now()}`);
        if (r.code !== 200) {
          logger.warn('token 已失效：', r);
          this.config.token = '';
        }
      }

      if (!this.config.token) this.config.token = await this.getQLToken(this.config);

      if (this.config.token) {
        this.req.setHeaders({ Authorization: `Bearer ${this.config.token}` });
        this.loginStatus = 1;
      } else {
        logger.warn('请在配置文件中配置 ql 相关变量');
        this.loginStatus--;
      }
    }

    return this.loginStatus === 1;
  }
  private async getQLToken({ username, password, twoFactorSecret = '' } = this.config) {
    let token = '';
    if (!username && !password) return '';
    const params: Record<string, string> = { username, password };
    const r1 = await this.request<{ token: string }>('POST', `/api/user/login?t=${Date.now()}`, params);

    if (r1.data?.token) token = r1.data?.token;
    if (r1.code === 420) {
      // 需要两步验证
      if (twoFactorSecret) {
        params.code = TOTP.generate(twoFactorSecret).otp;
        const r = await this.request<{ token: string }>('PUT', `/api/user/two-factor/login?t=${Date.now()}`, params);
        if (r.data?.token) token = r1.data?.token;
        else logger.warn('青龙登陆失败！', color.red(r.message));
      } else {
        logger.error('开启了两步验证，请配置参数 twoFactorSecret');
      }
    }

    return token;
  }
  /** 查询环境变量列表 */
  async getEnvList(searchValue = '') {
    const data = await this.request<QLEnvItem[]>('GET', `/api/envs?searchValue=${searchValue}&t=${Date.now()}`);
    if (data.code !== 200) {
      logger.error('[updateToQL]获取环境变量列表失败！', data);
      return [];
    }

    return data.data || [];
  }
  /** 新增环境变量 */
  addEnv(params: QLEnvItem[]) {
    return this.request<QLEnvItem[]>('POST', `/api/envs?t=${Date.now()}`, params);
  }
  /** 更新环境变量 */
  updateEnv(params: QLEnvItem | QLEnvItem[]) {
    return this.request('PUT', `/api/envs?t=${Date.now()}`, params);
  }
  /** 删除环境变量 */
  delEnv(ids: number | number[]) {
    return this.request('DELETE', `/api/envs?t=${Date.now()}`, Array.isArray(ids) ? ids : [ids]);
  }
  enableEnv(ids: string | string[]) {
    return this.request('PUT', `/api/envs/enable?t=${Date.now()}'`, Array.isArray(ids) ? ids : [ids]);
  }
  disableEnv(ids: string | string[]) {
    return this.request('PUT', `/api/envs/disable?t=${Date.now()}'`, Array.isArray(ids) ? ids : [ids]);
  }
  /** 查询任务列表 */
  async getTaskList(searchValue = '') {
    const data = await this.request<QLTaskItem[]>('GET', `/api/crons?searchValue=${searchValue}&t=${Date.now()}`);
    return data.data || [];
  }
  /** 禁用任务 */
  async disableTask(tasks: QLTaskItem[]) {
    const ids = tasks.map(d => d.id);
    const data = await this.request('PUT', `/api/crons/disable`, ids);
    return data.code === 200 ? '🎉成功禁用重复任务~' : `❌出错!!!错误信息为：${JSON.stringify(data)}`;
  }
}

export type QLOptions = { host?: string; token?: string; username?: string; password?: string; twoFactorSecret?: string };
export type QLEnvItem = { name: string; value: string; id?: string; remarks: string };
export type QLResponse<T = any> = { code: number; message: string; data: T };
export interface QLTaskItem {
  id: number;
  name: string;
  command: string;
  schedule: string;
  timestamp: string;
  saved: boolean;
  status: number;
  isSystem: number;
  pid: number;
  isDisabled: number;
  isPinned: number;
  log_path: string;
  labels: any[];
  last_running_time: number;
  last_execution_time: number;
  sub_id: number;
  extra_schedules?: string;
  task_before?: string;
  task_after?: string;
  createdAt: string;
  updatedAt: string;
  _disable: boolean;
}
