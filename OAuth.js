const crypto = require('crypto')
const OAuth = require('oauth-1.0a')

module.exports = function auth (url, method) {
  const requestData = {
    url: url,
    method: method || 'GET'
  }

  const token = {
    key: process.env.TWITTER_TOKEN,
    secret: process.env.TWITTER_TOKEN_SECRET
  }

  function hashFunctionSha1 (baseString, key) {
    return crypto
      .createHmac('sha1', key)
      .update(baseString)
      .digest('base64')
  }

  const oauth = OAuth({
    consumer: { key: process.env.API_KEY, secret: process.env.API_SECRET_KEY },
    signature_method: 'HMAC-SHA1',
    hash_function: hashFunctionSha1
  })

  return oauth.toHeader(oauth.authorize(requestData, token))
}
