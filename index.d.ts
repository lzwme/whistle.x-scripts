/*
 * @Author: renxia
 * @Date: 2024-01-11 16:53:50
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-11 20:27:36
 * @Description:
 */
import http from 'http';

export interface W2CookiesConfig {
  /** 是否开启调试模式。默认读取环境变量 DEBUG */
  debug?: boolean;
  /** 青龙服务地址 */
  qlHost?: string;
  /** 青龙服务 token。用于更新或修改 环境变量 */
  qlToken?: string;
  /** 写入环境变量信息到本地文件 */
  envConfFile?: string;
  /** 缓存数据保存路径 */
  cacheFile?: string;
  /** 数据处理防抖时间间隔。单位为秒，默认为 10 (s) */
  throttleTime?: number;
  /** 自定义匹配规则 */
  rules?: RuleItem[];
}

interface RuleItem {
  /** 禁用该规则 */
  disabled?: boolean;
  /** 该规则命中数据的缓存唯一 id */
  cacheId?: string;
  /** 规则描述 */
  desc?: string;
  /** url 匹配规则 */
  url?: string | RegExp | ((url: string, method: string, headers: http.IncomingHttpHeaders) => boolean);
  /** 方法匹配。** 表示全部匹配。可选： post、get、put 等 */
  method?: string;
  /** 是否上传至 青龙 环境变量配置。需配置 qlToken */
  toQL?: boolean;
  /** 是否写入到环境变量配置文件中。默认是 */
  toEnvFile?: boolean;
  /** 是否合并不同请求的缓存数据。默认为 false 覆盖 */
  mergeCache?: boolean;
  /** 获取当前用户唯一性的 uuid，及自定义缓存数据 */
  getUserUuid?: (
    headers?: http.IncomingHttpHeaders,
    url?: string,
    cookieObj?: Record<string, string>,
    req?: any
  ) => string | { uid: string; data: any } | undefined;
  /** 规则处理并返回环境变量配置。可以数组的形式返回多个 */
  handler?: (
    allCacheData?: CacheData[],
    headers?: http.IncomingHttpHeaders,
    url?: string,
    cookieObj?: Record<string, string>,
    req?: any
  ) => EnvConfig[] | EnvConfig | undefined;
  /** 更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
  updateEnvValue?: (envConfig: EnvConfig, oldValue: string) => string | undefined;
}

interface EnvConfig {
  /** 环境变量名称 */
  name: string;
  /** 环境变量值 */
  value: string;
  desc?: string;
}

interface CacheData<T = any> {
  uid: string;
  headers: http.IncomingHttpHeaders;
  data: T;
}
