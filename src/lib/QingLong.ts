/*
 * @Author: renxia
 * @Date: 2024-01-18 10:12:52
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-23 12:16:59
 * @Description: 青龙面板 API 简易封装
 */
import { existsSync } from 'node:fs';
import { Request, readJsonFileSync } from '@lzwme/fe-utils';
import { logger } from './helper';

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
      if (!this.config.host) this.config.host = 'http://127.0.0.1:5700';

      for (const filepath of ['/ql/data/config/auth.json', '/ql/config/auth.json']) {
        if (existsSync(filepath)) {
          this.config.token = readJsonFileSync<{ token: string }>(filepath).token;
          break;
        }
      }

      if (this.config.token) {
        this.req.setHeaders({ Authorization: `Bearer ${this.config.token}` });
        this.loginStatus = '1';
      } else {
        logger.warn('请在配置文件中配置 qlToken 变量');
        this.loginStatus = '-1';
        return false;
      }
      // else todo: 使用 账号、密码登录。但注意不能开启二步验证
    }

    return this.loginStatus === '1';
  }
  /** 查询环境变量列表 */
  async getEnvList(searchValue = '') {
    const { data } = await this.req.get<QLResponse<QLEnvItem[]>>(`${this.config.host}/api/envs?searchValue=${searchValue}&t=${Date.now()}`);
    if (data.code !== 200) {
      logger.error('[updateToQL]获取环境变量列表失败！', data);
      return [];
    }
    return data.data || [];
  }
  /** 新增环境变量 */
  addEnv(params: QLEnvItem | QLEnvItem[]) {
    return this.req.request<QLResponse>('PUT', `${this.config.host}/api/envs?t=${Date.now()}`, params).then(d => d.data);
  }
  /** 更新环境变量 */
  updateEnv(params: QLEnvItem[]) {
    return this.req.post<QLResponse>(`${this.config.host}/api/envs?t=${Date.now()}`, params).then(d => d.data);
  }
  /** 查询任务列表 */
  async getTaskList(searchValue = '') {
    const { data } = await this.req.get<{ code: number; data: { data: QLTaskItem[] } }>(`${this.config.host}/api/crons?searchValue=${searchValue}&t=${Date.now()}`);
    return data.data?.data || [];
  }
  /** 禁用任务 */
  async disableTask(tasks: QLTaskItem[]) {
    const ids = tasks.map(d => d.id);
    const { data } = await this.req.request('PUT', `${this.config.host}/api/crons/disable`, ids);
    return data.code === 200 ? '🎉成功禁用重复任务~' : `❌出错!!!错误信息为：${JSON.stringify(data)}`;
  }
}

export type QLOptions = { host?: string; token?: string; username?: string; password?: string };
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
