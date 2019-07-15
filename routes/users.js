var express = require('express')
var router = express.Router()
const pgClient = require('../datasources/database')

/* GET users listing. */
router.get('/', pgClient.getUsers)
router.get('/query?*', pgClient.lookup)
router.get('/:uid', pgClient.uidLookUp)
router.get('/:uid/groups', pgClient.getGroupsUsers)

module.exports = router
