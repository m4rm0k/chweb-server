const subject = require('./')
const Connection = require('./Connection')
const { checkCollectionExists, createCollection } = require('./collection')

describe('lib/database rollup', () => {
  it('should export the Connection class', () => {
    expect(subject.Connection).toEqual(Connection)
  })

  it('should export the checkCollectionExists function', () => {
    expect(subject.checkCollectionExists).toEqual(checkCollectionExists)
  })

  it('should export the createCollection function', () => {
    expect(subject.createCollection).toEqual(createCollection)
  })
})
