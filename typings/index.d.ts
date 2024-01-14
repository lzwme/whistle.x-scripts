/*
 * @Author: renxia
 * @Date: 2024-01-11 16:53:50
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-18 09:46:50
 * @Description:
 */
/// <reference path="global.d.ts" />

type IncomingHttpHeaders = import('http').IncomingHttpHeaders;

export interface W2CookiesConfig {
  /** 是否开启调试模式。默认读取环境变量 DEBUG */
  debug?: boolean;
  /** 日志级别。默认为 info */
  logType?: import('@lzwme/fe-utils').LogLevelType;
  /** 青龙服务地址。用于上传环境变量，若设置为空则不上传 */
  qlHost?: string;
  /** 青龙服务 token。用于创建或更新 QL 环境变量配置。会自动尝试从 /ql/data/config/auth.json 文件中获取 */
  qlToken?: string;
  /** 写入环境变量信息到本地文件的路径。若设置为空则不写入 */
  envConfFile?: string;
  /** 缓存数据保存路径 */
  cacheFile?: string;
  /** 数据处理防抖时间间隔。单位为秒，默认为 10 (s) */
  throttleTime?: number;
  /** 自定义脚本规则 */
  rules?: RuleItem[];
  /** 指定规则集文件路径或所在目录，尝试从该列表加载自定义的规则集 */
  ruleDirs?: string[];
}

/**
 * 规则类型
 */
export type RuleType = 'saveCookie' | 'mock' | 'modify';

type PromiseMaybe<T> = T | Promise<T>;

export interface RuleItem {
  /** 该规则命中数据的缓存唯一 id */
  ruleId: string;
  /**
   * 规则类型。默认为 saveCookie
   * @var saveCookie 从 req headers 及 cookie 提取数据并保存。为默认值
   * @var mock 模拟请求直接返回模拟的数据。也可以拦截后重修改数据新请求
   * @var modify 修改服务端返回的数据结果
   */
  type?: RuleType;
  /** 规则描述 */
  desc?: string;
  /** 禁用该规则 */
  disabled?: boolean;
  /** url 匹配规则 */
  url?: string | RegExp | ((url: string, method: string, headers: IncomingHttpHeaders) => boolean);
  /** 方法匹配。** 表示全部匹配。可选： post、get、put 等 */
  method?: string;
  /** [saveCookie]是否上传至 青龙 环境变量配置。需配置 qlToken */
  toQL?: boolean;
  /** [saveCookie]是否写入到环境变量配置文件中。默认是 */
  toEnvFile?: boolean;
  /** [saveCookie]是否合并不同请求的缓存数据(多个请求抓取的数据合并一起)。默认为 false 覆盖 */
  mergeCache?: boolean;
  /** 文件来源。内置赋值参数，主要用于调试 */
  _source?: string;
  /** [saveCookie]获取当前用户唯一性的 uid，及自定义需缓存的数据 data(可选) */
  getUid?: (ctx: RuleGetUUidCtx) => string | { uid: string; data: any } | undefined;
  /** [saveCookie]更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
  updateEnvValue?: (envConfig: EnvConfig, oldValue: string, X: any) => string | undefined;
  /** <${type}>handler 简写。根据 type 类型自动识别 */
  handler?: (ctx: RuleHandlerParams) => PromiseMaybe<RuleHandlerResult>;
  /** [saveCookie]规则处理并返回环境变量配置。可以数组的形式返回多个 */
  saveCookieHandler?: (ctx: RuleHandlerParams & { allCacheData: CacheData[] }) => PromiseMaybe<RuleHandlerResult | EnvConfig | EnvConfig[]>;
  /** [mock] 接口模拟处理，返回需 mock 的结果。若返回为空则表示忽略 */
  mockHandler?: (ctx: RuleHandlerParams) => PromiseMaybe<RuleHandlerResult<string | Buffer> | Buffer | string | object>;
  /** [modify] TODO: */
  modifyHandler?: (
    ctx: RuleHandlerParams & { resBody: string | Record<string, any> | Buffer }
  ) => PromiseMaybe<RuleHandlerResult | Buffer | string | object>;
}

export type RuleGetUUidCtx = {
  headers: IncomingHttpHeaders;
  url: string;
  cookieObj: Record<string, string>;
  req: Whistle.PluginRequest;
};

export type RuleHandlerParams = {
  req: Whistle.PluginRequest | Whistle.PluginReqCtx;
  /** 封装的工具方法 */
  X: Record<string, any>;
  /** 请求 url 完整地址 */
  url: string;
  headers: IncomingHttpHeaders;
  /** [type=saveCookie] headers.cookie 格式化为的对象格式 */
  cookieObj?: Record<string, string>;
  /** [type=saveCookie] saveCookie 类型，返回同一规则缓存的所有数据(包含由 getUid 格式化返回的 data 数据) */
  allCacheData?: CacheData[];
  /** [type=mock] 请求参数 body */
  reqBody?: Record<string, any> | Buffer;
  /** [type=modify] 接口返回body */
  resBody?: Record<string, any> | Buffer;
};

export type RuleHandlerResult<T = any> = {
  errmsg?: string;
  /** [saveCookie] 返回环境变量的配置 */
  envConfig?: EnvConfig[] | EnvConfig | undefined;
  /** [mock/modify] 返回值。若返回为空表示忽略 */
  body?: T;
};

export interface EnvConfig {
  /** 环境变量名称 */
  name: string;
  /** 环境变量值 */
  value: string;
  desc?: string;
}

interface CacheData<T = any> {
  /** 数据唯一标记，尽量以用户ID等可识别唯一性的参数值。getUid 方法返回 */
  uid: string;
  /** getUid 方法返回，并保存至缓存中的自定义数据。是可选的，主要用于需组合多个请求数据的复杂场景 */
  data: T;
  headers: IncomingHttpHeaders;
}
