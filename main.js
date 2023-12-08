const Koa = require('koa');
const Router = require('@koa/router');
const s = require('koa-static');
const request = require('koa2-request');
const cache = require('memory-cache');
const sha1 = require('sha1');
const appid = 'wx660b843f17b014c5';
const secret = 'cd3b0b0b0b0b0b0b0b0b0b0b0b0b0b0b';
const app = new Koa();
const router = new Router();

app.use(s(__dirname + '/web'));

router.get('/sign', async (ctx) => {
    const url = ctx.request.query.url;
    console.log(url)
    let noncestr = "123456",
        timestamp = Math.floor(Date.now() / 1000), // 精确到秒
        jsapi_ticket;

    if (cache.get('ticket')) {
        jsapi_ticket = cache.get('ticket');
        ctx.body = {
            noncestr: noncestr,
            timestamp: timestamp,
            url: url,
            jsapi_ticket: jsapi_ticket,
            signature: sha1(`jsapi_ticket=${jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`)
        };
    } else {
        let response = await request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}$&secret=${secret}`);
        if (response.statusCode === 200) {
            const tokenMap = JSON.parse(response.body);
            console.log("tokenMap 1:", tokenMap);
            response = await request(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${tokenMap.access_token}&type=jsapi`);
            if (response.statusCode === 200) {
                ticketMap = JSON.parse(response.body);
                console.log("ticketMap 2:", ticketMap);
                cache.put('ticket', ticketMap.ticket, (1000 * 60 * 60 * 24)); // 加入缓存
                ctx.body = {
                    noncestr: noncestr,
                    timestamp: timestamp,
                    url: url,
                    jsapi_ticket: ticketMap.ticket,
                    signature: sha1(`jsapi_ticket=${ticketMap.ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`)
                };
            }
        }
    }
});

app.use(router.routes()).use(router.allowedMethods());

const server = app.listen(3000, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log(`Example app listening at http://${host}:${port}`);
});
