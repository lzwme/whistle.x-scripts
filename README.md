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

一个基于 [whistle](https://wproxy.org) 的代理脚本插件，用于辅助 web 程序调试、逆向学习等目的。

常见的流行代理工具 WireShark、fiddler、charles、whistle、burpsuite、mitmproxy 等自带的能力本身已相当强大，但是在实现较为复杂的自定义逻辑目的时，要么无法实现，要么配置规则相当复杂。需要以一定的编码开发方式才可实现。

基于 whistle 和 `@lzwme/whistle.x-scripts` 插件提供的能力，用户只需针对常用网站或软件编写简单的规则脚本，即可以自由编码等方式实现自动保存登录认证 cookie、拦截、模拟、修改、和保存接口数据等功能。基于该能力，你可以以较低的成本实现：认证信息同步、广告过滤、数据修改、数据缓存、文件替换调试等目的。

**功能特性：**

- `自定义脚本` 设计了一套简易的脚本编写规范，基于该规范只需编写少量的脚本代码规则，即可实现绝大多数场景需求。
- `保存 cookie` 可以基于配置规则提取 cookie 并保存至环境变量配置文件。也支持更新至青龙脚本的环境变量配置中。
- `接口数据模拟 mock` 匹配某些接口并 `mock` 它，返回构造模拟的结果。
- `接口数据修改 modify` 根据匹配规则修改请求返回的数据体。
- more...

## 安装与更新

首先需全局安装 `whistle`：

```bash
npm i -g whistle
```

然后使用 npm 全局安装，即可被 whistle 自动识别和加载：

```bash
# 使用 npm
npm i -g @lzwme/whistle.x-scripts
# 也可以使用 whistle 命令
w2 install @lzwme/whistle.x-scripts
```

## 使用

在当前目录下，新建配置文件 `w2.x-scripts.config.js`。内容参考：[w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js)

启动 `whistle`：

```bash
# 调试方式，可以从控制台看到日志，适用于自编写调试规则时
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

if [ ! -e w2.x-scripts.config.js ]; then
  cp /usr/local/lib/node_modules/@lzwme/whistle.x-scripts/w2.x-scripts.config.sample.js w2.x-scripts.config.js
fi

w2 start -M capture
```

2. 进入 `/ql/data/scripts/whistle` 目录（若为 docker 方式安装，则进入对应映射目录下），参考 [w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js) 新建/修改配置文件 `w2.x-scripts.config.js`。

3. 可在该目录下新建 `local-x-scripts-rules` 目录，然后将编写的规则脚本放入其中。

## 配置文件

配置文件名称为 `w2.x-scripts.config.js`，默认会在当前目录和用户 Home 目录下查找。

各配置项及详细说明请参考类型定义[W2CookiesConfig]('./index.d.ts')。

## 规则脚本的编写

1. 新建一个用于脚本规则编写的项目目录，如 `x-scripts-test`，进入它，并新建一个存放脚本的目录，如 `local-x-scripts-rules`。
1. 参考 [w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js) 新建配置文件 `w2.x-scripts.config.js`。
1. 然后即可在 `local-x-scripts-rules` 下新建 `.js` 文件并编写具体的规则脚本。

具体编写方法，请参考配置示例和类型定义文件：

- [x-scripts-rules](./x-scripts-rules) 提供了一些内置的规则脚本，可作为规则脚本的编写参考示例。
- [w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js)
- [index.d.ts](./index.d.ts)

**提示：**

- 您可以设置环境变量 `DEBUG=1` 以开启调试模式。
- 所有名称包含 `x-scripts-rules` 的目录下的脚本规则都会自动加载。
- **⚠️警告：自定义脚本会真实的在服务器上执行，且拥有较高的安全风险，请不要在工作用机上部署。建议基于 docker 等虚拟化技术使用。**

### 规则编写示例

内置脚本规则：

- [x-scripts-rules](./x-scripts-rules/) 目录下包含了内置的规则脚本可做参考。
  - [jd.js](./x-scripts-rules/jd.js) **自动保存某东 cookie** 至本地环境变量文件，并上传至青龙面板
  - [imaotai.js](./x-scripts-rules/imaotai.js) **自动保存i茅台 token** 并上传至青龙面板

模板示例脚本规则：

- [example/rules](./example/rules/) 目录下包含了常用场景及示例规则脚本，可作为模板示例参考使用。
  - [**打印**所有接口请求与返回信息](./example/rules/print-res-body.js)
  - [**保存**在访问bing首页时加载的每日背景图至本地](./example/rules/bing-save-images.js)
  - [**修改**百度首页网盘入口为自定义链接地址](./example/rules/modify-baidu-index.js)
  - more...

## 二次开发

```bash
# 全局安装 whistle
npm i -g whistle

# 拉取本插件仓库代码
git clone https://github.com/lzwme/whistle.x-scripts.git
cd whistle.x-scripts
# 安装依赖。也可以使用 npm、yarn 等包管理器
pnpm install

# 监控模式编译项目
pnpm dev
# 链接至全局，效果等同于 npm i -g @lzwme/whistle.x-scripts
npm link .

# 安装根 ca
w2 ca
# 设置本机代理
w2 proxy
# 关闭本机代理
# w2 proxy off

# 调试模式启动
w2 run
```

## 扩展参考

- 

## 免责说明

- 本插件仅用于个人对 web 程序逆向的兴趣研究学习，请勿用于商业用途、任何恶意目的，否则后果自负。
- 由于插件引入自定义脚本会真实的在服务器上执行，使用第三方编写的脚本时请谨慎甄别安全风险，请尽可能的在虚拟化容器内使用。
- 本人对使用本插件或插件涉及的任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失或损害。

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
