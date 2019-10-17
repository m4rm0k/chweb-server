require('./jest')
const Connection = require('>/lib/database/Connection')

module.exports = async () => {
  const connection = await Connection.connect()
  await connection.database.collection('hosts').removeMany({})
  await connection.database.collection('users').removeMany({})
  await connection.close()
}
