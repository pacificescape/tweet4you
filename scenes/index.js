const Stage = require('telegraf/stage')
const channelsScene = require('telegraf/stage')
const mainMenu = require('./mainMenu')
const groupsMenu = require('./groupsMenu')

const stage = new Stage([mainMenu, groupsMenu])

// stage.command('start', (ctx) => ctx.scene.enter('mainMenu'))
stage.middleware()

module.exports = stage
