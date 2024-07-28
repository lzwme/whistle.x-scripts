/*
 * @Author: renxia
 * @Date: 2024-01-11 16:53:50
 * @LastEditors: renxia
 * @LastEditTime: 2024-05-08 15:19:58
 * @Description:
 */
/// <reference path="global.d.ts" />

import type * as FeUtils from '@lzwme/fe-utils';
type IncomingHttpHeaders = import('http').IncomingHttpHeaders;

export interface W2XScriptsConfig {
  /** 是否开启调试模式。默认读取环境变量 DEBUG */
  debug?: boolean;
  /** 是否开启监听模式。若为 number 则设置监听定时器的时间间隔，单位为 ms。默认为 30000 */
  watch?: boolean | number;
  /** 日志级别。默认为 info */
  logType?: import('@lzwme/fe-utils').LogLevelType;
  /** 青龙脚本相关配置 */
  ql?: {
    /** 是否开启青龙面板上传。默认为 true */
    enable?: boolean;
    /** 青龙服务地址。用于上传环境变量，若设置为空则不上传 */
    host?: string;
    /** 青龙服务 token。用于创建或更新 QL 环境变量配置。会自动尝试从 /ql/data/config/auth.json 文件中获取 */
    token?: string;
    /** 登录用户名 */
    username?: string;
    /** 登录密码 */
    password?: string;
    /** 两步验证秘钥。若开启了两步验证则需设置 */
    twoFactorSecret?: string;
    /** open app client_id： 应用设置-创建应用，权限选择 环境变量 */
    clientId?: string;
    /** open app client_secret */
    clientSecret?: string;
  };
  /** 写入环境变量信息到本地文件的路径。若设置为空则不写入 */
  envConfFile?: string;
  /** 缓存数据保存路径 */
  cacheFile?: string;
  /** 数据处理防抖时间间隔。单位为秒，默认为 3 (s) */
  throttleTime?: number;
  /** 缓存数据有效时长。单位秒。默认为 12 小时（12 * 60 * 60） */
  cacheDuration?: number;
  /** 是否启用 rule.mitm 配置。默认为 true。当无法在某些环境下安装 CA 证书时，可设置为 false 以禁用由 mitm 开启的 https 拦截 */
  enableMITM?: boolean;
  /** 自定义脚本规则 */
  rules?: RuleItem[];
  /** 指定规则集文件路径或所在目录，尝试从该列表加载自定义的规则集 */
  ruleDirs?: string[];
  /** 启用的 ruleId。若设置，则仅在该列表中的 ruleId 会启用 */
  ruleInclude?: string[];
  /** 排除/禁用的 ruleId。若设置，则在该列表中的 ruleId 会被过滤 */
  ruleExclude?: string[];
  /** whistle rules 规则列表。可以是本地文件、远程 url、返回规则的自定义函数(仅初始化时执行一次) */
  whistleRules?: WhistleRuleItem[];
}

type WhistleRuleItem = {
  /** 规则类型 */
  type?: 'rules' | 'pac' | 'file';
  /** url，远程加载 */
  url?: string;
  /** 为本地文件或目录路径 */
  path?: string;
  /** whistle Rules 规则列表 */
  rules?: string[];
  /** whistle Values，可在 rules 中引用规则 */
  values?: Record<string, any>;
}

// export type RuleType = 'saveCookie' | 'mock' | 'modify';

/** 规则执行的阶段类型 */
export type RuleRunOnType = 'req-header' | 'req-body' | 'res-body';

type PromiseMaybe<T> = T | Promise<T>;

type RuleUrlItem = string | RegExp | ((url: string, method: string, headers: IncomingHttpHeaders) => boolean);

export interface RuleItem {
  /** 规则 id，唯一标记 */
  ruleId: string;
  /** 规则描述 */
  desc?: string;
  // /**
  //  * 规则类型。默认为 saveCookie
  //  * @var saveCookie 从 req headers 及 cookie 提取数据并保存。为默认值
  //  * @var mock 模拟请求直接返回模拟的数据。也可以拦截后重修改数据新请求
  //  * @var modify 修改服务端返回的数据结果
  //  */
  // type?: RuleType;
  /**
   * 规则执行的阶段类型。
   * @var req-header 获取到 headers 时即执行。可以更早的返回
   * @var req-body 获取到 request body 时执行。例如针对于 post 请求 mock 的场景
   * @var res-body 获取到远程接口返回内容后执行。例如可以保存 body、修改 body 等
   */
  on?: RuleRunOnType;
  /** 禁用该规则 */
  disabled?: boolean;
  /**
   * MITM 域名匹配配置。
   * 当 res-body 类型的规则命中时会主动启用 https 解析拦截(whistle 未启用 https 拦截时)。
   */
  mitm?: string | RegExp | (string | RegExp)[];
  /** url 匹配规则 */
  url?: RuleUrlItem | RuleUrlItem[];
  /** 方法匹配。可选： post、get、put 等。设置为空或 ** 表示全部匹配。若不设置，默认为 post */
  method?: string;
  /** [envConfig]是否上传至 青龙 环境变量配置。需配置 qlToken */
  toQL?: boolean;
  /** [envConfig]是否写入到环境变量配置文件中。默认是 */
  toEnvFile?: boolean;
  /** [getCacheUid]是否合并不同请求的缓存数据(多个请求抓取的数据合并一起)。默认为 false 覆盖 */
  mergeCache?: boolean;
  /** 缓存数据有效时长。单位秒。默认为一天。优先级大于全局设置 */
  cacheDuration?: number;
  /** 文件来源。内置赋值参数，主要用于调试 */
  _source?: string;
  /** 获取当前用户唯一性的 uid，及自定义需缓存的数据 data(可选) */
  getCacheUid?: string | ((ctx: RuleHandlerParams) => string | { uid: string; data: any } | undefined);
  /** [envConfig]更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
  updateEnvValue?: ((envConfig: EnvConfig, oldValue: string, X: RuleHandlerParams['X']) => string | undefined) | RegExp;
  /** <${type}>handler 简写。根据 type 类型自动识别 */
  handler?: (ctx: RuleHandlerParams) => PromiseMaybe<RuleHandlerResult>;
  // /** 规则处理并返回环境变量配置。可以数组的形式返回多个 */
  // saveCookieHandler?: (ctx: RuleHandlerParams & { cacheData: CacheData[] }) => PromiseMaybe<RuleHandlerResult | EnvConfig | EnvConfig[]>;
  // /** [mock] 接口模拟处理，返回需 mock 的结果。若返回为空则表示忽略 */
  // mockHandler?: (ctx: RuleHandlerParams) => PromiseMaybe<RuleHandlerResult<string | Buffer> | Buffer | string | object>;
  // /** [modify] 接收到请求返回数据后修改或保存数据的处理 */
  // modifyHandler?: (
  //   ctx: RuleHandlerParams & { resBody: string | Record<string, any> | Buffer }
  // ) => PromiseMaybe<RuleHandlerResult | Buffer | string | object>;
}

export type RuleGetUUidCtx = {
  headers: IncomingHttpHeaders;
  url: string;
  cookieObj: Record<string, string>;
  req: Whistle.PluginServerRequest;
};

export type RuleHandlerParams = {
  req: Whistle.PluginServerRequest | Whistle.PluginReqCtx;
  /** 封装的工具方法 */
  X: Record<string, any> & {
    FeUtils: typeof FeUtils;
    logger: FeUtils.NLogger;
    cookieParse: (cookie?: string, filterNilValue?: boolean) => Record<string, string>;
    isText: (headers: IncomingHttpHeaders) => boolean;
    isBinary: (headers: IncomingHttpHeaders) => boolean;
    isJSON: (headers: IncomingHttpHeaders, isStrict?: boolean) => boolean;
    toBuffer(body: unknown): Buffer;
  };
  /** 请求 url 完整地址 */
  url: string;
  /** req.headers */
  headers: IncomingHttpHeaders;
  /** req.headers.cookie 格式化为的对象格式 */
  cookieObj: Record<string, string>;
  /** 当设置了 getCacheUid 时，返回同一规则缓存的所有数据(包含由 getCacheUid 格式化返回的 data 数据) */
  cacheData: CacheData[];
  /**
   * 同 cacheData
   * @deprecated 将在后续版本废除，请使用 cacheData
   */
  allCacheData?: CacheData[];
  /** [on=req-body, res-body] 请求参数 body */
  reqBody?: Record<string, any> | Buffer;
  /** [on=res-body] 远程接口返回的 body */
  resBody?: string | Record<string, any> | Buffer;
  /** [on=res-body] 远程接口返回的 headers */
  resHeaders?: IncomingHttpHeaders;
};

export type RuleHandlerResult<T = any> = {
  errmsg?: string;
  /** 返回环境变量的置。返回空则忽略，否则会根据 toQL 和 toEnvFile 更新环境变量 */
  envConfig?: EnvConfig[] | EnvConfig | undefined;
  /** 返回值。若返回为空表示忽略，否则则以该值返回给接口调用 */
  body?: T;
  /** [req-body] 请求参数消息体。若存在则以该值替换原请求参数 */
  reqBody?: string | Buffer | Record<stirng, any>;
};

export interface EnvConfig {
  /** 环境变量名称。默认取值 ruleId 参数 */
  name?: string;
  /** 环境变量值 */
  value: string;
  /** 描述信息 */
  desc?: string;
  /** 多账号分隔符 */
  sep?: string;
}

interface CacheData<T = any> {
  /** 数据唯一标记，尽量以用户ID等可识别唯一性的参数值。getCacheUid 方法返回 */
  uid: string;
  /** getCacheUid 方法返回，并保存至缓存中的自定义数据。是可选的，主要用于需组合多个请求数据的复杂场景 */
  data: T;
  headers: IncomingHttpHeaders;
}
