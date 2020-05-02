const got = require('got')
const auth = require('../OAuth')

/**
 * Returns a timeline of tweets authored by members of the specified list.
 * Retweets are шncluded by default.
 * Use the include_rts=false parameter to omit retweets.
 *
 * Requests / 15-min window (user auth): 900
 */

module.exports = (listId, sinceId) => {
  const url = `https://api.twitter.com/1.1/lists/statuses.json?list_id=${listId}&tweet_mode=extended&count=100&since_id=${sinceId}`
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
