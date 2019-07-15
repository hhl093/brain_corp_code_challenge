var express = require('express')
var router = express.Router()
const pgClient = require('../datasources/database')

router.get('/', pgClient.allGroups)
router.get('/query?*', pgClient.groupsLookUp)
router.get('/:gid', pgClient.gidLookUp)

module.exports = router
