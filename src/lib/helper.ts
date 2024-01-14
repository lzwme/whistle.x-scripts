/*
 * @Author: renxia
 * @Date: 2024-01-11 13:15:52
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-16 09:05:19
 * @Description:
 */

import { resolve } from 'node:path';
import { LiteStorage, NLogger, color } from '@lzwme/fe-utils';
import type { IncomingHttpHeaders } from '../../typings';

export const logger = new NLogger('[X-SCRIPTS]', { logDir: './logs', color });

export type CacheStorItem = {
  [uid: string]: {
    /** 最近一次更新缓存的时间 */
    update: number;
    /** 缓存数据体 */
    data: {
      /** req headers */
      headers: IncomingHttpHeaders;
      /** 提取的数据唯一标记 ID */
      uid: string;
      /** getUserId 处理返回的用户自定义数据 */
      data: any;
    };
  };
};

let stor: LiteStorage<{ [ruleId: string]: CacheStorItem }>;
export function getCacheStorage(filepath?: string) {
  if (!stor) {
    filepath = resolve(filepath || 'w2.x-scripts.cache.json');
    stor = new LiteStorage<{ [ruleId: string]: CacheStorItem }>({ filepath, uuid: 'w2_xsctipts_cache' });
  }
  return stor;
}
