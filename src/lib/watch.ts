/*
 * @Author: renxia
 * @Date: 2024-02-07 13:38:29
 * @LastEditors: renxia
 * @LastEditTime: 2024-02-29 22:03:13
 * @Description:
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { logger } from './helper';
import { extname, resolve } from 'node:path';

export type WatcherOnChange = (type: 'update' | 'del' | 'add', filepath: string) => void;

const watcherCache = new Map<string, { mtime: number; onchange: WatcherOnChange; ext?: string[] }>();
let timer: NodeJS.Timeout;

function checkFile(filepath: string, config = watcherCache.get(filepath)) {
  if (existsSync(filepath)) {
    const stat = statSync(filepath);

    if (!config.ext) config.ext = ['js', 'cjs'];

    if (stat.isFile()) {
      if (config.mtime !== stat.mtimeMs) {
        config.onchange(config.mtime ? 'update' : 'add', filepath);
        config.mtime = stat.mtimeMs;
      }
    } else if (stat.isDirectory()) {
      readdirSync(filepath).forEach(filename => {
        const fpath = resolve(filepath, filename);

        if (!watcherCache.has(fpath)) {
          const ext = extname(filename).slice(1);

          if (config.ext.includes(ext)) {
            Watcher.add(fpath, config.onchange, true);
          } else if (statSync(fpath).isDirectory() && /rules|src|vip/.test(filename)) {
            checkFile(fpath, config);
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
  add(filepath: string, onchange: WatcherOnChange, initRun = false, ext?: string[]) {
    if (existsSync(filepath) && !watcherCache.has(filepath)) {
      watcherCache.set(filepath, { mtime: initRun ? 0 : statSync(filepath).mtimeMs, onchange, ext });
      if (initRun) checkFile(filepath, watcherCache.get(filepath));
      logger.debug(`Watcher file added: [${filepath}]. cache size:`, watcherCache.size);
    }
  },
  remove(filepath: string) {
    if (watcherCache.has(filepath)) {
      watcherCache.delete(filepath);
      logger.info(`Watcher file removed: [${filepath}]. cache size:`, watcherCache.size);
    }
  },
  clear() {
    logger.info('Watcher cleared. cache size:', watcherCache.size);
    watcherCache.clear();
  },
  start: (interval: number | boolean = 3000) => {
    checkWatch(Math.max(1000, +interval || 0));
    logger.info('Watcher started. cache size:', watcherCache.size);
  },
  stop: () => {
    if (timer) {
      clearTimeout(timer);
      logger.info('Watcher stoped. cache size:', watcherCache.size);
      timer = null;
    }
  },
};
