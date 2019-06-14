#! /usr/bin/env node

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

require('colors')

const Connection = require('>/lib/database/Connection')
const Enquirer = require('enquirer')
const User = require('>/models/User')

async function exit (connection) {
  if (connection) {
    await connection.client.close()
  }

  process.exit()
}

async function start () {
  const connection = await Connection.connect()

  try {
    const enquirer = new Enquirer()

    enquirer.register('password', require('prompt-password'))
    const questions = [
      {
        type: 'input',
        message: 'Enter username:',
        name: 'username'
      },
      {
        type: 'password',
        message: 'Enter password:',
        name: 'password'
      },
      {
        type: 'password',
        message: 'Confirm password:',
        name: 'confirmPassword'
      }
    ]

    const answers = await enquirer.prompt(questions)

    if (answers.password !== answers.confirmPassword) {
      console.log('The passwords entered did not match'.red)
      await exit()
    }

    const existingUser = await User.findByUsername(answers.username)
    if (existingUser) {
      console.log('This username is taken'.red)
      await exit(connection)
    }

    const user = new User()
    user.username = answers.username

    if (await user.save()) {
      if (await user.setPassword(answers.password)) {
        console.log(`Created ${answers.username} [${user.id}]`.green)
      } else {
        console.log('Failed to set user password'.red)
      }
    } else {
      console.log('Failed to create user'.red)
    }
  } catch (e) {
    if (e) {
      console.log(`An error occurred: ${e}`.red)
    }

    exit(connection)
  }

  await connection.client.close()
}

start()
