const got = require('got')
const auth = require('../OAuth')

module.exports = listMembersCreate = (list_id, user_id) => {
    let url = `https://api.twitter.com/1.1/lists/members/create.json?user_id=${user_id}&list_id=${list_id}`

    try {
        return got.post(url, {
            headers: auth(url, 'POST'),
            responseType: 'json',
            resolveBodyOnly: true
        })
    } catch (error) {
        console.log(error);
    }
}
