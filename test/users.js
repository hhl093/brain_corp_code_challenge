var assert = require('assert')
const sqlClient = require('../datasources/database')

const chai = require('chai')
const { expect } = require('chai')
const chaiHttp = require('chai-http')
const should = chai.should()

const app = require('../app')

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

chai.use(chaiHttp)

describe('/users', () => {
  it('it should return all the users in the system', done => {
    chai
      .request(app)
      .get('/users')
      .end((err, res) => {
        expect(res.status).to.eql(200)
        expect(res.body).to.be.a('array')
        expect(res.body.length).to.eql(6)
        expect(res.body).to.include.deep.members([
          {
            uid: 0,
            name: 'root',
            gid: 0,
            comment: 'root',
            home: '/root',
            shell: '/bin/bash'
          },
          {
            uid: 1001,
            name: 'dwoodlins',
            gid: 1001,
            comment: '',
            home: '/home/dwoodlins',
            shell: '/bin/false'
          },
          {
            uid: 1002,
            name: '_analyticsd',
            gid: 250,
            comment: '_analyticsd',
            home: null,
            shell: null
          },
          {
            uid: 1003,
            name: '_networkd',
            gid: 250,
            comment: '_networkd',
            home: null,
            shell: null
          },
          {
            uid: 1004,
            name: '_timed',
            gid: 250,
            comment: '_timed',
            home: null,
            shell: null
          }
        ])

        done()
      })
  })
}) // end of all users

describe('/users/query', () => {
  describe('query with none existing/invalid entry option should return 404 not found', () => {
    it('empty input should return 404', done => {
      chai
        .request(app)
        .get('/users/query?')
        .end((err, res) => {
          expect(res.status).to.eql(404)

          done()
        })
    })

    it('non existing entry should return 404', done => {
      chai
        .request(app)
        .get('/users/query?name=nonexisting')
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
        .get('/users/query?name=root')
        .end((err, res) => {
          console.log('sepcial', res.body)
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body).to.include.deep.members([
            {
              uid: 0,
              name: 'root',
              gid: 0,
              comment: 'root',
              home: '/root',
              shell: '/bin/bash'
            }
          ])

          done()
        })
    })

    it('query uid return valid result', done => {
      chai
        .request(app)
        .get('/users/query?uid=0')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body).to.include.deep.members([
            {
              uid: 0,
              name: 'root',
              gid: 0,
              comment: 'root',
              home: '/root',
              shell: '/bin/bash'
            }
          ])
          done()
        })
    })

    it('query gid return valid result', done => {
      chai
        .request(app)
        .get('/users/query?gid=0')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body).to.include.deep.members([
            {
              uid: 0,
              name: 'root',
              gid: 0,
              comment: 'root',
              home: '/root',
              shell: '/bin/bash'
            }
          ])
          done()
        })
    })

    it('query comment return valid result', done => {
      chai
        .request(app)
        .get('/users/query?comment=root')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body).to.include.deep.members([
            {
              uid: 0,
              name: 'root',
              gid: 0,
              comment: 'root',
              home: '/root',
              shell: '/bin/bash'
            }
          ])
          done()
        })
    })

    it('query home return valid result', done => {
      chai
        .request(app)
        .get('/users/query?home=/root')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body).to.include.deep.members([
            {
              uid: 0,
              name: 'root',
              gid: 0,
              comment: 'root',
              home: '/root',
              shell: '/bin/bash'
            }
          ])
          done()
        })
    })

    it('query shell return valid result', done => {
      chai
        .request(app)
        .get('/users/query?shell=/bin/bash')
        .end((err, res) => {
          expect(res.status).to.eql(200)
          expect(res.body).to.be.a('array')
          expect(res.body.length).to.eql(1)
          expect(res.body).to.include.deep.members([
            {
              uid: 0,
              name: 'root',
              gid: 0,
              comment: 'root',
              home: '/root',
              shell: '/bin/bash'
            }
          ])
          done()
        })
    })
  })
}) // end of user query

describe('/users/<uid>', () => {
  it('none existing input should return 404', done => {
    chai
      .request(app)
      .get('/users/88')
      .end((err, res) => {
        expect(res.status).to.eql(404)

        done()
      })
  })

  it('correct result should be returned ', done => {
    chai
      .request(app)
      .get('/users/1001')
      .end((err, res) => {
        expect(res.status).to.eql(200)
        expect(res.body).to.deep.equal({
          uid: 1001,
          name: 'dwoodlins',
          gid: 1001,
          comment: '',
          home: '/home/dwoodlins',
          shell: '/bin/false'
        })

        done()
      })
  })
}) // end of users/uid

describe('/users/<uid>/groups', () => {
  it('none existing input should return 404', done => {
    chai
      .request(app)
      .get('/users/88')
      .end((err, res) => {
        expect(res.status).to.eql(404)

        done()
      })
  })

  it('correct result should be returned ', done => {
    chai
      .request(app)
      .get('/users/1001/groups')
      .end((err, res) => {
        expect(res.status).to.eql(200)
        expect(res.body.length).to.eql(2)
        expect(res.body).to.include.deep.members([
          { gid: 1002, name: 'docker', members: ['dwoodlins'] },
          {
            gid: 350,
            name: 'monitor',
            members: ['dwoodlins', 'system_monitor']
          }
        ])

        done()
      })
  })
}) // end of uid/groups
