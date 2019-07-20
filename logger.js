const winston = require('winston')
const dotenv = require('dotenv').config()
var level = 'debug'

if (process.env.NODE_ENV == 'development') {
  level = 'debug'
} else {
  level = 'error'
}

const logger = new winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.simple(),
      prettyPrint: JSON.stringify
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
})

module.exports = logger
