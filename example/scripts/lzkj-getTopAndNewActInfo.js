/*
 * @Author: renxia
 * @Date: 2024-01-17 11:10:55
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-17 12:10:19
 * @Description:
 */

async function getTopAndNewActInfo(cookie = process.env.LZKJ_COOKIE) {
  const url = 'https://lzkj-isv.isvjd.com/wxAssemblePage/getTopAndNewActInfo';
  const r = await fetch(url, {
    method: 'post',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie,
    },
    body: `pin=a%2BuYEDziWNPOwbIg6yOnhlw0qxi8AhQQPw1iwI2bhThO0zLXWT5XGufTchohGid1&aggrateActType=5&topNewType=1&pageNo=1&pageSize=200`,
  }).then(d => d.json());
  console.log(r, '\n Total:', r.data?.homeInfoResultVOList?.length);

  const ids = {};
  r.data?.homeInfoResultVOList?.forEach(d => {
    const key = /:\/\/(\w+)-isv/.exec(d.activityUrl)?.[1];
    if (key) {
      if (!ids[key]) ids[key] = [];
      ids[key].push(d.activityId);
    }
  });

  Object.entries(ids).forEach(([k, v]) => console.log(`[${k}][count: ${v.length}]`, v.join(',')));
  return ids;
}

const cookie = process.env.LZKJ_COOKIE || '';
getTopAndNewActInfo(cookie);
