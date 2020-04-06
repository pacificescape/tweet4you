const got = require('got')
const auth = require('../OAuth')

/**
 * Returns a timeline of tweets authored by members of the specified list.
 * Retweets are шncluded by default.
 * Use the include_rts=false parameter to omit retweets.
 *
 * Requests / 15-min window (user auth): 900
 */

module.exports = (messageId) => {
  const url = `https://api.twitter.com/1.1/statuses/show.json?id=${messageId}&tweet_mode=extended`
  try {
    return got(url, {
      headers: auth(url),
      responseType: 'json',
      resolveBodyOnly: true
    })
  } catch (error) {
    console.log(error)
  }
}

// got.extend() ???
