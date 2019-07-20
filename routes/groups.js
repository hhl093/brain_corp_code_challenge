var express = require('express')
var router = express.Router()
const pgClient = require('../datasources/database')

router.get('/', pgClient.getGroups)
router.get('/query?*', pgClient.getGroupQuery)
router.get('/:gid', pgClient.getGidGroup)

module.exports = router
