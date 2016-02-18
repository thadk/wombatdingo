'use strict';
import React from 'react';

var TableWidget = React.createClass({
  displayName: 'TableWidget',

  getInitialState: function () {
    return {
      fetchedData: false,
      fetchingData: false,
      sort: {
        field: 'name',
        order: 'asc'
      }
    };
  },

  componentDidMount: function () {
    this.setState({fetchingData: true});

    // Network request.
    setTimeout(() => {
      this.setState({fetchingData: false, fetchedData: true});
    }, 1000);
  },

  sortLinkClickHandler: function (field, e) {
    e.preventDefault();
    let {field: sortField, order: sortOrder} = this.state.sort;
    let order = 'asc';
    // Same field, switch order.
    if (sortField === field) {
      order = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    // Different field, reset order.
    this.setState({sort: {
      field,
      order
    }});
  },

  renderTableHead: function () {
    return (
      <thead>
        <tr>
          <th><a href=''>Country</a></th>
          <th><a href=''>Population</a></th>
        </tr>
      </thead>
    );
  },

  renderTableBody: function () {
    return (
      <tbody>
        <tr>
          <td>Portugal</td>
          <td>10M</td>
        </tr>
        <tr>
          <td>Spain</td>
          <td></td>
        </tr>
      </tbody>
    );
  },

  render: function () {
    if (!this.state.fetchedData && !this.state.fetchingData) {
      return null;
    }

    return (
      <section className='ocp-table'>
        <header className='ocp-table__header'>
          <h1 className='ocp-table__title'>Open Contracting Table</h1>
        </header>
        <div className='ocp-table__body'>
          <table className='table'>
            {this.renderTableHead()}
            {this.renderTableBody()}
          </table>
        </div>
      </section>
    );
  }
});

module.exports = TableWidget;
