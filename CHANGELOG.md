# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.5](https://github.com/lzwme/whistle.x-scripts/compare/v0.0.4...v0.0.5) (2024-06-10)


### Bug Fixes

* **update:** 修复 update 本地 envConfig 文件时多行匹配处理错误的问题 ([379d938](https://github.com/lzwme/whistle.x-scripts/commit/379d9385018940901aefd6d8108e8a128876632f))

### [0.0.4](https://github.com/lzwme/whistle.x-scripts/compare/v0.0.3...v0.0.4) (2024-05-05)


### Features

* 新增 rulesServer，支持配置自定义的 whistle 原生支持规则，支持从远程加载 ([1305910](https://github.com/lzwme/whistle.x-scripts/commit/130591067738f67b19a280fee305fa0877dca8a6))
* 新增支持 MITM 配置，支持部分的启用 https 拦截以改善 w2 代理性能 ([a2d3e56](https://github.com/lzwme/whistle.x-scripts/commit/a2d3e56f2b9bfed0a2548515f776b85bdd44159c))


### Bug Fixes

* 修复 updateToQL 多账号会丢失旧数据的问题 ([0db59c1](https://github.com/lzwme/whistle.x-scripts/commit/0db59c191f89bb6443db2d168dba3a785e8e96a1))

### [0.0.3](https://github.com/lzwme/whistle.x-scripts/compare/v0.0.2...v0.0.3) (2024-02-29)


### Bug Fixes

* 修复规则热更新不生效的问题 ([93ca442](https://github.com/lzwme/whistle.x-scripts/commit/93ca44242723741fe949fb9c8093567afb7b6734))

### [0.0.2](https://github.com/lzwme/whistle.x-scripts/compare/v0.0.1...v0.0.2) (2024-02-18)


### Features

* 新增配置项 ruleInclude 和 ruleExclude，支持仅开启或禁用部分规则 ([9947663](https://github.com/lzwme/whistle.x-scripts/commit/994766379363f1b24e6329a83485ccfdbb478baf))
* 支持热更新。新增 watch 参数，支持配置文件与规则文件的监听模式 ([5458476](https://github.com/lzwme/whistle.x-scripts/commit/54584761a0d929fce0d9746791bb6481873f4ae0))

### 0.0.1 (2024-01-23)
