const gitUrl = exports.gitUrl = (base) => (organization, repository) =>
  `${base}${organization}/${repository}.git`
