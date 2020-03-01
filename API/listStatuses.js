const got = require('got')
const auth = require('../OAuth')
const list_id = process.env.LIST_ID

/**
 * Returns a timeline of tweets authored by members of the specified list.
 * Retweets are шncluded by default.
 * Use the include_rts=false parameter to omit retweets.
 *
 * Requests / 15-min window (user auth): 900
 */

 module.exports = listStatuses = (list_id) => {
    let url = `https://api.twitter.com/1.1/lists/statuses.json?list_id=${list_id}`
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
