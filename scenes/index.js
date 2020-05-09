const Stage = require('telegraf/stage')
const mainMenu = require('./mainMenu')
const groupsMenu = require('./groupsMenu')
const twitterMenu = require('./twitterMenu')
const choseTwitter = require('./choseTwitter')
const manageTwitter = require('./manageTwitter')

const stage = new Stage([mainMenu, groupsMenu, twitterMenu, choseTwitter, manageTwitter])

// stage.command('start', (ctx) => ctx.scene.enter('mainMenu'))
stage.middleware()

module.exports = stage
