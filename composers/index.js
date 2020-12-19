const twitterHandler = require('./twitter')
const channelHandler = require('./channel')
const startHandler = require('./start')
const unknownHandler = require('./unknown')

// const privateHandlers = (bot) => {
//   bot.use(twitterHandler)
//   bot.use(channelHandler)
//   bot.use(startHandler)
//   bot.use(unknownHandler)
// }

module.exports = {
  twitterHandler,
  channelHandler,
  startHandler,
  unknownHandler
}
