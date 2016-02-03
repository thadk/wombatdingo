'use strict';
var GitHubApi = require('github');
var config = require('../config');

var github = new GitHubApi({
  // required
  version: '3.0.0'
  // // optional
  // debug: true,
  // protocol: "https",
  // host: "github.my-GHE-enabled-company.com", // should be api.github.com for GitHub
  // pathPrefix: "/api/v3", // for some GHEs; none for GitHub
  // timeout: 5000,
  // headers: {
  //     "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
  // }
});

github.authenticate({
  type: 'oauth',
  token: config.ghToken
});

module.exports.connection = github;

module.exports.getMasterSHA = function () {
  return new Promise((fulfill, reject) => {
    github.gitdata.getReference({
      user: config.ghUser,
      repo: config.ghRepo,
      ref: 'heads/master'
    }, function (err, data) {
      if (err) {
        return reject(err);
      }
      fulfill(data.object.sha);
    });
  });
};

module.exports.getContent = function (path) {
  return new Promise((fulfill, reject) => {
    github.repos.getContent({
      user: config.ghUser,
      repo: config.ghRepo,
      path: path
    }, function (err, data) {
      if (err) {
        return reject(err);
      }
      fulfill(data);
    });
  });
};
