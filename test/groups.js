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
const { expect } = require('chai')

chai.use(chaiHttp)

describe('/groups', () => {
  it('it should return all the groups in the system', done => {
    chai
      .request(app)
      .get('/groups')
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('array')
        expect(res.body).to.include.deep.members([
          {
            gid: 250,
            name: '_analyticsusers',
            members: ['_analyticsd', '_networkd', '_timed']
          },
          {
            gid: 350,
            name: 'monitor',
            members: ['dwoodlins', 'system_monitor']
          },
          { gid: 1002, name: 'docker', members: ['dwoodlins'] }
        ])
        done()
      })
  })
}) // end of all groups

describe('/groups/query', () => {
  describe('empty or non-existing query should return 404', () => {
    it('empty query should return 404', done => {
      chai
        .request(app)
        .get('/groups/query?')
        .end((err, res) => {
          expect(res.status).to.eql(404)
          done()
        })
    })

    it('non-existing query should return 404', done => {
      chai
        .request(app)
        .get('/groups/query?name=iDontExist')
        .end((err, res) => {
          expect(res.status).to.eql(404)
          done()
        })
    })
  })

  describe('individual query option should work', () => {
    it('query name should return valid result', done => {
      chai
        .request(app)
        .get('/groups/query?name=docker')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body).to.include.deep.members([
            { name: 'docker', gid: 1002, members: ['dwoodlins'] }
          ])
          done()
        })
    })

    it('query gid return valid result', done => {
      chai
        .request(app)
        .get('/groups/query?gid=250')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body).to.include.deep.members([
            {
              name: '_analyticsusers',
              gid: 250,
              members: ['_analyticsd', '_networkd', '_timed']
            }
          ])

          done()
        })
    })

    it('different name and gid should return two different groups', done => {
      chai
        .request(app)
        .get('/groups/query?name=docker&gid=250')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(2)
          expect(res.body).to.include.deep.members([
            {
              name: '_analyticsusers',
              gid: 250,
              members: ['_analyticsd', '_networkd', '_timed']
            },
            { name: 'docker', gid: 1002, members: ['dwoodlins'] }
          ])

          done()
        })
    })

    it('query member return valid result', done => {
      chai
        .request(app)
        .get('/groups/query?member=_timed')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body[0].gid).to.eql(250)
          done()
        })
    })

    it('query different members(subset) should return multiple groups', done => {
      chai
        .request(app)
        .get('/groups/query?name=docker&gid=350&member=dwoodlins&member=_timed')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(3)
          expect(res.body).to.include.deep.members([
            {
              name: '_analyticsusers',
              gid: 250,
              members: ['_analyticsd', '_networkd', '_timed']
            },
            { name: 'docker', gid: 1002, members: ['dwoodlins'] },
            {
              name: 'monitor',
              gid: 350,
              members: ['dwoodlins', 'system_monitor']
            }
          ])
          done()
        })
    })

    it('query gid, name, member with all different parameters should return all possible gorups', done => {
      chai
        .request(app)
        .get('/groups/query?member=dwoodlins&member=_timed')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(3)
          expect(res.body).to.include.deep.members([
            {
              name: 'monitor',
              gid: 350,
              members: ['dwoodlins', 'system_monitor']
            },
            { name: 'docker', gid: 1002, members: ['dwoodlins'] },
            {
              name: '_analyticsusers',
              gid: 250,
              members: ['_analyticsd', '_networkd', '_timed']
            }
          ])
          done()
        })
    })
  })
}) // end of groups query

describe('/groups/ <gid>', () => {
  it('should return all the group info', done => {
    chai
      .request(app)
      .get('/groups/250')
      .end((err, res) => {
        expect(res.status).to.eql(200)
        expect(res.body).to.deep.equal({
          gid: 250,
          name: '_analyticsusers',
          members: ['_analyticsd', '_networkd', '_timed']
        })
        done()
      })
  })

  describe('empty or non-existing query should return 404', () => {
    it('empty query should return 404', done => {
      chai
        .request(app)
        .get('/groups/9999?')
        .end((err, res) => {
          expect(res.status).to.eql(404)
          done()
        })
    })

    it('non-existing query should return 404', done => {
      chai
        .request(app)
        .get('/groups/iDontExist')
        .end((err, res) => {
          expect(res.status).to.eql(404)
          done()
        })
    })
  })
})
