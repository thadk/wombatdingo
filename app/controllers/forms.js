/* eslint-disable handle-callback-err */
'use strict';
var Boom = require('boom');
var github = require('../services/github');
var config = require('../config');

module.exports = {
  list: {
    handler: (request, reply) => {
      github.getContent('forms')
        .then((data) => {
          let forms = data.map((o) => { return {name: o.name.replace('.json', '')}; });
          reply({
            forms
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
        form: request.params.formId,
        message: 'This is not the page you are looking for...',
        entries_url: `${config.connection.host}:${config.connection.port}/forms/${request.params.formId}/entries`
      });
    }
  },

  entries: {
    handler: (request, reply) => {
      github.getContent(`data/${request.params.formId}`)
        .then((data) => {
          let entries = data.map((o) => { return {name: o.name.replace('.json', '')}; });
          reply({
            form: request.params.formId,
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
        github.getContent(`forms/${request.params.formId}.json`),
        github.getContent(`data/${request.params.formId}/${request.params.entryId}.json`)
      ])
        .then((data) => {
          let sha = data[0];
          let form = data[1];
          let entry = data[2];

          let formContent = (new Buffer(form.content, 'base64')).toString();
          let entryContent = (new Buffer(entry.content, 'base64')).toString();

          try {
            formContent = JSON.parse(formContent);
            entryContent = JSON.parse(entryContent);
          } catch (e) {
            return reply(Boom.badImplementation('Resources were not valid JSON. ' + e.message));
          }

          let res = {
            form: request.params.formId,
            title: entryContent.title,
            entry: request.params.entryId,
            meta: {
              masterSHA: sha,
              entrySHA: entry.sha,
              formSchemaVersion: formContent.version
            },
            schema: formContent,
            data: entryContent.results
          };

          reply(res);
        })
        .catch((err) => {
          console.log('err', err);
          reply(Boom.notFound());
        });
    }
  },

  entriesSingleUpdate: {
    handler: (request, reply) => {
      let branch = `${request.payload.form}-${request.payload.entry}-update-${Date.now()}`;
      Promise.all([
        github.getContent(`data/${request.params.formId}/${request.params.entryId}.json`),
        github.createBranch(branch, request.payload.meta.masterSHA)
      ])
        .then(data => {
          var entryContent = JSON.parse((new Buffer(data[0].content, 'base64')).toString());

          entryContent.results = request.payload.data;
          entryContent.meta.date = Date.now();

          return github.updateFile(
            `data/${request.params.formId}/${request.params.entryId}.json`,
            JSON.stringify(entryContent, null, '  '),
            request.payload.meta.entrySHA,
            branch,
            'Data update',
            request.payload.author.name,
            request.payload.author.email
          )
            .then(data => {
              return github.createPR(`Data update from ${request.payload.author.name}`, branch)
                .then(data => {
                  reply({
                    statusCode: 200,
                    message: 'Pull request successfully created.'
                  });
                })
                .catch((err) => {
                  console.log('err', err);
                  reply(Boom.badImplementation());
                });
            })
              .catch((err) => {
                console.log('err', err);
                reply(Boom.badImplementation());
              });
        })
        .catch((err) => {
          console.log('err', err);
          reply(Boom.badImplementation());
        });
    }
  }
};

// {
//   "author": {
//     "name": "devseedgit",
//     "email": "dev@developmentseed.org"
//   },
//   "form": "countries",
//   "entry": "co",
//   "meta": {
//     "masterSHA": "521f9eb7134a435479dec8fa7baac06438e8f910",
//     "entrySHA": "e124aa23b5be3197875f7c6bffdcb8dce25db721",
//     "formSchemaVersion": "1.0.0"
//   },
//   "data": {
//       "notable_laws": "colombiacompra.gov.co Discloses a lot of data and documents - is not yet open data, is not yet eprocurement; Decree 1510 dated July 17, 2012 – available at http://www.colombiacompra.gov.co/es/decreto-1510-de-2013-, starts the modernization of the public purchasing and procurement legal system ; adopted the United Nations Standard Products and Services Code® (UNSPSC®) by means of Decree 1510 of 2013 to facilitate communications among the participants in public procurement and enable a quicker analysis of the information, as well as the standard Annual Purchase Plan ; Tranpsarency and Acess to information act (with implementing decree)",
//       "ocds": "implementing",
//       "portal": "http://www.colombiacompra.gov.co/",
//       "contracts_published": "yes",
//       "contracts_published_description": "In Colombia, Law 80 of 1993 and Law 1150 of 2007 and associated decrees make it obligatory for all government entities, at the national, department, and municipal levels, to publish documents and information related to contracts. All documentation beginning with the preliminary studies and including the contract itself should be published, through the Public Procurement Electronic System (SECOP). By visiting the website http://www.colombiacompra.gov.co/ users can access contracts closed in the past two years.\n However there are some limitations to the system. Extractives contracts are presently excluded from the system. In addition a self-evaluation done by the Intersectoral Commission of Public Contracting (CINCO) in 2008 also mentions problems related to full coverage of the system, due to lack of connectivity in some areas. Furthermore CGD’s research found that some contracts of concern appear to have been taken down from. For example there are limited contracts available related to the Bogotá Transmilenio Project which was at the centre of a contracting scandal.",
//       "inst_engaging": "Yes",
//       "cs_engaged": "Yes",
//       "feedback_mechanism": null,
//       "ogp": true,
//       "ogp_commitment": "More Transparency in Public Procurement; Citizens' Participation and Accountability in the Mining Producing Sector ; Transparency and Citizen Participation in Royalties",
//       "cost": false,
//       "eiti": "candidate",
//       "gift": false,
//       "gift_steward": null,
//       "g20": false,
//       "oecd": false,
//       "notable_projects": "WBG and OAP planning Royalties project\n Colombia Compra Eficiente ; Transparencia por Colombia is national chapter of Transparency International",
//       "ocp_opportunities": "Hivos Long list",
//       "eiti_policy": "none",
//       "eiti_practice": "none",
//       "procurement_share": 0.13,
//       "gdp": 377.7,
//       "population": 47.79
//   }
// }