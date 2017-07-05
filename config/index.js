module.exports = {
  port: process.env.PORT || 8080,
  baseGitUrl: process.env.BASE_GIT_URL || 'https://github.com/',
  globPattern: process.env.SOURCE_FILE_GLOB_PATTERN || 'src/**/*.@(js|jsx)'
}
