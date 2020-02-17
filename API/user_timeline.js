const got = require('got')
const auth = require('../OAuth')

module.exports = user_timeline = async (id, count) => {
    let url = `https://api.twitter.com/1.1/statuses/user_timeline.json?user_id=${id}&count=${count}`
    try {
        const response = await got(url, {
            headers: auth(url),
            responseType: 'json',
            resolveBodyOnly: true
        });
        return response;
    } catch (error) {
        console.log(error.response.body);
    }
}
