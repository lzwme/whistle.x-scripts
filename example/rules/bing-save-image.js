const fs = require('node:fs');

/** @type {import('@lzwme/whistle.x-scripts').RuleItem} */
module.exports = {
  on: 'res-body',
  ruleId: 'bing-save-image',
  desc: '保存 bing 大图',
  url: 'https://s.cn.bing.net/th?id=*.jpg&w=3840&h=2160*',
  handler({ url, resBody, X }) {
    const filename = /id=(.*\.jpg)/.exec(url)?.[1];

    if (filename && Buffer.isBuffer(resBody)) {
      const filepath = `cache/bing-images/${filename}`;
      const { mkdirp, color, formatByteSize } = X.FeUtils;

      if (!fs.existsSync(filepath)) {
        mkdirp('cache/bing-images');
        fs.promises.writeFile(filepath, resBody);
        X.logger.info(`图片已保存：[${color.green(formatByteSize(resBody.byteLength))}]`, color.cyan(filepath));
      }
    }
  },
};

// const micromatch = require('micromatch');
// let url = 'https://s.cn.bing.net/th?id=OHR.SquirrelNetherlands_ZH-CN0757138587_UHD.jpg&w=3840&h=2160&c=8&rs=1&o=3&r=0'
// let p = 'https://s.cn.bing.net/th?id=*.jpg&w=3840&h=2160*';
// console.log(micromatch.isMatch(url, p));
