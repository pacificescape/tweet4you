const user_timeline = require('../API/user_timeline')

module.exports = () => {
    return user_timeline(2971813024, 10)
}
