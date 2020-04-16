const got = require('got')
const auth = require('../OAuth')

/**
 *  Returns a collection of the most recent Tweets posted by
 *  the user indicated by the screen_name or user_id parameters.
 *
 *  limit: 15 requests in 15-min window (user auth)
*/

module.exports = (name) => {
  const url = `https://api.twitter.com/1.1/lists/create.json?name=${name}`
  try {
    return got.post(url, {
      headers: auth(url),
      responseType: 'json',
      resolveBodyOnly: true
    })
  } catch (error) {
    console.log(error)
  }
}
