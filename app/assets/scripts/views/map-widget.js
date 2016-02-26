'use strict';
import fetch from 'isomorphic-fetch';
import Promise from 'bluebird';
import React from 'react';
import L from 'leaflet';
import Dropdown from '../components/dropdown';
import classnames from 'classnames';
import _ from 'lodash';

const mapGeoJSON = 'https://raw.githubusercontent.com/open-contracting-partnership/ocp-data/publish/oc-status/_map.json';
const godiScores = 'http://index.okfn.org/api/entries.json';

const viewFilterMatrix = {
  all: 'Everything',
  ocds: 'OCDS',
  commitments: 'OGP Relevant commitments',
  contracts: 'Publishing contracts'
};

const ocdsMatrix = {
  ocds_implementation: 'in implementation',
  ocds_historic_data: 'historic data',
  ocds_ongoing_data: 'ongoing data'
};

var MapWidget = React.createClass({
  displayName: 'MapWidget',

  mapCountryLayer: null,

  layerStyles: {
    default: {
      color: '#959595',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#B5B5B5'
    },
    nodata: {
      color: '#E3E3E3',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#F4F4F4'
    },
    hover: {
      color: '#C2DC16',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5,
      fillColor: '#C2DC16'
    },
    active: {
      color: '#C2DC16',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#C2DC16'
    },

    green: {
      color: '#27ae60',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#27ae60'
    },
    yellow: {
      color: '#f39c12',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#f1c40f'
    },
    orange: {
      color: '#d35400',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#e67e22'
    }
  },

  getInitialState: function () {
    return {
      fetchedData: false,
      fetchingData: false,
      mapGeoJSON: null,
      godiScores: null,
      godiData: null,
      activeCountryProperties: null,
      viewFilter: 'all'
    };
  },

  fetchData: function () {
    this.setState({fetchingData: true});

    Promise.all([
      fetch(mapGeoJSON)
      .then(response => {
        if (response.status >= 400) {
          throw new Error('Bad response');
        }
        return response.json();
      }),

      fetch(godiScores)
      .then(response => {
        if (response.status >= 400) {
          throw new Error('Bad response');
        }
        return response.json();
      })
    ])
    .then(data => {
      let countryData = data[0];
      let godiResults = data[1];

      this.setState({
        fetchingData: false,
        fetchedData: true,
        mapGeoJSON: countryData,
        godiData: godiResults
      });
      this.setupMap();
    });
  },

  componentDidMount: function () {
    this.fetchData();
  },

  componentDidUpdate: function () {
    if (this.mapCountryLayer) {
      this.setCountriesStyle();
    }
  },

  viewFilterClickHandler: function (key, e) {
    e.preventDefault();
    this.setState({ viewFilter: key });
  },

  setCountriesStyle: function () {
    this.mapCountryLayer.eachLayer(this.setCountryStyle);
  },

  setCountryStyle: function (layer) {
    // Invalid.
    if (!layer.feature.properties.has_data) {
      layer.setStyle(this.layerStyles.nodata);
      return;
    }

    // Active layer.
    if (layer.feature.properties.iso_a2 === _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
      layer.setStyle(this.layerStyles.active);
      return;
    }

    // Default style.
    layer.setStyle(this.layerStyles.default);

    let lProps = layer.feature.properties;

    switch (this.state.viewFilter) {
      case 'ocds':
        if (_.find(lProps.publishers, {ocds_ongoing_data: true})) {
          layer.setStyle(this.layerStyles.green);
        } else if (_.find(lProps.publishers, {ocds_historic_data: true})) {
          layer.setStyle(this.layerStyles.yellow);
        } else if (_.find(lProps.publishers, {ocds_implementation: true})) {
          layer.setStyle(this.layerStyles.orange);
        }
        break;
      case 'commitments':
        if (lProps.ogp_commitments && lProps.ogp_commitments.length) {
          layer.setStyle(this.layerStyles.green);
        }
        break;
      case 'contracts':
        if (lProps.innovations && lProps.innovations.length) {
          layer.setStyle(this.layerStyles.green);
        }
        break;
    }
  },

  onEachFeature: function (feature, layer) {
    this.setCountryStyle(layer);

    layer
      .on('click', e => {
        if (!layer.feature.properties.has_data) {
          return;
        }
        this.setState({
          activeCountryProperties: e.target.feature.properties
        });
      })
      .on('mousemove', e => {
        if (!layer.feature.properties.has_data) {
          return;
        }
        // Don't act on the selected layer.
        if (e.target.feature.properties.iso_a2 !== _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
          e.target.setStyle(this.layerStyles.hover);
        }
      })
      .on('mouseout', e => {
        if (!layer.feature.properties.has_data) {
          return;
        }
        // Don't act on the selected layer.
        if (e.target.feature.properties.iso_a2 !== _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
          this.setCountryStyle(e.target);
        }
      });
  },

  setupMap: function () {
    var map = L.map(this.refs.mapHolder).setView([51.505, -0.09], 1);
    this.mapCountryLayer = L.geoJson(this.state.mapGeoJSON, {
      onEachFeature: this.onEachFeature
    }).addTo(map);
    /* label layer (not working) */
    // L.tileLayer('https://api.mapbox.com/v4/mapbox.ex50cnmi/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic3RhdGVvZnNhdGVsbGl0ZSIsImEiOiJlZTM5ODI5NGYwZWM2MjRlZmEyNzEyMWRjZWJlY2FhZiJ9.omsA8QDSKggbxiJjumiA_w.')
    // .addTo(map);
  },

  renderGodi: function (country) {
    let godi = this.state.godiData;
    let countryGodi = null;
    countryGodi = _.find(godi, {'place': country.iso_a2.toLowerCase(), 'dataset': 'procurement'});

    if (!countryGodi) {
      return;
    }
    return <p>Transparency of Tenders & Awards: <a href={'http://index.okfn.org/place/' + countryGodi.place} target='_blank'>{countryGodi.score}%</a></p>;
  },

  renderPublisher: function (publishers) {
    if (!publishers.length) {
      return <div><h3>Publishing open contracting data</h3><p>No entity publishing data yet</p></div>;
    }

    let content = _.map(publishers, (o, i) => {
      var status = [];
      _.forEach(ocdsMatrix, (str, idx) => {
        if (o[idx]) { status.push(str); }
      });
      var statusStr = status.join(', ');
      return (
        <li key={i}><a href={o.publisher_link} target='_blank'>{o.publisher}</a>:
          {statusStr ? <span> {statusStr}</span> : null}
        </li>
      );
    });
    return <div><h3>Publishing open contracting data</h3><ul>{content}</ul></div>;
  },

  renderInnovations: function (innovations) {
    if (!innovations.length) {
      return;
    }

    let content = _.map(innovations, (o, i) => {
      return (
        <li key={i}><a href={o.innovation_link} target='_blank'>{o.innovation_description}</a></li>
      );
    });

    return <div><h3>Innovations in contract monitoring and data use</h3><ul>{content}</ul></div>;
  },

  renderCommitments: function (country) {
    if (!(country.ogp_commitments.length) && (!(country.commitment_oil_mining) || country.commitment_oil_mining === 'none')) {
      return;
    }

    let content_ogp = _.map(country.ogp_commitments, (o, i) => {
      return (
        <li key={i}>OGP: <a href={o.ogp_commitment_link} target='_blank'>{o.ogp_commitment}</a></li>
      );
    });

    let content;
    if (country.commitment_oil_mining) {
      if (country.commitment_oil_mining) {
        content = <li>Oil and Mining: <a href={country.commitment_oil_mining_link} target='_blank'>{country.commitment_oil_mining}</a></li>;
      } else {
        content = <li>Oil and Mining: {country.commitment_oil_mining}</li>;
      }
    }

    return <div><h3>Commitments</h3><ul>{content_ogp}{content}</ul></div>;
  },

  render: function () {
    if (!this.state.fetchedData && !this.state.fetchingData) {
      return null;
    }

    let country = this.state.activeCountryProperties;

    return (
      <section className='ocp-map'>
        <header className='ocp-map__header'>
          <h1 className='ocp-map__title'>Open Contracting Map</h1>
          <div className='ocp-map__actions'>
            <span className='ocp-map__actions-description'>View by:</span>

            <Dropdown element='span' className='drop drop--down drop--align-left'
              triggerTitle='View map by'
              triggerText={viewFilterMatrix[this.state.viewFilter]}
              triggerClassName='drop__toggle'>

              <ul className='drop__menu drop__menu--select'>
                {_.map(viewFilterMatrix, (o, i) => {
                  return (
                    <li key={i}><a href=''
                      className={classnames('drop__menu-item', {'drop__menu-item--active': this.state.viewFilter === i})}
                      data-hook='dropdown:close'
                      onClick={this.viewFilterClickHandler.bind(null, i)}>{o}</a></li>
                  );
                })}
              </ul>
            </Dropdown>
          </div>
        </header>
        <div className='ocp-map__body'>
          <div className='ocp-map__map' ref='mapHolder'>{/* Map renders here */}</div>
          {country !== null ? (
          <div className='ocp-map__content'>
            <h2>{country.name}</h2>

            {this.renderGodi(country)}

            {this.renderPublisher(country.publishers)}

            {this.renderInnovations(country.innovations)}

            {this.renderCommitments(country)}

            <p><a href={'http://survey.open-contracting.org/#/forms/oc-status/' + country.iso_a2.toLowerCase()} target='_blank'>Improve this data</a></p>
          </div>
          ) : null}
        </div>
      </section>
    );
  }
});

module.exports = MapWidget;
