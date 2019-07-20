const sqlite3 = require('sqlite3').verbose()
const logger = require('../logger')

let db = new sqlite3.Database('password.db', err => {
  if (err) {
    console.error(err.message)
  }
  console.log('Connected to the password database.')
})

//async set up
db.get = function(query) {
  var that = this
  return new Promise(function(resolve, reject) {
    that.all(query, [], function(err, rows) {
      if (err) reject('Read error: ' + err.message)
      else {
        resolve(rows)
      }
    })
  })
}

//helper functions to check empty object
function isEmpty(obj) {
  if (!obj) {
    return true
  } else if (obj.length == 0 || Object.keys(obj).length == 0) {
    return true
  } else {
    return false
  }
}

//helper function to always return array of one object or array
function toArray(obj) {
  if (Array.isArray(obj)) {
    return obj
  } else {
    return [obj]
  }
}

// helper to create string for querying gids from name or gid
function getSelectFieldGroupString(name, gid) {
  let first = true
  let base = `
  SELECT
    gid
  FROM
    GROUPS
  WHERE `

  if (name) {
    base += first ? `name = '${name}'` : `OR name = '${name}'`
    first = false
  }
  if (gid) {
    base += first ? `gid = '${gid}'` : `OR gid = '${gid}'`
    first = false
  }

  base += `;`

  console.log(base)

  return base
}

//get all the groups with given members
function getGidFromMembers(memList) {
  let first = true
  let base = `
  SELECT
    gid
  FROM
    MEMBERS
  WHERE `

  memList.forEach(function(name) {
    base += first ? `member = '${name}'` : `OR member = '${name}'`
    first = false
  }, this)
  base += `;`
  return base
}

//helper function to get members from a single gid
const GET_MEMBERS = gid => `SELECT member FROM MEMBERS
           WHERE gid = ${gid};`

async function getMember(gid) {
  const queryString = GET_MEMBERS(gid)
  try {
    const rows = await db.get(queryString)
    return rows
  } catch (err) {
    throw err
  }
}

const allUser = `SELECT * FROM PASSWORD
           ORDER BY uid`

const GET_UID_QUERY = uid => `SELECT * FROM PASSWORD
           WHERE uid = '${uid}'
           `
function getSelectFieldString(name, uid, gid, comment, home, shell) {
  let first = true
  let base = `
  SELECT
    *
  FROM
    PASSWORD
  WHERE `

  if (name) {
    base += first ? `name = '${name}'` : `AND name = '${name}'`
    first = false
  }
  if (uid) {
    base += first ? `uid = '${uid}'` : `AND uid = '${uid}'`
    first = false
  }
  if (gid) {
    base += first ? `gid = '${gid}'` : `AND gid = '${gid}'`
    first = false
  }
  if (comment) {
    base += first ? `comment = '${comment}'` : `AND comment = '${comment}'`
    first = false
  }
  if (home) {
    base += first ? `home = '${home}'` : `AND home = '${home}'`
    first = false
  }
  if (shell) {
    base += first ? `shell = '${shell}'` : `AND shell = '${shell}'`
    first = false
  }

  base += `;`

  return base
}

const GET_GROUP_QUERY = gid => `SELECT * FROM GROUPS
           WHERE gid = ${gid};`

const GET_ALL_GROUP = `SELECT * FROM GROUPS`

const GET_ALL_GID_FROM_NAME = name =>
  `SELECT gid, name FROM MEMBERS WHERE member = '${name}';`

const MEMBERS_FROM_GID = gid => `SELECT * FROM MEMBERS
           WHERE uid = ${gid};`

const GID_NAME_FROM_UID = uid => `SELECT  name, gid FROM PASSWORD
           WHERE uid = ${uid};`

const GET_NAME_GID = gid => `SELECT name, gid FROM GROUPS
           WHERE gid = ${gid};`

//return all users
const getUsers = async (request, response) => {
  console.log('getUsers')

  try {
    const result = await db.get(allUser)
    if (isEmpty(result)) {
      response.status(404).json('404 result not found')
    } else {
      response.status(200).json(result)
    }
  } catch (err) {
    logger.error(err)
    response.status(500).json('internal error')
  }
}

const getUserQuery = async (request, response) => {
  console.log('getUserQuery')

  if (isEmpty(request.query)) {
    return response.status(404).json('404 result not found')
  }

  const queryString = getSelectFieldString(
    request.query.name,
    request.query.uid,
    request.query.gid,
    request.query.comment,
    request.query.home,
    request.query.shell
  )
  logger.debug(queryString)

  try {
    const result = await db.get(queryString)
    if (isEmpty(result)) {
      response.status(404).json('404 result not found')
    } else {
      response.status(200).json(toArray(result))
    }
  } catch (err) {
    logger.error(err)
    response.status(500).json('internal error')
  }
}

const getUserUid = async (request, response) => {
  console.log('getUserUid')
  const queryString = GET_UID_QUERY(request.params.uid)
  logger.debug(queryString)
  try {
    const result = await db.get(queryString)
    if (isEmpty(result)) {
      response.status(404).json('404 result not found')
    } else {
      response.status(200).json(result[0])
    }
  } catch (err) {
    logger.error(err)
    response.status(500).json('internal error')
  }
}

const getGroupsUsers = async (request, response) => {
  console.log('getGroupsUsers')
  logger.debug(GID_NAME_FROM_UID(request.params.uid))

  try {
    const nameGid = await db.get(GID_NAME_FROM_UID(request.params.uid))
    const name = nameGid[0].name
    logger.debug(name, 'name from gid')
    console.log(GET_ALL_GID_FROM_NAME(name))

    const allGids = await db.get(GET_ALL_GID_FROM_NAME(name))

    logger.debug(JSON.stringify(allGids))

    const result = await Promise.all(
      allGids.map(async gidName => {
        var members = await getMember(gidName.gid)
        members = members.map(m => m.member)
        return { ...gidName, members: members }
      })
    )

    response.status(200).json(result)
  } catch (err) {
    logger.error(err)
    response.status(500).json('internal error')
  }
}

const getGroups = async (request, response) => {
  try {
    console.log('getGroups')

    var allGroups = await db.get(GET_ALL_GROUP)

    console.log(allGroups)
    const result = await Promise.all(
      allGroups.map(async IdName => {
        logger.debug(JSON.stringify(IdName))
        var members = await getMember(IdName.gid)
        members = members.map(m => m.member)
        logger.debug(members)
        logger.debug(JSON.stringify({ ...IdName, members: members }))

        return { ...IdName, members: members }
      })
    )
    response.status(200).json(result)
  } catch (err) {
    logger.error(err)
    response.status(500).json('internal error')
  }
}

const getGidGroup = async (request, response) => {
  try {
    console.log('getGidGroup')
    if (isNaN(request.params.gid))
      return response.status(404).json('404 result not found')

    const queryString = GET_GROUP_QUERY(request.params.gid)
    const memberQueryString = GET_MEMBERS(request.params.gid)

    var memberList = await getMember(request.params.gid)
    var gidAndName = await db.get(queryString)

    memberList = memberList.map(m => m.member)

    logger.debug(JSON.stringify(gidAndName))

    if (gidAndName.length === 0)
      response.status(404).json('404 result not found')

    var result
    if (memberList.length === 0) {
      result = { ...gidAndName[0] }
    } else {
      result = { ...gidAndName[0], members: memberList }
    }

    response.status(200).json(result)
  } catch (err) {
    logger.error(err)
    response.status(500).json('404 result not found')
  }
}

const getGroupQuery = async (request, response) => {
  console.log('groupsLookUp')

  try {
    var finalGids = []

    if (request.query.name || request.query.gid) {
      gidQueryString = getSelectFieldGroupString(
        request.query.name,
        request.query.gid
      )
      var gidFromName = await db.get(gidQueryString)
      logger.debug(JSON.stringify(gidFromName))
    }
    if (gidFromName) finalGids = finalGids.concat(gidFromName)

    logger.debug(JSON.stringify(finalGids))

    var memList = request.query.member

    if (memList && memList.length > 0) {
      if (typeof memList == 'string') {
        memList = [memList]
      }

      const queryString = getGidFromMembers(memList)
      var gidFromMember = await db.get(queryString)
    }

    logger.debug(JSON.stringify(gidFromMember))

    if (gidFromMember) finalGids = finalGids.concat(gidFromMember)

    finalGids = finalGids
      .map(gidObj => gidObj.gid)
      .filter((v, i, a) => a.indexOf(v) === i)

    logger.debug(JSON.stringify(finalGids))

    if (finalGids.length > 0) {
      const gidMembers = await Promise.all(
        finalGids.map(async gid => {
          var members = await getMember(gid)
          logger.debug(JSON.stringify(members))

          var nameGids = await db.get(GET_NAME_GID(gid))
          logger.debug(JSON.stringify(nameGids))

          members = members.map(m => m.member)

          return { ...nameGids[0], members: members }
        })
      )

      response.status(200).json(gidMembers)
    } else {
      response.status(404).json('404 result not found')
    }
  } catch (err) {
    logger.error(err)
    response.status(500).json('internal error')
  }
}

module.exports = {
  getUsers,
  getUserQuery,
  getUserUid,
  getGidGroup,
  getGroups,
  getGroupsUsers,
  getGroupQuery
}
