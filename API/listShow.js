const got = require('got')
const auth = require('../OAuth')

/**
 *  Returns a collection of the most recent Tweets posted by
 *  the user indicated by the screen_name or user_id parameters.
 *
 *  limit: 100,000 requests per day to the /statuses/user_timeline endpoint
*/

module.exports = (list_id) => {
    let url = `https://api.twitter.com/1.1/lists/show.json?list_id=${list_id}&tweet_mode=extended`
    try {
        return got(url, {
            headers: auth(url),
            responseType: 'json',
            resolveBodyOnly: true
        })
    } catch (error) {
        console.log(error);
    }
}
