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
  const respond = (files) => {
    const html = files[files.length - 1]
    res.type('html').end(html.contents.toString())
  }

  if (cached[ref]) {
    respond(cached[ref])
  } else {
    generateDocumentation(url, ref)
      .then((files) => {
        cache.set(url, Object.assign({}, cached, { [ref]: files }))
        respond(files)
      })
      .catch((err) => {
        console.error(err)
        res.status(500).end()
      })
  }
})
app.get('/:organization/:repository/*', (req, res) => {
  const ref = req.query.ref || 'master'
  const { organization, repository } = req.params
  const url = gitUrl(organization, repository)
  const cached = cache.get(url) || {}
  const filepath = req.params[0]
  if (!cached[ref]) return res.status(404).end()
  const file = cached[ref].find((f) => f.relative === filepath)
  if (!file) return res.status(404).end()
  res.status(200).end(file.contents.toString())
})

app.listen(config.port)
