function checkCollectionExists (db, name) {
  return new Promise((resolve, reject) => {
    db.listCollections({ name: name }).next((error, info) => {
      if (error) {
        return reject(error)
      } else if (info) {
        return resolve(true)
      } else {
        return resolve(false)
      }
    })
  })
}

function createCollection (db, name) {
  return new Promise((resolve, reject) => {
    checkCollectionExists(db, name).then((exists) => {
      if (exists) {
        return resolve({ created: false })
      } else {
        db.createCollection(name).then(() => {
          return resolve({ created: true })
        })
      }
    })
  })
}

module.exports = {
  checkCollectionExists: checkCollectionExists,
  createCollection: createCollection
}
