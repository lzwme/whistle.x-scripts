/*
 * @Author: renxia
 * @Date: 2024-01-15 08:51:18
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-16 09:27:30
 * @Description:
 */
import { color } from '@lzwme/fe-utils';
import { getConfig } from './lib/getConfig';
import { getCacheStorage, logger } from './lib/helper';

export async function init() {
  const config = getConfig();
  const storage = getCacheStorage(config.cacheFile);
  logger.log('Cache File:', color.cyan(storage.config.filepath));
  logger.debug('config:', config);
}
