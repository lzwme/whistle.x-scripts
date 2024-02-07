/*
 * @Author: renxia
 * @Date: 2024-02-07 13:38:29
 * @LastEditors: renxia
 * @LastEditTime: 2024-02-07 15:37:40
 * @Description:
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { logger } from './helper';
import { resolve } from 'node:path';

export type WatcherOnChange = (type: 'update' | 'del' | 'add', filepath: string) => void;

const watcherCache = new Map<string, { mtime: number; onchange: WatcherOnChange }>();
let timer: NodeJS.Timeout;

function checkFile(filepath: string, config = watcherCache.get(filepath)) {
  if (existsSync(filepath)) {
    const stat = statSync(filepath);

    if (stat.isFile()) {
      if (config.mtime !== stat.mtimeMs) {
        config.mtime = stat.mtimeMs;
        config.onchange('update', filepath);
      }
    } else if (stat.isDirectory()) {
      readdirSync(filepath).forEach(filename => {
        const isJsFile = filename.endsWith('.cjs') || filename.endsWith('.js');
        if (isJsFile || /rules|src/.test(filename)) {
          const fpath = resolve(filepath, filename);

          if (!watcherCache.has(fpath)) {
            if (isJsFile) {
              Watcher.add(fpath, config.onchange);
              config.onchange('add', fpath);
            } else {
              checkFile(fpath, config);
            }
          }
        }
      });
    }
  } else {
    config.onchange('del', filepath);
    watcherCache.delete(filepath);
  }
}

function checkWatch(interval: number) {
  watcherCache.forEach((config, filepath) => checkFile(filepath, config));
  clearTimeout(timer);
  timer = setTimeout(() => checkWatch(interval), interval);
}

export const Watcher = {
  add(filepath: string, onchange: WatcherOnChange) {
    if (existsSync(filepath) && !watcherCache.has(filepath)) watcherCache.set(filepath, { mtime: statSync(filepath).mtimeMs, onchange });
  },
  start: (interval: number | boolean = 3000) => {
    checkWatch(Math.max(1000, +interval || 0));
    logger.info('Watcher started. cache size:', watcherCache.size);
  },
  stop: () => {
    if (timer) {
      clearTimeout(timer);
      logger.info('Watcher stoped');
      timer = null;
    }
  },
};
