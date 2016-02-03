/* eslint-disable handle-callback-err */
'use strict';
var Boom = require('boom');
var _ = require('lodash');
var github = require('../services/github');
var config = require('../config');

module.exports = {
  list: {
    handler: (request, reply) => {
      github.getContent('datasets')
        .then((data) => {
          let datasets = data.map((o) => { return {name: o.name.replace('.json', '')}; });
          reply({
            datasets
          });
        })
        .catch((err) => {
          console.log('err', err);
          reply(Boom.notFound());
        });
    }
  },

  single: {
    handler: (request, reply) => {
      reply({
        dataset: request.params.datasetId,
        message: 'This is not the page you are looking for...',
        entries_url: `${config.connection.host}:${config.connection.port}/datasets/${request.params.datasetId}/entries`
      });
    }
  },

  entries: {
    handler: (request, reply) => {
      github.getContent(`data/${request.params.datasetId}`)
        .then((data) => {
          console.log('x-ratelimit-remaining', data.meta['x-ratelimit-remaining']);
          let entries = data.map((o) => { return {name: o.name.replace('.json', '')}; });
          reply({
            dataset: request.params.datasetId,
            entries
          });
        })
        .catch((err) => {
          console.log('err', err);
          reply(Boom.notFound());
        });
    }
  },

  entriesSingle: {
    handler: (request, reply) => {
      Promise.all([
        github.getMasterSHA(),
        github.getContent(`datasets/${request.params.datasetId}.json`),
        github.getContent(`data/${request.params.datasetId}/${request.params.entryId}.json`)
      ])
        .then((data) => {
          let sha = data[0];
          let dataset = data[1];
          let entry = data[2];

          let datasetContent = (new Buffer(dataset.content, 'base64')).toString();
          let enrtyContent = (new Buffer(entry.content, 'base64')).toString();

          try {
            datasetContent = JSON.parse(datasetContent);
            enrtyContent = JSON.parse(enrtyContent);
          } catch (e) {
            return reply(Boom.badImplementation('Resources were not valid JSON. ' + e.message));
          }

          let prepQuestions = datasetContent.data.map(o => {
            let answer = _.get(enrtyContent.results, o.id, '');
            o.default = answer;
            return o;
          });

          let res = {
            dataset: request.params.datasetId,
            entry: request.params.entryId,
            meta: {
              masterSHA: sha,
              entrySHA: entry.sha,
              datasetSchemaVersion: datasetContent.meta.version
            },
            data: prepQuestions
          };

          reply(res);
        })
        .catch((err) => {
          console.log('err', err);
          reply(Boom.notFound());
        });
    }
  }
};
