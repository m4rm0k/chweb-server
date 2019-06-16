const path = require('path')

describe('lib/config', () => {
  const subject = require('./index')

  describe('.app', () => {
    it('should contain a `bind_port` property', () => {
      expect(subject.app).toHaveProperty('bind_port')
    })

    it('should contain a `cookie` property', () => {
      expect(subject.app).toHaveProperty('cookie')
    })

    it('should contain a `name` property in `.cookie`', () => {
      expect(subject.app.cookie).toHaveProperty('name')
    })

    it('should contain a `secret` property in `.cookie`', () => {
      expect(subject.app.cookie).toHaveProperty('secret')
    })

    it('should container a `password` property', () => {
      expect(subject.app).toHaveProperty('password')
    })

    it('should container a `salt_rounds` property in `.password`', () => {
      expect(subject.app.password).toHaveProperty('salt_rounds')
    })
  })

  describe('.db', () => {
    it('should contain a `host` property', () => {
      expect(subject.db).toHaveProperty('host')
    })

    it('should container a `port` property', () => {
      expect(subject.db).toHaveProperty('port')
    })

    it('should container a `database` property', () => {
      expect(subject.db).toHaveProperty('database')
    })

    it('should container a `anonymous` property', () => {
      expect(subject.db).toHaveProperty('anonymous')
    })
  })
})
