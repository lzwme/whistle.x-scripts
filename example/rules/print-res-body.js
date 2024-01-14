/*
 * @Author: renxia
 * @Date: 2024-01-16 13:19:04
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-16 17:32:48
 * @Description: whistle.x-scripts 规则：打印接口返回结果
 */
/** @type {import('../../typings').RuleItem[]} */
module.exports = [
  {
    ruleId: 'print-response-body',
    desc: '打印接口返回内容',
    url: '**',
    modifyHandler({ X, req, headers, reqBody, resBody, url }) {
      const { magenta, gray, cyan } = X.FeUtils.color;

      if (X.isText(headers) && !/\.(js|css)/.test(url)) {
        console.log(`\n\n[${magenta('modifyHandler')}][${cyan(req.method)}] -`, gray(url));
        console.log(cyan('\req headers:'), req.headers);
        console.log(cyan('\res headers:'), headers);
        if (reqBody) console.log(cyan('请求参数：'), reqBody.toString());
        if (resBody) console.log(cyan('返回内容：'), resBody);
      }

      // 不返回数据表示忽略修改
      // const modifyedResBody = resBody;
      // return { body: modifyedResBody };
    },
  },
];
