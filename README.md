[![@lzwme/whistle.x-scripts](https://nodei.co/npm/@lzwme/whistle.x-scripts.png)][download-url]

@lzwme/whistle.x-scripts
========

[![NPM version][npm-badge]][npm-url]
[![node version][node-badge]][node-url]
[![npm download][download-badge]][download-url]
[![GitHub issues][issues-badge]][issues-url]
[![GitHub forks][forks-badge]][forks-url]
[![GitHub stars][stars-badge]][stars-url]
![license MIT](https://img.shields.io/github/license/lzwme/whistle.x-scripts)
<!-- [![minzipped size][bundlephobia-badge]][bundlephobia-url] -->

一个基于 [whistle](https://wproxy.org) 的代理脚本插件。让用户可以针对常用网站或软件编写简单的规则脚本，即可实现自动保存登录认证 cookie、模拟接口数据、修改接口数据等功能。

**功能特性：**

- `saveCookie` 可以基于配置规则提取 cookie 并保存至环境变量配置文件。也支持更新至青龙脚本的环境变量配置中。
- `mock` 匹配某些接口并 mock 它，返回构造模拟的结果。
- `modify` 根据匹配规则修改请求返回的数据体。
- 简易支持配置化的自定义脚本规则自动加载和匹配处理。
- more...

## 安装或更新

```bash
npm i -g @lzwme/whistle.x-scripts
```

## 使用

在当前目录下，新建配置文件 `w2.x-scripts.config.js`。内容参考：[w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js)

启动 `whistle`：

```bash
# 调试方式，可以从控制台看到日志
whistle run

# 以守护进程方式正常启动
whistle start
```

**提示：**

若希望可以在任意位置启动并加载配置文件，可将配置文件放置在 `Home` 目录下，即： `~/w2.x-scripts.config.js`。

### 青龙面板中使用参考

以下以基于 `docker` 方式安装的青龙面板为例简要介绍。

1. 编辑 `配置文件 -> extra.sh`，增加如下内容：

```bash
npm i -g whistle @lzwme/whistle.x-scripts
mkdir -p /ql/data/scripts/whistle
cd /ql/data/scripts/whistle

if [ ! -e w2.scte.config.js ]; then
  cp /usr/local/lib/node_modules/@lzwme/whistle.x-scripts/w2.scte.config.sample.js w2.scte.config.js
fi

w2 start -M capture
```

2. 进入 `/ql/data/scripts/whistle` 目录（若为 docker 方式安装，则进入对应映射目录下），参考 [w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js) 新建配置文件 `w2.x-scripts.config.js`。

3. 可在该目录下新建 `x-scripts-rules` 目录，然后将编写的规则脚本放入其中，则该目录下的脚本规则会自动加载。

## 规则编写

请参考配置示例和类型定义文件：

- [w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js)
- [index.d.ts](./index.d.ts)

**提示：**

- 您可以设置环境变量 `DEBUG=1` 以开启调试模式。
- **自定义脚本会真实的在服务器上执行，且拥有较高的安全风险，请不要在工作用机上部署。建议基于 docker 等虚拟化技术使用。**

## 免责说明

- 本插件仅用于个人对 web 程序逆向的兴趣研究学习，请勿用于商业用途、任何恶意目的，否则后果自负。
- 由于插件会引入自定义脚本会真实的在服务器上执行，使用第三方编写的脚本时请谨慎甄别安全风险。
- 本人对使用本插件或涉及的任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失或损害。

## License

`@lzwme/whistle.x-scripts` is released under the MIT license.

该插件由[志文工作室](https://lzw.me)开发和维护。


[stars-badge]: https://img.shields.io/github/stars/lzwme/whistle.x-scripts.svg
[stars-url]: https://github.com/lzwme/whistle.x-scripts/stargazers
[forks-badge]: https://img.shields.io/github/forks/lzwme/whistle.x-scripts.svg
[forks-url]: https://github.com/lzwme/whistle.x-scripts/network
[issues-badge]: https://img.shields.io/github/issues/lzwme/whistle.x-scripts.svg
[issues-url]: https://github.com/lzwme/whistle.x-scripts/issues
[npm-badge]: https://img.shields.io/npm/v/@lzwme/whistle.x-scripts.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@lzwme/whistle.x-scripts
[node-badge]: https://img.shields.io/badge/node.js-%3E=_16.15.0-green.svg?style=flat-square
[node-url]: https://nodejs.org/download/
[download-badge]: https://img.shields.io/npm/dm/@lzwme/whistle.x-scripts.svg?style=flat-square
[download-url]: https://npmjs.org/package/@lzwme/whistle.x-scripts
[bundlephobia-url]: https://bundlephobia.com/result?p=@lzwme/whistle.x-scripts@latest
[bundlephobia-badge]: https://badgen.net/bundlephobia/minzip/@lzwme/whistle.x-scripts@latest
