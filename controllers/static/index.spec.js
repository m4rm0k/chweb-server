const expressHelper = require('>/test/support/express_helper')
const fs = require('fs')
const path = require('path')
const request = require('supertest')
const subject = require('./index')

describe('controllers/static', () => {
  let app, agent, indexContent

  beforeAll(() => {
    const indexPath = path.join(__dirname, '../../public/app/build/index.html')

    try {
      indexContent = fs.readFileSync(indexPath).toString()
    } catch (e) {
      fs.writeFileSync(indexPath, 'index')
      indexContent = 'index'
    }
  })

  beforeEach(async () => {
    app = expressHelper.create()
    subject.bind(app)
    agent = request.agent(app)
  })

  describe('GET /', () => {
    it('should redirect to /app', async () => {
      const res = await await agent.get('/')
      expect(res.status).toBeGreaterThan(299)
      expect(res.status).toBeLessThan(400)
      expect(res.header.location).toEqual('/app')
    })
  })

  describe('GET /login', () => {
    it('should return public/app/build/index.html', async () => {
      const res = await await agent.get('/login')
      expect(res.text).toEqual(indexContent)
    })
  })

  describe('GET /app', () => {
    it('should return public/app/build/index.html', async () => {
      const res = await await agent.get('/app')
      expect(res.text).toEqual(indexContent)
    })
  })

  describe('GET /app/*', () => {
    it('should return public/app/build/index.html', async () => {
      const res = await await agent.get('/app/hosts')
      expect(res.text).toEqual(indexContent)
    })
  })
})
