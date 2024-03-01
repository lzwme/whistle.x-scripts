/*
 * @Author: renxia
 * @Date: 2024-02-07 13:38:29
 * @LastEditors: renxia
 * @LastEditTime: 2024-03-01 13:30:04
 * @Description:
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { color } from '@lzwme/fe-utils';
import { logger } from './helper';

export type WatcherOnChange = (type: 'update' | 'del' | 'add', filepath: string) => void;

const watcherCache = new Map<string, { mtime: number; onchange: WatcherOnChange; ext?: string[] }>();
let timer: NodeJS.Timeout;

function checkFile(filepath: string, config = watcherCache.get(filepath)) {
  if (existsSync(filepath)) {
    const stat = statSync(filepath);

    if (!config.ext) config.ext = ['js', 'cjs'];

    if (stat.isFile()) {
      if (config.mtime !== stat.mtimeMs) {
        const type = config.mtime ? 'update' : 'add';
        logger.log(`[Watcher]${type}:`, color.cyan(filepath));
        config.onchange(type, filepath);
        watcherCache.set(filepath, { ...config, mtime: stat.mtimeMs });
      }
    } else if (stat.isDirectory()) {
      readdirSync(filepath).forEach(filename => {
        const fpath = resolve(filepath, filename);

        if (!watcherCache.has(fpath)) {
          const ext = extname(filename).slice(1);

          if (config.ext.includes(ext)) {
            Watcher.add(fpath, config.onchange, true);
          } else if (statSync(fpath).isDirectory() && /rules|src|vip/.test(filename)) {
            checkFile(fpath, { ...config, mtime: 0 });
          }
        }
      });
    }
  } else {
    Watcher.remove(filepath);
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
  remove(filepath: string, emitEvent = true) {
    if (watcherCache.has(filepath)) {
      if (emitEvent) {
        const config = watcherCache.get(filepath);
        config.onchange('del', filepath);
      }

      watcherCache.delete(filepath);
      if (statSync(filepath).isDirectory()) {
        watcherCache.forEach((_config, key) => {
          if (key.startsWith(filepath)) Watcher.remove(key, emitEvent);
        });
      }

      logger.log('[Watcher]removed:', color.yellow(filepath), `. cache size:`, watcherCache.size);
    }
  },
  clear(emitEvent = true) {
    logger.info('Watcher cleaning. cache size:', watcherCache.size);
    if (emitEvent) watcherCache.forEach((config, key) => config.onchange('del', key));
    watcherCache.clear();
  },
  start: (interval: number | boolean = 3000) => {
    if (timer) return;
    checkWatch(Math.max(1000, +interval || 0));
    logger.info('Watcher started. cache size:', watcherCache.size);
  },
  stop: (clear = false) => {
    if (timer) {
      clearTimeout(timer);
      if (clear) Watcher.clear();
      logger.info('Watcher stoped. cache size:', watcherCache.size);
      timer = null;
    }
  },
};
