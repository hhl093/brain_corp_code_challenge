var express = require('express')
var router = express.Router()
const pgClient = require('../datasources/database')

/* GET users listing. */
router.get('/', pgClient.getUsers)
router.get('/query?*', pgClient.getUserQuery)
router.get('/:uid', pgClient.getUserUid)
router.get('/:uid/groups', pgClient.getGroupsUsers)

module.exports = router
