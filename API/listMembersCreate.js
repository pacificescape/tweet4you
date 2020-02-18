const got = require('got')

module.exports = listMembersCreate = (list_id, user_id) => {
    let url = `https://api.twitter.com/1.1/lists/members/create.json?list_id=${list_id}&user_id=${user_id}`
    try {
        return got(url, {
            headers: auth(url),
            responseType: 'json',
            resolveBodyOnly: true
        })
    } catch (error) {
        console.log(error.response.body);
    }
}
