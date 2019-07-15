const sqlite3 = require('sqlite3').verbose()

let db = new sqlite3.Database('./password.db', err => {
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

const MEMBERS_FROM_GID = gid => `SELECT * FROM MEMBERS
           WHERE uid = ${gid};`

const GID_NAME_FROM_UID = uid => `SELECT  name, gid FROM GROUPS
           WHERE uid = ${uid};`

const getUsers = (request, response) => {
  console.log('getUsers')
  db.all(allUser, [], (err, rows) => {
    if (err) {
      throw err
    }
    response.status(200).json(rows)
  })
}

const getGroupsUsers = async (request, response) => {
  console.log('gggg reflect', request.params.uid)
  console.log(GID_NAME_FROM_UID(request.params.uid))

  const gids = await db.get(GID_NAME_FROM_UID(request.params.uid))

  if (gids.length === 0) response.status(404).json('404 result not found')

  console.log(gids, 'this is gidddds')

  const result = await Promise.all(
    gids.map(async gidName => {
      var members = await getMember(gidName.gid)
      members = members.map(m => m.member)

      return { ...gidName, members: members }
    })
  )

  response.status(200).json(result)
}

const query = (request, response) => {
  console.log(request.query.id, 'this is id ddd here')
  db.all(allUser, [], (err, rows) => {
    if (err) {
      throw err
    }
    response.status(200).json(rows)
  })
}

const lookup = (request, response) => {
  const queryString = getSelectFieldString(
    request.query.name,
    request.query.uid,
    request.query.gid,
    request.query.comment,
    request.query.home,
    request.query.shell
  )
  console.log(queryString)

  db.all(queryString, [], (err, rows) => {
    if (err) {
      throw err
    }
    response.status(200).json(rows)
  })
}

const uidLookUp = (request, response) => {
  const queryString = GET_UID_QUERY(request.params.uid)
  db.all(queryString, [], (err, rows) => {
    if (err) {
      throw err
    }

    if (rows.length === 0) {
      response.status(404).json('404 result not found')
    } else {
      console.log('hreeeee')
      console.log(rows)
      response.status(200).json(rows)
    }
  })
}

const allGroups = async (request, response) => {
  var allGroups = await db.get(GET_ALL_GROUP)

  console.log(allGroups)
  const result = await Promise.all(
    allGroups.map(async IdName => {
      console.log(IdName)
      var members = await getMember(IdName.gid)
      members = members.map(m => m.member)
      console.log(members)
      console.log({ ...IdName, members: members })

      return { ...IdName, members: members }
    })
  )

  console.log(result, 'all groups')

  response.status(200).json(result)
}

const GET_MEMBERS = gid => `SELECT member FROM MEMBERS
           WHERE gid = ${gid};`

const GET_NAME_GID = gid => `SELECT name, gid FROM GROUPS
           WHERE gid = ${gid};`

async function getMember(gid) {
  const queryString = GET_MEMBERS(gid)
  const rows = await db.get(queryString)
  return rows
}

const gidLookUp = async (request, response) => {
  console.log('gidLookUp')
  const queryString = GET_GROUP_QUERY(request.params.gid)
  const memberQueryString = GET_MEMBERS(request.params.gid)

  var memberList = await getMember(request.params.gid)
  var gidAndName = await db.get(queryString)

  memberList = memberList.map(m => m.member)

  console.log(gidAndName, 'hhhhhh')

  if (gidAndName.length === 0) response.status(404).json('404 result not found')

  var result
  if (memberList.length === 0) {
    result = { ...gidAndName[0] }
  } else {
    result = { ...gidAndName[0], members: memberList }
  }

  response.status(200).json(result)
}

function getSelectFieldGroupString(name, gid) {
  let first = true
  let base = `
  SELECT
    gid
  FROM
    GROUPS
  WHERE `

  if (name) {
    base += first ? `name = '${name}'` : `AND name = '${name}'`
    first = false
  }
  if (gid) {
    base += first ? `gid = '${gid}'` : `AND gid = '${gid}'`
    first = false
  }

  base += `;`

  console.log(base)

  return base
}

function getMembersString(member) {
  let first = true
  let base = `
  SELECT
    *
  FROM
    MEMBERS
  WHERE `

  member.array.forEach(function(element) {
    console.log(element)
  }, this)
}

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

const groupsLookUp = async (request, response) => {
  console.log('groupsLookUp')

  var gidQueryString = ''

  if (request.query.name || request.query.gid) {
    gidQueryString = getSelectFieldGroupString(
      request.query.name,
      request.query.gid
    )
    var gidResult = await db.get(gidQueryString)
  }
  var memList = request.query.member

  console.log(gidResult, 'gid result')

  if (
    (!gidResult || gidResult.length === 0) &&
    (!memList || memList.length === 0)
  ) {
    response.status(404).json('404 result not found')
  }

  var finalGids = []

  var gidFromMember = []

  if (memList && memList.length > 0) {
    console.log(typeof memList, memList.length)
    if (typeof memList == 'string') {
      memList = [memList]
    }

    const queryString = getGidFromMembers(memList)
    var gidFromMember = await db.get(queryString)
  }

  console.log(gidFromMember, 'result here eee')

  if (gidResult && gidResult.length > 0) {
    gidResult.forEach(function(gidObj) {
      finalGids.push(gidObj.gid)
    }, this)
  }

  if (gidFromMember.length > 0) {
    gidFromMember.forEach(function(gidObj) {
      finalGids.push(gidObj.gid)
    }, this)
  }

  // result = result.append(gidResult)
  console.log(finalGids)

  if (finalGids.length > 0) {
    const gidMembers = await Promise.all(
      finalGids.map(async gid => {
        var members = await getMember(gid)
        var nameGids = await db.get(GET_NAME_GID(gid))
        console.log(nameGids)
        members = members.map(m => m.member)

        return { ...nameGids[0], members: members }
      })
    )

    response.status(200).json(gidMembers)
  } else {
    response.status(404).json('404 result not found')
  }

  //   var gids = await db.get(queryString)
  //   response.status(200).json([])
}

module.exports = {
  getUsers,
  query,
  lookup,
  uidLookUp,
  gidLookUp,
  allGroups,
  getGroupsUsers,
  groupsLookUp
}
