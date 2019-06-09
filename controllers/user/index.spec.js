const middleware = require('./middleware')
const subject = require('./index')

describe('controllers/user', () => {
  it('should export the middleware module', () => {
    expect(subject.middleware).toEqual(middleware)
  })
})
