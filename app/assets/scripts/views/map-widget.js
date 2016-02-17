'use strict';
import React from 'react';
import { connect } from 'react-redux';
// import { fetchForms } from '../actions/action-creators';

var MapWidget = React.createClass({
  displayName: 'MapWidget',

  propTypes: {
  },

  render: function () {
    return (
      <section>
        MapWidget
      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
  };
}

function dispatcher (dispatch) {
  return {
  };
}

module.exports = connect(selector, dispatcher)(MapWidget);
