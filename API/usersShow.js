const got = require('got')
const auth = require('../OAuth')

/**
 * Returns a variety of information about the user
 * specified by the required user_id or screen_name parameter.
 *
 * The author's most recent Tweet will be returned inline when possible.
 */

module.exports = usersShow = (screen_name) => {
    let url = `https://api.twitter.com/1.1/users/show.json?screen_name=${screen_name}`
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
