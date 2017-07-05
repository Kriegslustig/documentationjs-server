const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const util = require('util')

const uuid = require('uuid/v4')
const rimraf = require('rimraf')
const mkSimpleGit = require('simple-git/promise')
const documentation = require('documentation')
const glob = require('glob')

const config = require('../config')

const mkdirP = util.promisify(fs.mkdir)
const globP = util.promisify(glob)

const buildDocs = (files) =>
  documentation.build(files, {})
    .then((o) => documentation.formats.html(o, {}))

module.exports = (gitUrl, ref) => {
  const dirname = path.resolve(__dirname, '..', uuid())

  return mkdirP(dirname)
    .then(() => {
      const simpleGit = mkSimpleGit(dirname)
      return simpleGit.clone(gitUrl, '.')
        .then(() => simpleGit.checkout(ref))
        .then(() => globP(`${dirname}/${config.globPattern}`))
        .then((files) => {
          if (files.length > 0) {
            return buildDocs(files)
          } else {
            return '404'
          }
        })
        .then((output) => new Promise((resolve, reject) => {
          rimraf(dirname, (err) => {
            if (err) return reject(err)
            resolve(output)
          })
        }))
    })
    .catch((err) => new Promise((resolve, reject) => {
      rimraf(dirname, () => {
        reject(err)
      })
    }))
}
