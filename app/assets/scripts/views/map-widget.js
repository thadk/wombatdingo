'use strict';
import fetch from 'isomorphic-fetch';
import React from 'react';
import L from 'leaflet';
import R from 'ramda';
var countryGeom = require('../../data/countries.json');
var countryDataUrl = 'https://raw.githubusercontent.com/open-contracting-partnership/ocp-data/publish/oc-status/all.json';

var MapWidget = React.createClass({
  displayName: 'MapWidget',

  getInitialState: function () {
    return {
      fetchedData: false,
      fetchingData: false,
      countryData: {},
      activeCountryName: '',
      activeCountryData: {}
    };
  },

  componentDidMount: function () {
    this.setState({fetchingData: true});
    // Network request.
    fetch(countryDataUrl)
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
        countryData: countryData
      });
      this.setupMap();
    });
  },

  onMouseMove: function (layer, activeStyle, hoverStyle, countryName, countryData) {
    layer.on('mousemove', e => {
      layer.setStyle(hoverStyle);
      this.setState({
        activeCountryName: countryName,
        activeCountryData: countryData
      });
    })
    .on('mouseout', e => {
      layer.setStyle(activeStyle);
    });
  },

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

    var component = this;
    var layerId = layer.feature.properties.iso_a2.toLowerCase();
    var countryData = component.state.countryData;
    var thisCountryData = R.filter(R.propEq('iso', layerId), countryData)[0];

    if (thisCountryData && thisCountryData.results.ocds_description) {
      layer.setStyle(lyrStyleActive);
      this.onMouseMove(layer, lyrStyleActive, lyrStyleActiveHover, thisCountryData.name, thisCountryData);
    } else if (thisCountryData) {
      layer.setStyle(lyrStyleInactive);
      this.onMouseMove(layer, lyrStyleInactive, lyrStyleInactiveHover, thisCountryData.name, {});
    } else {
      layer.setStyle(lyrStyleBlank);
    }
  },

  setupMap: function () {
    var map = L.map(this.refs.mapHolder).setView([51.505, -0.09], 1);
    L.geoJson(countryGeom, {
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

    var activeCountryData = this.state.activeCountryData;
    if (Object.keys(activeCountryData).length) {
      activeCountryData = JSON.stringify(activeCountryData);
    } else {
      activeCountryData = 'No Data';
    }

    return (
      <section className='ocp-map'>
        <header className='ocp-map__header'>
          <h1 className='ocp-map__title'>Open Contracting Map</h1>
          <div className='ocp-map__actions'>
            <form>
              <p className='ocp-map__actions-description'>View map by:</p>
              {/* TEMP. These labels will be changed. */}
              <label htmlFor='map-by-ocds'>
                <input type='checkbox' name='map-by-ocds' id='map-by-ocds'/> OCDS
              </label>
              <label htmlFor='b'>
                <input type='checkbox' name='b' id='b'/> OCDS
              </label>
              <label htmlFor='c'>
                <input type='checkbox' name='c' id='c'/> OCDS
              </label>
            </form>
          </div>
        </header>
        <div className='ocp-map__body'>
          <div className='ocp-map__map' ref='mapHolder'>{/* Map renders here */}</div>
          <div className='ocp-map__content'>
            <h2>{this.state.activeCountryName}</h2>
            <p>{activeCountryData}</p>
          </div>
        </div>
      </section>
    );
  }
});

module.exports = MapWidget;
