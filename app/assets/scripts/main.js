'use strict';
import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';

import MapWidget from './views/map-widget';
import TableWidget from './views/table-widget';

window.OC_MAP = {
  initMapWidget: containerEl => {
    render((
      <MapWidget />
    ), containerEl);
  },

  initTableWidget: containerEl => {
    render((
      <TableWidget />
    ), containerEl);
  }
};
