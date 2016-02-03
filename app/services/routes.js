'use strict';
var datatsets = require('../controllers/datasets');

module.exports = [
  { method: 'GET', path: '/datasets', config: datatsets.list },
  { method: 'GET', path: '/datasets/{datasetId}', config: datatsets.single },
  { method: 'GET', path: '/datasets/{datasetId}/entries', config: datatsets.entries },
  { method: 'GET', path: '/datasets/{datasetId}/entries/{entryId}', config: datatsets.entriesSingle },
  { method: 'PUT', path: '/datasets/{datasetId}/entries/{entryId}', config: datatsets.entriesSingleUpdate }
];
