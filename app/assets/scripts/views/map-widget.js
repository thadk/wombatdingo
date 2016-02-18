'use strict';
import React from 'react';
import fetch from 'isomorphic-fetch';
import L from 'leaflet';
var countryGeom = require('../../data/countries.json');

var MapWidget = React.createClass({
  displayName: 'MapWidget',

  getInitialState: function () {
    return {
      fetchedData: false,
      fetchingData: false,
      countryGeom: countryGeom,
      countryData: {},
      countryAbrv: '',
      layerStyle: {}
    };
  },

  componentDidMount: function () {
    this.setState({fetchingData: true});
    // Network request.
    let component = this;
    fetch('https://raw.githubusercontent.com/open-contracting-partnership/ocp-data/publish/oc-status/all.json')
    .then(function (response) {
      if (response.status >= 400) {
        throw new Error('Bad response');
      }
      return response.json();
    })
    .then(function (countryData) {
      if (component.isMounted()) {
        component.setState({
          fetchingData: false,
          fetchedData: true,
          countryData: countryData
        });
        component.setupMap();
      }
    });
  },
  setupMap: function () {
    var component = this;
    var map = L.map('ocp-map__map').setView([51.505, -0.09], 1);

    var lyrStyleActive = {
      color: '#C2C2C2',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#F4F4F4'
    };
    var lyrStyleInactive = {
      color: '#C2C2C2',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#F4F4F4'
    };
    var lyrStyleHover = {
      color: '#C2C2C2',
      fillColor: '#C6D91A'
    };

    function onEachFeature (feature, layer) {
      layer.setStyle(lyrStyleActive);
      layer.on('mousemove', function (e) {
        var layerId = layer.feature.properties.iso_a2;
        if (layerId) {
          layer.setStyle(lyrStyleHover);
          component.setState({countryAbrv: layerId});
        } else {
          layer.setStyle(lyrStyleActive);
          component.setState({countryAbrv: ''});
        }
      }).on('mouseout', function (e) {
        layer.setStyle(lyrStyleActive);
        component.setState({countryAbrv: ''});
      });
    }

    var layer = L.geoJson(this.state.countryGeom, {
      onEachFeature: onEachFeature
    });

    layer.addTo(map);
  },
  render: function () {
    if (!this.state.fetchedData && !this.state.fetchingData) {
      return null;
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
          <div className='ocp-map__map'
               id='ocp-map__map'>
          </div>
          <div className='ocp-map__content'>
            <h2>{this.state.countryAbrv}</h2>
          </div>
        </div>
      </section>
    );
  }
});

module.exports = MapWidget;
