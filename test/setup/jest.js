require('@babel/polyfill')

process.env.NODE_ENV = 'test'

global.removeAllMongoDocs = async () => {
  const Connection = require('>/lib/database/Connection')
  const connection = await Connection.connect()
  await connection.database.collection('hosts').removeMany({})
  await connection.database.collection('users').removeMany({})
  await connection.database.collection('rules').removeMany({})
}
