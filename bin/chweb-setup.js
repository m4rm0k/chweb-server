#! /usr/bin/env node

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

require('colors')

const fs = require('fs')
const uuidv4 = require('uuid/v4')

const Config = require('>/lib/config')
const Connection = require('>/lib/database/Connection')
const Counter = require('>/models/Counter')
const Enquirer = require('enquirer')
const Setting = require('>/models/Setting')

async function start () {
  const dbConfig = {}
  const appConfig = {}
  const enquirer = new Enquirer()
  let answers

  enquirer.register('password', require('prompt-password'))
  enquirer.register('number', Enquirer.NumberPrompt)

  console.log('')
  console.log('Application Configuration')
  console.log('=========================')

  answers = await enquirer.prompt([
    {
      type: 'input',
      message: 'Environment name:',
      name: 'env',
      initial: process.env.NODE_ENV
    },
    {
      type: 'number',
      message: 'Port:',
      name: 'port',
      initial: 3000
    },
    {
      type: 'input',
      message: 'Session cookie name:',
      name: 'cookie_name',
      initial: 'chweb'
    },
    {
      type: 'input',
      message: 'Session cookie secret:',
      name: 'cookie_secret',
      initial: uuidv4()
    },
    {
      type: 'number',
      message: 'Password salt rounds:',
      name: 'salt_rounds',
      initial: 10
    },
    {
      type: 'number',
      message: 'User ID to run as (optional):',
      name: 'uid'
    },
    {
      type: 'number',
      message: 'Group ID to run as (optional):',
      name: 'gid'
    }
  ])

  process.env.NODE_ENV = answers.env
  appConfig.bind_port = answers.port
  appConfig.cookie = {
    name: answers.cookie_name,
    secret: answers.cookie_secret
  }

  appConfig.password = {
    salt_rounds: answers.salt_rounds
  }

  if (answers.uid) {
    appConfig.uid = answers.uid
  }

  if (answers.gid) {
    appConfig.gid = answers.gid
  }

  Config.reload()

  fs.writeFileSync(
    Config.path('app'),
    JSON.stringify(appConfig, null, 2)
  )

  console.log('')
  console.log('Database Configuration')
  console.log('======================')

  answers = await enquirer.prompt([
    {
      type: 'input',
      message: 'MongoDB host:',
      initial: '127.0.0.1',
      name: 'mongodb_host'
    },
    {
      type: 'input',
      message: 'MongoDB port:',
      initial: 27017,
      name: 'mongodb_port'
    },
    {
      type: 'input',
      message: 'Database name:',
      initial: 'chweb',
      name: 'mongodb_database'
    },
    {
      type: 'confirm',
      message: 'Is MongoDB authentication enabled?',
      name: 'mongodb_auth_enabled'
    }
  ])

  dbConfig.host = answers.mongodb_host
  dbConfig.port = answers.mongodb_port
  dbConfig.database = answers.mongodb_database
  dbConfig.anonymous = !answers.mongodb_auth_enabled

  if (answers.mongodb_auth_enabled) {
    answers = await enquirer.prompt([
      {
        type: 'input',
        message: 'MongoDB username:',
        name: 'mongodb_username'
      },
      {
        type: 'password',
        message: 'MongoDB password:',
        name: 'mongodb_password'
      }
    ])

    dbConfig.username = answers.mongodb_username
    dbConfig.password = answers.mongodb_password
  }

  Config.reload()

  fs.writeFileSync(
    Config.path('db'),
    JSON.stringify(dbConfig, null, 2)
  )

  Config.reload()

  let connected, connection

  try {
    connection = await Connection.connect()
    connected = true
  } catch (e) {
    connected = false
  }

  console.log('')
  console.log('Database Initialisation')
  console.log('=======================')

  if (connected) {
    console.log('✔'.green + ' Database connection established')
  } else {
    console.log('✖'.red + ' Failed to establish database connection')
    process.exit(2)
  }

  const setting = new Setting()
  setting.key = 'defaultAction'
  setting.value = 'REJECT'

  if (await setting.save()) {
    console.log('✔'.green + ' Setup default action rule')
  } else {
    console.log('✖'.red + ' Failed to setup default action rule')
  }

  const counter = new Counter()
  counter.host = '<all>'

  if (await counter.save()) {
    console.log('✔'.green + ' Setup global counter')
  } else {
    console.log('✖'.red + ' Failed to setup global counter')
  }

  console.log('')
  console.log('Setup Complete')
  console.log('==============')
  console.log('You can now start the server by running ' + 'chweb-httpd'.yellow + ' and add users by running ' + 'add-chweb-user'.yellow)

  await connection.close()
}

start()
