/*
 * @Author: renxia
 * @Date: 2024-01-16 09:30:50
 * @LastEditors: renxia
 * @LastEditTime: 2024-02-28 13:59:37
 * @Description: 用于导出给 ruleHandler 使用的工具变量
 */
import * as FeUtils from '@lzwme/fe-utils';
import * as util from '../util/util';
import { logger } from './helper';

export const X = {
  FeUtils,
  logger,
  cookieParse: FeUtils.cookieParse,
  cookieStringfiy: FeUtils.cookieStringfiy,
  objectFilterByKeys: FeUtils.objectFilterByKeys,
  ...util,
};
