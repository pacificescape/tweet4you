const crypto = require('crypto')
const OAuth = require('oauth-1.0a')


module.exports = function auth(url, method) {
    const request_data = {
        url: url,
        method: method ? method : 'GET',
    }

    const token = {
        key: process.env.TWITTER_TOKEN,
        secret: process.env.TWITTER_TOKEN_SECRET
    }

    function hash_function_sha1(base_string, key) {
        return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64')
    }

    const oauth = OAuth({
        consumer: { key: process.env.API_KEY, secret: process.env.API_SECRET_KEY },
        signature_method: 'HMAC-SHA1',
        hash_function: hash_function_sha1,
    })

    return oauth.toHeader(oauth.authorize(request_data, token))
}
