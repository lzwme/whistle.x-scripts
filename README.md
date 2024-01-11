[![@lzwme/whistle.scte](https://nodei.co/npm/@lzwme/whistle.scte.png)][download-url]

@lzwme/whistle.scte
========

[![NPM version][npm-badge]][npm-url]
[![node version][node-badge]][node-url]
[![npm download][download-badge]][download-url]
[![GitHub issues][issues-badge]][issues-url]
[![GitHub forks][forks-badge]][forks-url]
[![GitHub stars][stars-badge]][stars-url]
![license MIT](https://img.shields.io/github/license/lzwme/whistle.save-cookies-to-env)
<!-- [![minzipped size][bundlephobia-badge]][bundlephobia-url] -->

一个 [whistle](https://wproxy.org) 插件，可以基于配置规则提取 cookie 并保存至环境变量配置文件。也支持更新至青龙脚本的环境变量配置中。

## 安装或更新

```bash
npm i -g @lzwme/whistle.scte
```

## 使用

在当前目录下，新建配置文件 `.w2.scte.config.js`。内容参考：[.w2.scte.config.sample.js](./.w2.scte.config.sample.js)

启动 `whistle`：

```bash
# 调试方式，可以从控制台看到日志
whistle run

# 以守护进程方式正常启动
whistle start
```

**提示：**

若希望可以在任意位置启动并加载配置文件，可将配置文件放置在 `Home` 目录下，即： `~/.w2.scte.config.js`。

## 规则编写

请参考配置示例和类型定义文件：

- [.w2.scte.config.sample.js](./.w2.scte.config.sample.js)
- [index.d.ts](./index.d.ts)

**提示：**

您可以设置环境变量 `DEBUG=1` 以开启调试模式。

## License

`@lzwme/whistle.scte` is released under the MIT license.

该插件由[志文工作室](https://lzw.me)开发和维护。


[stars-badge]: https://img.shields.io/github/stars/lzwme/whistle.save-cookies-to-env.svg
[stars-url]: https://github.com/lzwme/whistle.save-cookies-to-env/stargazers
[forks-badge]: https://img.shields.io/github/forks/lzwme/whistle.save-cookies-to-env.svg
[forks-url]: https://github.com/lzwme/whistle.save-cookies-to-env/network
[issues-badge]: https://img.shields.io/github/issues/lzwme/whistle.save-cookies-to-env.svg
[issues-url]: https://github.com/lzwme/whistle.save-cookies-to-env/issues
[npm-badge]: https://img.shields.io/npm/v/@lzwme/whistle.scte.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@lzwme/whistle.scte
[node-badge]: https://img.shields.io/badge/node.js-%3E=_16.15.0-green.svg?style=flat-square
[node-url]: https://nodejs.org/download/
[download-badge]: https://img.shields.io/npm/dm/@lzwme/whistle.scte.svg?style=flat-square
[download-url]: https://npmjs.org/package/@lzwme/whistle.scte
[bundlephobia-url]: https://bundlephobia.com/result?p=@lzwme/whistle.scte@latest
[bundlephobia-badge]: https://badgen.net/bundlephobia/minzip/@lzwme/whistle.scte@latest
