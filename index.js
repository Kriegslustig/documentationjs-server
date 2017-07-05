const express = require('express')

const config = require('./config')
const utils = require('./lib/utils')
const generateDocumentation = require('./lib/generate-documentation')

const app = express()

const cache = new Map()

const gitUrl = utils.gitUrl(config.baseGitUrl)

app.get('/-/ping', (req, res) => { res.end })
app.post('/:organization/:repository/clear', (req, res) => {
  const { organization, repository } = req.params
  cache.delete(gitUrl(organization, repository))
})
app.get('/:organization/:repository', (req, res) => {
  const ref = req.query.ref || 'master'
  const { organization, repository } = req.params
  const url = gitUrl(organization, repository)
  const cached = cache.get(url) || {}
  const respond = (html) => {
    res.type('html').end(html)
  }

  if (cached[ref]) {
    respond(cached[ref])
  } else {
    generateDocumentation(url, ref)
      .then((html) => {
        cache.set(url, Object.assign({}, cached, { [ref]: html }))
        respond(html)
      })
      .catch((err) => {
        console.error(err)
        res.status(500).end()
      })
  }
})

app.listen(config.port)
