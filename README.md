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

常见的流行代理工具软件如 WireShark、fiddler、charles、whistle、burpsuite、mitmproxy 等本身自带的能力已相当强大，但是在实现较为复杂的自定义逻辑目的时，要么配置规则相当复杂，拥有较高的规则编写学习成本，要么需要开发对应的插件实现。

本插件基于代理工具 `whistle` 的插件开发能力，提供了一套简易的脚本编写规范。基于该规范，对于拥有简单的 JavaScript 开发能力的同学来说，只需针对常用网站或软件以自由编码的形式编写少量的代码规则，即可实现绝大多数场景需求。如实现自动保存登录认证 cookie、拦截、模拟、修改、和保存接口数据等功能，从而可以以较低的成本实现：认证信息同步、广告过滤、数据修改、数据缓存、文件替换调试等目的。

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

### 快速开始

首先，在当前工作目录下新建配置文件 `w2.x-scripts.config.js`。内容参考：[w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js)

然后在配置文件中的 `rules` 或 `ruleDirs` 配置项中，添加配置自定义的规则。

最后启动 `whistle`：

```bash
# 调试方式启动：可以从控制台看到日志，适用于自编写调试规则时
w2 run

# 守护进程方式启动：适用于服务器运行时
w2 start
```

可以从控制台日志看到具体启动的代理地址。应当为：`http://[本机IP]:8899`

**提示：**

若希望可以在任意位置启动并加载配置文件，可将配置文件放置在 `Home` 目录下，即： `~/w2.x-scripts.config.js`。

### 设备设置代理

- 当前运行 `whistle` 的设备设置代理

```bash
# 安装 根证书
w2 ca

# 设置代理
w2 proxy

# 取消代理
w2 proxy off
```

详情可参考 `whistle` 文档：[代理与证书](https://wproxy.org/whistle/proxy.html)

- 移动设备设置代理

移动设备设置代理，需先在 `whistle` 运行时安装 `whistle` 根证书。具体配置方法不同的设备稍有差异，具体可根据你的设备搜索查找其对应详细的代理设置方法。`whistle` 文档相关参考：[安装启动](https://wproxy.org/whistle/install.html)

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

## 脚本规则的编写

你可以在配置文件 `w2.x-scripts.config.js` 中的 `rules` 字段中直接编写规则，也可以在其他目录下新建 `.js` 文件并编写具体的脚本规则，然后在 `ruleDirs` 字段中引入。

一个极其简单的脚本规则示例：

```js
/** @type {import('@lzwme/whistle.x-scripts').RuleItem} */
const rule = {
  disabled: false, // 是否禁用该规则
  on: 'res-body', // 规则执行的时机，res-body 表示在收到响应体后触发
  ruleId: 'print-response-body', // 规则唯一标记，必须设置且唯一
  desc: '打印接口返回内容', // 规则描述
  url: '**', // ** 表示匹配所有 url 地址
  handler({ url, req, reqBody, resHeaders, resBody, X }) {
    // 只处理文本类型的请求
    if (X.isText(req.headers) && !/\.(js|css)/.test(url)) {
      // X 是提供的工具类对象，方便简化脚本编写逻辑调用
      const { magenta, gray, cyan } = X.FeUtils.color;

      console.log(`\n\n[${magenta('handler')}][${cyan(req.method)}] -`, gray(url));
      console.log(cyan('\req headers:'), req.headers);
      console.log(cyan('\res headers:'), resHeaders);
      if (reqBody) console.log(cyan('请求参数：'), reqBody.toString());
      if (resBody) console.log(cyan('返回内容：'), resBody);
    }

    // body: 若返回 body 字段，则会以该内容返回；
    // envConfig: 若返回 envConfig 字段，则会根据其内容及配置写入本地环境变量文件、上传至青龙面板等
    // return { body: modifyedResBody, envConfig };
  },
};
module.exports = rule;
```

具体编写方法请参考配置示例和类型定义文件：

- [x-scripts-rules](https://github.com/lzwme/x-scripts-rules) 提供了一些示例脚本，可作为脚本规则的编写参考示例。
- [w2.x-scripts.config.sample.js](./w2.x-scripts.config.sample.js)
- [index.d.ts](./index.d.ts)

**提示：**

- 您可以设置环境变量 `DEBUG=1` 以开启调试模式。
- 当前工作路径下所有名称包含 `x-scripts-rules` 的目录下的 `.js` 文件都会被自动加载。
- **⚠️警告：自定义脚本会真实的在服务器上执行，且拥有较高的安全风险，请不要在工作用机上部署。建议基于 docker 等虚拟化技术使用。**

### 脚本规则示例

可直接下载使用的脚本规则：

- [https://github.com/lzwme/x-scripts-rules](https://github.com/lzwme/x-scripts-rules)
  - [jd.js](https://github.com/lzwme/x-scripts-rules/blob/main/src/jd.js) **自动保存某东 cookie** 至本地环境变量文件，并上传至青龙面板
  - [imaotai.js](https://github.com/lzwme/x-scripts-rules/blob/main/src/imaotai.js) **自动保存i茅台 token** 并上传至青龙面板
  - 更多实用示例脚本持续添加中...

模板示例脚本规则：

- [example/rules](./example/rules/) 目录下包含了常用场景及示例脚本，可作为模板示例参考使用。
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

- [whistle 插件开发](https://wproxy.org/whistle/plugins.html)
- [Custom extension script for whistle](https://github.com/whistle-plugins/whistle.script)

## 免责说明

- 本插件项目仅用于个人对 web 程序逆向的兴趣研究学习，请勿用于商业用途、任何恶意目的，否则后果自负。
- 由于插件引入自定义脚本会真实的在服务器上执行，使用第三方编写的脚本时请谨慎甄别安全风险，请尽可能的在虚拟化容器内使用。
- 请自行评估使用本插件及基于本插件规范开发的第三方脚本的安全风险。本人对使用本插件或插件涉及的任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失或损害。

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
