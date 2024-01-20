/** @type {import('@lzwme/whistle.x-scripts').RuleItem} */
module.exports = {
  on: 'res-body',
  ruleId: 'modify-baidu-index-pan',
  desc: '修改百度首页网盘入口为自定义的链接地址',
  url: 'https://www.baidu.com/',
  handler({ resHeaders, resBody }) {
    if (!String(resHeaders['content-type']).includes('text/html')) return;

    const body = resBody.toString()
        .replace(/https:\/\/pan.baidu.com?\w+/, 'https://lzw.me?from=baiduindex')
        .replace('>网盘</a>', '>志文工作室</a>');
    return { body };
  },
};
