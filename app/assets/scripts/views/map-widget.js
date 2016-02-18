'use strict';
import React from 'react';
import fetch from 'isomorphic-fetch';
import L from 'leaflet';

var MapWidget = React.createClass({
  displayName: 'MapWidget',

  getInitialState: function () {
    return {
      fetchedData: false,
      fetchingData: false,
      countries: {},
      countryName: ''
    };
  },

  componentDidMount: function () {
    this.setState({fetchingData: true});
    // Network request.
    setTimeout(() => {
      let component = this;
      fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
      .then(function (response) {
        if (response.status >= 400) {
          throw new Error('Bad response');
        }
        return response.json();
      })
      .then(function (countries) {
        if (component.isMounted()) {
          component.setState({fetchingData: false, fetchedData: true});
          component.setState({countries: countries});
          component.setupMap();
        }
      });
    }, 1000);
  },
  setupMap: function () {
    var component = this;
    var map = L.map('ocp-map__map').setView([51.505, -0.09], 1);
    L.tileLayer('http://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic3RhdGVvZnNhdGVsbGl0ZSIsImEiOiJlZTM5ODI5NGYwZWM2MjRlZmEyNzEyMWRjZWJlY2FhZiJ9.omsA8QDSKggbxiJjumiA_w.')
    .addTo(map);

    var layer = L.geoJson(this.state.countries, {
      style: function (feature) {
        return feature.properties.style;
      },
      onEachFeature: function (feature, layer) {
        layer.on('mousemove', function (e) {
          var layerId = layer.feature.properties.iso_a2;
          if (layerId) {
            component.setState({countryName: layerId});
          } else {
            component.setState({countryName: ''});
          }
        }).on('mouseout', function (o) {
          component.setState({countryName: ''});
        });
      }
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
            <h2>{this.state.countryName}</h2>
          </div>
        </div>
      </section>
    );
  }
});

module.exports = MapWidget;
