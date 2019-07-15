const {
  getUsers,
  query,
  lookup,
  uidLookUp,
  gidLookUp,
  allGroups,
  getGroupsUsers,
  groupsLookUp
} = require('../datasources/database')
var assert = require('assert')
const sqlClient = require('../datasources/database')

let chai = require('chai')
let chaiHttp = require('chai-http')
let should = chai.should()
let app = require('../app')

chai.use(chaiHttp)

describe('/GET/users', () => {
  it('it should return all the users in the system', done => {
    chai
      .request(app)
      .get('/GET/users')
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('json')
        res.body.length.should.be.eql(0)
        done()
      })
  })
})
