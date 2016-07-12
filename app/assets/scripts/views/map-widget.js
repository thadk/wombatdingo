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

const godiScores = 'http://index.okfn.org/api/entries.json';
const mapTopoJSON = 'https://raw.githubusercontent.com/thadk/oc-map/master/data/topojson/owners-wBlighted-target-only.json';
const dcBoundaryTopoJSON = 'https://raw.githubusercontent.com/thadk/oc-map/master/data/topojson/DC_Boundary_Lines.json';
const wardBoundaryTopoJSON = 'https://raw.githubusercontent.com/thadk/oc-map/master/data/topojson/DC_Ward_Boundary_Lines.json';
const geocodeEndpoint = 'http://ggwash-forms.herokuapp.com/geocode'
// const mapTopoSW = '/assets/topojson/quads/other/owners-wBlighted-SW.json';
// const mapTopoSE = '/assets/topojson/quads/other/owners-wBlighted-SE.json';
// const mapTopoNE = '/assets/topojson/quads/other/owners-wBlighted-NE.json';
// const mapTopoNW = '/assets/topojson/quads/other/owners-wBlighted-NW.json';
//const mapTopoJSON = 'https://raw.githubusercontent.com/open-contracting-partnership/ocp-data/publish/oc-status/_map.json';
const godiSlugs = 'http://index.okfn.org/api/places.json';

const viewFilterMatrix = {
  all: 'See Properties ˃˃'
};

const ocdsMatrix = {
  ocds_implementation: 'in implementation',
  ocds_historic_data: 'historic data',
  ocds_ongoing_data: 'ongoing data'
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
      dcBoundaryTopoJSON: null,
      mapTopoSW: null,
      mapTopoSE: null,
      mapTopoNW: null,
      mapTopoNE: null,
      godiScores: null,
      godiData: null,
      godiPlaces: null,
      featureCount: 801,
      featureCountTotal: 1212,
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

      fetch(dcBoundaryTopoJSON)
      .then(response => {
        if (response.status >= 400) {
          throw new Error('Bad response');
        }
        return response.json();
      }),

      fetch(wardBoundaryTopoJSON)
      .then(response => {
        if (response.status >= 400) {
          throw new Error('Bad response');
        }
        return response.json();
      })

      // fetch(mapTopoSE)
      // .then(response => {
      //   if (response.status >= 400) {
      //     throw new Error('Bad response');
      //   }
      //   return response.json();
      // }),
      //
      // fetch(mapTopoNW)
      // .then(response => {
      //   if (response.status >= 400) {
      //     throw new Error('Bad response');
      //   }
      //   return response.json();
      // }),
      //
      // fetch(mapTopoNE)
      // .then(response => {
      //   if (response.status >= 400) {
      //     throw new Error('Bad response');
      //   }
      //   return response.json();
      // }),

      // fetch(godiScores)
      // .then(response => {
      //   if (response.status >= 400) {
      //     throw new Error('Bad response');
      //   }
      //   return response.json();
      // }),
      //
      // fetch(godiSlugs)
      // .then(response => {
      //   if (response.status >= 400) {
      //     throw new Error('Bad response');
      //   }
      //   return response.json();
      // })
    ])
    .then(data => {
      let coreData = data[0];
      let dcBoundLines = data[1];
      let wardBoundLines = data[2];

      this.setState({
        fetchingData: false,
        fetchedData: true,
        mapTopoJSON: coreData,
        dcBoundaryTopoJSON: dcBoundLines,
        wardBoundaryTopoJSON: wardBoundLines
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
    if (!layer.feature.properties.GGStatus) {
      layer.setStyle(this.layerStyles.active);
      return;
    }

    // Blighted (or both)
    if (layer.feature.properties.GGStatus % 7 === 0 || layer.feature.properties.GGStatus === 12) {
      layer.setStyle(this.layerStyles.blighted);
      return;
    }

    // Vacant
    if (layer.feature.properties.GGStatus === 5) {
      layer.setStyle(this.layerStyles.vacant);
      return;
    }

    // User generated vacant
    if (layer.feature.properties.GGStatus === 9) {
      layer.setStyle(this.layerStyles.userVacant);
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
        if (!layer.feature.properties.GGStatus) {
          return;
        }
        this.setState({
          activeCountryProperties: e.target.feature.properties
        });
      })
      .on('mousemove', e => {
        if (!layer.feature.properties.GGStatus) {
          return;
        }
        // Don't act on the selected layer.
        if (e.target.feature.properties.iso_a2 !== _.get(this.state.activeCountryProperties, 'iso_a2', '')) {
          e.target.setStyle(this.layerStyles.hover);
        }
      })
      .on('mouseout', e => {
        if (!layer.feature.properties.GGStatus) {
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
    var map = L.map(this.refs.mapHolder).setView([ 38.9072,-77.0069], 13);
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
        this._div.innerHTML = '<h4>DC Properties</h4>'
        + '<img src="https://raw.githubusercontent.com/thadk/oc-map/master/app/assets/images/ward.png" style="width: 10px; height: 10px"/> Ward boundary <br/>'
        + '<img src="https://raw.githubusercontent.com/thadk/oc-map/master/app/assets/images/vacant.png" style="width: 10px; height: 10px"/> DC Vacant <br/>'
        + '<img src="https://raw.githubusercontent.com/thadk/oc-map/master/app/assets/images/blighted.png" style="width: 10px; height: 10px"/> DC Blighted'
        ;
    };


    info.addTo(map);

    function searchByAjax(text, callResponse)//callback for 3rd party ajax requests
    {

      return Promise.all([
        fetch(geocodeEndpoint,{
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            str: text,
            f: 'json',
          })
        })
        .then(response => {
          if (response.status >= 400) {
            throw new Error('Bad response');
          }
          return response.json();
        })
      ])
      .then(data => {
        let passThrough = [];
        if (data[0].returnDataset && data[0].returnDataset.Table1) {
          passThrough = data[0].returnDataset.Table1.map(n => ({loc: [n.LATITUDE,n.LONGITUDE], title: n.FULLADDRESS, SSL: n.SSL}) )
        }
        callResponse(passThrough);
      });

    }

    map.addControl( new L.Control.Search({
      sourceData: searchByAjax,
      text:'Find an address...',
      autoType: true,
      autoResize: false,
      minLength: 4,
      textErr: "Try another address",
      markerLocation: true,
      collapsed: false,
      circleLocation: false,
      markerIcon: new L.Icon({iconUrl:'https://raw.githubusercontent.com/thadk/oc-map/master/app/assets/images/marker-icon-highlight.png', iconSize: [25,41]})
    }) );

    this.wardBoundaryLayer = omnivore.topojson.parse(this.state.wardBoundaryTopoJSON)
      .eachLayer(this.onEachLayer)
      .addTo(map);

    this.dcBoundaryLayer = omnivore.topojson.parse(this.state.dcBoundaryTopoJSON)
      .eachLayer(this.onEachLayer)
      .addTo(map);

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

  // renderGodi: function (country) {
  //   let godi = this.state.godiData;
  //   let countryGodi = null;
  //   let godiPlaces = this.state.godiPlaces;
  //   let countryMeta = null;
  //
  //   countryGodi = _.find(godi, {'place': country.iso_a2.toLowerCase(), 'dataset': 'procurement'});
  //   countryMeta = _.find(godiPlaces, {'id': country.iso_a2.toLowerCase()});
  //
  //   if (!countryGodi || !countryMeta) {
  //     return;
  //   }
  //   return <p className='godi'>Transparency of Tenders & Awards: <a href={'http://index.okfn.org/place/' + countryMeta.slug} target='_blank'>{countryGodi.score}%</a></p>;
  // },

  // renderPublisher: function (publishers) {
  //   if (!publishers.length) {
  //     return <div><h3>Publishing open contracting data</h3><p>No entity publishing data yet</p></div>;
  //   }
  //
  //   let content = _.map(publishers, (o, i) => {
  //     var status = [];
  //     _.forEach(ocdsMatrix, (str, idx) => {
  //       if (o[idx]) { status.push(str); }
  //     });
  //     var statusStr = status.join(', ');
  //     return (
  //       <li key={i}><a href={o.publisher_link} target='_blank'>{o.publisher}</a>:
  //         {statusStr ? <span> {statusStr}</span> : null}
  //       </li>
  //     );
  //   });
  //   return <div><h3>Publishing open contracting data</h3><ul>{content}</ul></div>;
  // },
  //
  // renderInnovations: function (innovations) {
  //   if (!innovations.length) {
  //     return;
  //   }
  //
  //   let content = _.map(innovations, (o, i) => {
  //     return (
  //       <li key={i}><a href={o.innovation_link} target='_blank'>{o.innovation_description}</a></li>
  //     );
  //   });
  //
  //   return <div><h3>Innovations in contract monitoring and data use</h3><ul>{content}</ul></div>;
  // },
  renderGGWash: function (plot) {

    var statusList = [];
    if (plot.GGStatus % 5 === 0 || plot.GGStatus === 12 ) {
      var vacant = 'Was marked as Vacant by DC in late 2015';
      statusList.push(<li key="vacant">{vacant}</li>);
    } else if (plot.GGStatus % 7 === 0 ) {
      var blighted = 'Was marked as Blighted by DC in late 2015';
      statusList.push(<li key="blighted">{blighted}</li>);
    }

    statusList.push(<li key="addy">Address: {plot.PREMISEADD}</li>);
    statusList.push(<li key="addy-link"><a target="_new" href={'https://www.google.com/maps/place/'+plot.PREMISEADD+', DC'}><button>View on Google Maps</button></a></li>);

    return <div><h3>Vacant/Blighted Property</h3>
    <ul>
      {statusList}
    </ul>
    </div>;
  },


  // renderCommitments: function (country) {
  //   if (!(country.ogp_commitments.length) && (!(country.commitment_oil_mining) || country.commitment_oil_mining === 'none')) {
  //     return;
  //   }
  //
  //   let content_ogp = _.map(country.ogp_commitments, (o, i) => {
  //     return (
  //       <li key={i}>OGP: <a href={o.ogp_commitment_link} target='_blank'>{o.ogp_commitment}</a></li>
  //     );
  //   });
  //
  //   let content;
  //   if (country.commitment_oil_mining) {
  //     if (country.commitment_oil_mining) {
  //       content = <li>Oil and Mining: <a href={country.commitment_oil_mining_link} target='_blank'>{country.commitment_oil_mining}</a></li>;
  //     } else {
  //       content = <li>Oil and Mining: {country.commitment_oil_mining}</li>;
  //     }
  //   }
  //
  //   return <div><h3>Commitments</h3><ul>{content_ogp}{content}</ul></div>;
  // },

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
