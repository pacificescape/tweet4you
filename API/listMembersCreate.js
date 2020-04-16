const got = require('got')
const auth = require('../OAuth')

module.exports = (listId, userId) => {
  const url = `https://api.twitter.com/1.1/lists/members/create.json?user_id=${userId}&list_id=${listId}`

  try {
    return got.post(url, {
      headers: auth(url, 'POST'),
      responseType: 'json',
      resolveBodyOnly: true
    })
  } catch (error) {
    console.log(error)
  }
}
