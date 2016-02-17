'use strict';
import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';

import reducer from './reducers/reducer';

import MapWidget from './views/map-widget';
import TableWidget from './views/table-widget';

// Sync dispatched route actions to the history
const finalCreateStore = compose(
  // Middleware you want to use in development:
  applyMiddleware(thunkMiddleware)
)(createStore);

const store = finalCreateStore(reducer);

window.OC_MAP = {
  initMapWidget: containerEl => {
    render((
      <Provider store={store}>
        <MapWidget />
      </Provider>
    ), containerEl);
  },

  initTableWidget: containerEl => {
    render((
      <Provider store={store}>
        <TableWidget />
      </Provider>
    ), containerEl);
  }
};
