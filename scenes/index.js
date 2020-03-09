const Stage = require('telegraf/stage')
const channelsScene = require('telegraf/stage')
const mainMenu = require('./mainMenu')
const groupsMenu = require('./groupsMenu')
const twitterMenu = require('./twitterMenu')

const stage = new Stage([mainMenu, groupsMenu, twitterMenu])

// stage.command('start', (ctx) => ctx.scene.enter('mainMenu'))
stage.middleware()

module.exports = stage
