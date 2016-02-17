'use strict';
import React from 'react';
import { connect } from 'react-redux';
// import { fetchForms } from '../actions/action-creators';

var TableWidget = React.createClass({
  displayName: 'TableWidget',

  propTypes: {
  },

  render: function () {
    return (
      <section>
        TableWidget
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

module.exports = connect(selector, dispatcher)(TableWidget);
