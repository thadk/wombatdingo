'use strict';
import fetch from 'isomorphic-fetch';
import React from 'react';
import L from 'leaflet';
// import R from 'ramda';
import Dropdown from '../components/dropdown';
import classnames from 'classnames';
import _ from 'lodash';

// const countryGeom = require('../../data/countries.json');
const mapGeoJSON = 'https://raw.githubusercontent.com/open-contracting-partnership/ocp-data/publish/oc-status/map.json';

const viewFilterMatrix = {
  all: 'Everything',
  ocds: 'OCDS',
  commitments: 'OGP Relevant commitments',
  contracts: 'Publishing contracts'
};

var MapWidget = React.createClass({
  displayName: 'MapWidget',

  mapCountryLayer: null,

  getInitialState: function () {
    return {
      fetchedData: false,
      fetchingData: false,
      mapGeoJSON: null,
      activeCountryProperties: null,
      viewFilter: 'all'
    };
  },

  componentDidMount: function () {
    this.setState({fetchingData: true});
    // Network request.
    fetch(mapGeoJSON)
    .then(response => {
      if (response.status >= 400) {
        throw new Error('Bad response');
      }
      return response.json();
    })
    .then(countryData => {
      this.setState({
        fetchingData: false,
        fetchedData: true,
        mapGeoJSON: countryData
      });
      this.setupMap();
    });
  },

  viewFilterClickHandler: function (key, e) {
    e.preventDefault();
    this.setState({ viewFilter: key });
  },

  // onMouseMove: function (layer, activeStyle, hoverStyle, countryName, countryData) {
  //   layer.on('mousemove', e => {
  //     layer.setStyle(hoverStyle);
  //     this.setState({
  //       activeCountryName: countryName,
  //       activeCountryData: countryData
  //     });
  //   })
  //   .on('mouseout', e => {
  //     layer.setStyle(activeStyle);
  //   });
  // },

  onEachFeature: function (feature, layer) {
    var lyrStyleActive = {
      color: '#C2C2C2',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#F4F4F4'
    };
    var lyrStyleActiveHover = {
      color: '#C2C2C2',
      fillColor: '#C6D91A'
    };
    var lyrStyleInactive = {
      color: '#C2C2C2',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#B5B5B5'
    };
    var lyrStyleInactiveHover = {
      color: '#C2C2C2',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#A1A1A1'
    };
    var lyrStyleBlank = {
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#868586'
    };

    // var component = this;
    // var layerId = layer.feature.properties.iso_a2.toLowerCase();
    // var countryData = component.state.countryData;
    // var thisCountryData = R.filter(R.propEq('iso', layerId), countryData)[0];

    // if (thisCountryData && thisCountryData.results.ocds_description) {
    //   layer.setStyle(lyrStyleActive);
    //   this.onMouseMove(layer, lyrStyleActive, lyrStyleActiveHover, thisCountryData.name, thisCountryData);
    // } else if (thisCountryData) {
    //   layer.setStyle(lyrStyleInactive);
    //   this.onMouseMove(layer, lyrStyleInactive, lyrStyleInactiveHover, thisCountryData.name, {});
    // } else {
    //   layer.setStyle(lyrStyleBlank);
    // }
    layer
      .setStyle(lyrStyleInactive)
      .on('click', e => {
        this.mapCountryLayer.setStyle(lyrStyleInactive);
        e.target.setStyle(lyrStyleActiveHover);
        this.setState({
          activeCountryProperties: e.target.feature.properties
        });
      })
      .on('mousemove', e => {
        // Don't act on the selected layer.
        if (e.target.feature.properties.iso_a2 !== _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
          e.target.setStyle(lyrStyleActive);
        }
      })
      .on('mouseout', e => {
        // Don't act on the selected layer.
        if (e.target.feature.properties.iso_a2 !== _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
          e.target.setStyle(lyrStyleInactive);
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

    // var activeCountryData = this.state.activeCountryData;
    // if (Object.keys(activeCountryData).length) {
    //   activeCountryData = JSON.stringify(activeCountryData);
    // } else {
    //   activeCountryData = 'No Data';
    // }
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
            <dl className='ocp-map-details'>
              <dd>The label</dd>
              <dt>The value, probably "No"</dt>
              <dd>The label</dd>
              <dt>The value, probably "No"</dt>
            </dl>
          </div>
          ) : null}
        </div>
      </section>
    );
  }
});

module.exports = MapWidget;
