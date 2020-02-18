const got = require('got')
const auth = require('../OAuth')

module.exports = userShow = (screen_name) => {
    let url = `https://api.twitter.com/1.1/users/show.json?screen_name=${screen_name}`
}
