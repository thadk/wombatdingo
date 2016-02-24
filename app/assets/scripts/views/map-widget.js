'use strict';
import fetch from 'isomorphic-fetch';
import Promise from 'bluebird';
import React from 'react';
import L from 'leaflet';
import Dropdown from '../components/dropdown';
import classnames from 'classnames';
import _ from 'lodash';

const mapGeoJSON = 'https://raw.githubusercontent.com/open-contracting-partnership/ocp-data/publish/oc-status/_map.json';
const godiScores = 'http://index.okfn.org/api/places.json';

const viewFilterMatrix = {
  all: 'Everything',
  ocds: 'OCDS',
  commitments: 'OGP Relevant commitments',
  contracts: 'Publishing contracts'
};

const ocdsMatrix = {
  ocds_implementation: 'In implementation',
  ocds_historic_data: 'Historic data',
  ocds_ongoing_data: 'Ongoing data'
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

  componentDidMount: function () {
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
    if (layer.feature.properties.isInvalid) {
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

    switch (this.state.viewFilter) {
      case 'ocds':
        if (layer.feature.properties.ocds_ongoing_data) {
          layer.setStyle(this.layerStyles.green);
        } else if (layer.feature.properties.ocds_historic_data) {
          layer.setStyle(this.layerStyles.yellow);
        } else if (layer.feature.properties.ocds_implementation) {
          layer.setStyle(this.layerStyles.orange);
        }
        break;
      case 'commitments':
        if (layer.feature.properties.ogp_commitments && layer.feature.properties.ogp_commitments.length) {
          layer.setStyle(this.layerStyles.green);
        }
        break;
      case 'contracts':
        if (layer.feature.properties.innovations && layer.feature.properties.innovations.length) {
          layer.setStyle(this.layerStyles.green);
        }
        break;
    }
  },

  onEachFeature: function (feature, layer) {
    layer.feature.properties.isInvalid = Object.keys(layer.feature.properties).length === 3;
    this.setCountryStyle(layer);

    layer
      .on('click', e => {
        if (layer.feature.properties.isInvalid) {
          return;
        }
        this.setState({
          activeCountryProperties: e.target.feature.properties
        });
      })
      .on('mousemove', e => {
        if (layer.feature.properties.isInvalid) {
          return;
        }
        // Don't act on the selected layer.
        if (e.target.feature.properties.iso_a2 !== _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
          e.target.setStyle(this.layerStyles.hover);
        }
      })
      .on('mouseout', e => {
        if (layer.feature.properties.isInvalid) {
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

  render: function () {
    if (!this.state.fetchedData && !this.state.fetchingData) {
      return null;
    }

    let country = this.state.activeCountryProperties;
    let godi = this.state.godiData;
    let countryGodi = null;
    if (country) {
      countryGodi = _.find(godi, {'id': country.iso_a2.toLowerCase()});
    }

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
            {countryGodi ? (
              <p>Global Open Data Index Score: <a href={'http://index.okfn.org/place/' + countryGodi.slug} target='_blank'>{countryGodi.score}%</a></p>
            ) : null}
            <h3>OCDS</h3>
            <ul>
              {_.map(ocdsMatrix, (o, i) => {
                return (
                  <li key={i}
                    className={classnames('ocds-item', {'ocds-item--active': country[i]})}>{o}</li>
                );
              })}
            </ul>
            {country.ocds_description ? <p>{country.ocds_description}</p> : null }
            <h3>Relevant OGP commitment</h3>
            {country.ogp_commitments.length ? (
              <ol>
              {_.map(country.ogp_commitments, (o, i) => {
                return (
                  <li key={i}>
                    {o.ogp_commitment}
                    {o.ogp_commitment_link ? <a href={o.ogp_commitment_link} target='_blank'></a> : null}
                  </li>
                );
              })}
              </ol>) : <p className='no-results'>No relevant commitment</p>}
            <p><a href={'http://survey.open-contracting.org/#/forms/oc-status/' + country.iso_a2.toLowerCase()} target='_blank'>Improve this data</a></p>
          </div>
          ) : null}
        </div>
      </section>
    );
  }
});

module.exports = MapWidget;
