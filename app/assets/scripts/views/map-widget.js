'use strict';
'use strict';
import fetch from 'isomorphic-fetch';
import Promise from 'bluebird';
import React from 'react';
import L from 'leaflet';
import classnames from 'classnames';
import _ from 'lodash';
import omnivore from 'leaflet-omnivore';
import Dropdown from '../components/dropdown';
import LeafletSearch from 'leaflet-search';
import turfBboxPolygon from 'turf-bbox-polygon';
import turfCentroid from 'turf-centroid';
import turfWithin from 'turf-within';
import turfFeaturecollection from 'turf-featurecollection';

const mapTopoJSON = 'https://raw.githubusercontent.com/thadk/wombatdingo/master/data/topojson/buildings_polygons.json';

const viewFilterMatrix = {
  all: 'See Buildings: Mapping for Resilience: Quelimane, MZ ˃˃'
};

  /* GGWASH colors:
  rgb(149, 172, 156) grey
  green rgb(10, 146, 48) */
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
    ggwashGreyGreen: {
      color: '#95ac9c',
      weight: 3,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#0a9230'
    },
    ggwashGreenGrey: {
      color: '#0a9230',
      weight: 2,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#95ac9c'
    },
    vacant: {
      color: '#C3670D',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#C3670D'
    },
    blighted: {
      color: '#A30B53',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#A30B53'
    },
    userVacant: {
      color: '#FF9F41',
      weight: 1,
      opacity: 0.1,
      fillOpacity: 1,
      fillColor: '#FF9F41'
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
      color: '#65ff11',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#65ff11'
    },
    lilac: {
      color: '#6C75E1',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#6C75E1'
    },
    orange: {
      color: '#FD843D',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#FD843D'
    },
    teal: {
      color: '#23B2A7',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#23B2A7'
    },
    darkorange: {
      color: '#FB6045',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#FB6045'
    },
    blue: {
      color: '#6991F5',
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
      fillColor: '#6991F5'
    }
  },

  getInitialState: function () {
    return {
      fetchedData: false,
      fetchingData: false,
      mapTopoJSON: null,
      mapExtractedGeoJSON: null,
      mapCentroidsOfFeatures: null,
      featureCount: 2801,
      featureCountTotal: 3212,
      activeCountryProperties: null,
      viewFilter: 'all'
    };
  },

  fetchData: function () {
    this.setState({fetchingData: true});

    Promise.all([
      fetch(mapTopoJSON)
      .then(response => {
        if (response.status >= 400) {
          throw new Error('Bad response');
        }
        return response.json();
      }),

    ])
    .then(data => {
      let coreData = data[0];

      this.setState({
        fetchingData: false,
        fetchedData: true,
        mapTopoJSON: coreData
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

  closeClickHandler: function (e) {
    e.preventDefault();
    this.setState({ activeCountryProperties: null });
  },

  setCountriesStyle: function () {
    this.mapCountryLayer.eachLayer(this.setCountryStyle);
  },

  setCountryStyle: function (layer) {
    // Outer Boundary.
    if (layer.feature.properties.TYPE === 1) {
      layer.setStyle(this.layerStyles.ggwashGreyGreen);
      return;
    }

    // Inner Boundary.
    if (layer.feature.properties.TYPE === 0) {
      layer.setStyle(this.layerStyles.ggwashGreenGrey);
      return;
    }

    // Invalid.
    if (!layer.feature.properties.building) {
      layer.setStyle(this.layerStyles.active);
      return;
    }

    // // Blighted (or both)
    if (layer.feature.properties.building !== "yes") {
      layer.setStyle(this.layerStyles.blighted);
      return;
    }
    //
    // // Vacant
    // if (layer.feature.properties.building === "residential") {
    //   layer.setStyle(this.layerStyles.vacant);
    //   return;
    // }
    //
    // User generated vacant
    if (layer.feature.properties.building) {
      layer.setStyle(this.layerStyles.vacant);
      return;
    }

    // Default style.
    layer.setStyle(this.layerStyles.default);

    let lProps = layer.feature.properties;

    switch (this.state.viewFilter) {
      case 'ocds':
        if (_.find(lProps.publishers, {ocds_ongoing_data: true})) {
          layer.setStyle(this.layerStyles.lilac);
        } else if (_.find(lProps.publishers, {ocds_historic_data: true})) {
          layer.setStyle(this.layerStyles.orange);
        } else if (_.find(lProps.publishers, {ocds_implementation: true})) {
          layer.setStyle(this.layerStyles.teal);
        }
        break;
      case 'commitments':
        if (lProps.ogp_commitments && lProps.ogp_commitments.length) {
          layer.setStyle(this.layerStyles.darkorange);
        }
        break;
      case 'contracts':
        if (lProps.innovations && lProps.innovations.length) {
          layer.setStyle(this.layerStyles.blue);
        }
        break;
    }
  },

  onEachLayer: function (layer) {
    this.setCountryStyle(layer);

    layer
      .on('click', e => {
        if (layer.feature.properties.building === "yes") {
          return;
        }
        this.setState({
          activeCountryProperties: e.target.feature.properties
        });
      })
      .on('mousemove', e => {
        if (layer.feature.properties.building === "yes") {
          return;
        }
        // Don't act on the selected layer.
        if (e.target.feature.properties.iso_a2 !== _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
          e.target.setStyle(this.layerStyles.hover);
        }
      })
      .on('mouseout', e => {
        if (layer.feature.properties.building === "yes") {
          return;
        }
        // Don't act on the selected layer.
        if (e.target.feature.properties.iso_a2 !== _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
          this.setCountryStyle(e.target);
        }
      });
  },
  onMoveMap: function (e) {
    let centroidsOfFeatures = this.state.mapCentroidsOfFeatures;
    let bounds = e.target.getBounds();
    // [xLow, yLow, xHigh, yHigh]
    let boundsArray = [bounds._southWest.lng, bounds._southWest.lat ,bounds._northEast.lng ,bounds._northEast.lat];
    let turfBBoxPoly = turfFeaturecollection([turfBboxPolygon(boundsArray)]);
    let visiblePolyCentroids = turfWithin(centroidsOfFeatures,turfBBoxPoly);

    this.setState({
      featureCount: visiblePolyCentroids.features.length,
      featureCountTotal: centroidsOfFeatures.features.length
    });
  },

  setupMap: function () {
    var map = L.map(this.refs.mapHolder).setView([ -17.86,36.90], 16);
    var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '<a href="https://www.mapzen.com/rights">Attribution.</a>. Data &copy;<a href="https://openstreetmap.org/copyright">OSM</a> contributors.'
    });
    map.addLayer(layer);

    map.on('move', this.onMoveMap);

    var info = L.control({position: 'bottomleft'});

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info legend'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
        this._div.innerHTML = '<h4>Buildings</h4>'
        // + '<img src="https://raw.githubusercontent.com/thadk/oc-map/master/app/assets/images/ward.png" style="width: 10px; height: 10px"/> Ward boundary <br/>'
        + '<img src="https://raw.githubusercontent.com/thadk/oc-map/master/app/assets/images/vacant.png" style="width: 10px; height: 10px"/> Only basics<br/>'
        + '<img src="https://raw.githubusercontent.com/thadk/oc-map/master/app/assets/images/blighted.png" style="width: 10px; height: 10px"/> Extra information '
        ;
    };


    info.addTo(map);

    this.mapCountryLayer = omnivore.topojson.parse(this.state.mapTopoJSON)
      .eachLayer(this.onEachLayer)
      .addTo(map);

    let mapGeoJSON = this.mapCountryLayer.toGeoJSON();
    let centroidsOfFeatures = turfFeaturecollection(
      mapGeoJSON.features.map((o, i) => {
         return (turfCentroid(o));
       })
     );

     this.setState({
       mapExtractedGeoJSON: mapGeoJSON,
       mapCentroidsOfFeatures: centroidsOfFeatures
     });

    this.onMoveMap({target: map})

  },

  renderGGWash: function (plot) {

  var statusList = [];

  statusList.push(<li key="addy">Extra information: {plot.building}</li>);

  return <div><h3>Address</h3>
  <ul>
    {statusList}
  </ul>
  </div>;
},


  render: function () {
    if (!this.state.fetchedData && !this.state.fetchingData) {
      return null;
    }

    let plot = this.state.activeCountryProperties;

    return (
      <section className='ocp-map'>
        <header className='ocp-map__header'>
          <h1 className='ocp-map__title'>GGWash Vacant/Blight Map</h1>
          <div className='ocp-map__actions'>
          <div className="pull-right">
            {this.state.featureCount} of {this.state.featureCountTotal} showing
          </div>
            <span className='ocp-map__actions-description'>View to:</span>

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
          <div className={classnames('ocp-map__content-wrapper', {'ocp-revealed': plot !== null})}>
            {plot !== null ? (
            <div className='ocp-map__content'>
              <a href='#' className='ocp-map__button-close' onClick={this.closeClickHandler}><span>Close map content</span></a>
              {this.renderGGWash(plot)}
            </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }
});

module.exports = MapWidget;
