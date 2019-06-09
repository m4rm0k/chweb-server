const middleware = require('./middleware')
const subject = require('./index')

describe('controllers/host', () => {
  it('should export the middleware module', () => {
    expect(subject.middleware).toEqual(middleware)
  })
})
