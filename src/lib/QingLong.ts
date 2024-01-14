/*
 * @Author: renxia
 * @Date: 2024-01-18 10:12:52
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-18 10:46:24
 * @Description: 青龙面板 API 简易封装
 */
import { existsSync } from 'node:fs';
import { Request, readJsonFileSync } from '@lzwme/fe-utils';
import { logger } from './helper';

export type QLOptions = { host?: string; token?: string; username?: string; password?: string };
export type QLEnvItem = { name: string; value: string; id?: string; remarks: string };
export type QLResponse<T = any> = { code: number; message: string; data: T };

export class QingLoing {
  private static inc: QingLoing;
  static getInstance(config?: QLOptions) {
    if (!QingLoing.inc) QingLoing.inc = new QingLoing(config);
    return QingLoing.inc;
  }
  private loginStatus: string;
  public req = new Request('', { 'content-type': 'application/json' });
  constructor(private config: QLOptions = {}) {}
  async login(config?: QLOptions) {
    if (this.loginStatus === '1') return true;

    if (config || this.loginStatus == null) {
      config = Object.assign(this.config, config || {});

      for (const filepath of ['/ql/data/config/auth.json', '/ql/config/auth.json']) {
        if (existsSync(filepath)) {
          this.config.token = readJsonFileSync<{ token: string }>(filepath).token;
          break;
        }
      }

      if (this.config.token) {
        this.loginStatus = '1';
        this.req.setHeaders({ Authorization: `Bearer ${this.config.token}` });
        if (!this.config.host) this.config.host = 'http://127.0.0.1:5700';
      } else {
        logger.warn('请在配置文件中配置 qlToken 变量');
        this.loginStatus = '-1';
        return false;
      }
      // else todo: 使用 账号、密码登录。但注意不能开启二步验证
    }

    return this.loginStatus === '1';
  }
  async getEnvList() {
    const { data } = await this.req.get<QLResponse<QLEnvItem[]>>(`${this.config.host}/api/envs?searchValue=&t=${Date.now()}`);
    if (data.code !== 200) {
      logger.error('[updateToQL]获取环境变量列表失败！', data);
      return [];
    }
    return data.data || [];
  }
  addEnv(params: QLEnvItem | QLEnvItem[]) {
    return this.req.request<QLResponse>('PUT', `${this.config.host}/api/envs?t=${Date.now()}`, params).then(d => d.data);
  }
  updateEnv(params: QLEnvItem[]) {
    return this.req.post<QLResponse>(`${this.config.host}/api/envs?t=${Date.now()}`, params).then(d => d.data);
  }
}
