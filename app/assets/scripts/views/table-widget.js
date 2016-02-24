'use strict';
import React from 'react';
import fetch from 'isomorphic-fetch';
import _ from 'lodash';
import classnames from 'classnames';

var TableWidget = React.createClass({
  displayName: 'TableWidget',

  getInitialState: function () {
    return {
      fetchedData: false,
      fetchingData: false,
      sort: {
        field: 'country',
        order: 'asc'
      },
      data: {}
    };
  },

  componentDidMount: function () {
    this.setState({fetchingData: true});
    // Network request.
    fetch('https://raw.githubusercontent.com/open-contracting-partnership/ocp-data/publish/oc-status/_table.json')
      .then(response => response.json())
      .then(response => {
        console.log('response', response);
        this.setState({
          fetchingData: false,
          fetchedData: true,
          data: response
        });
      });
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
          {_.map(this.state.data.meta.display, o => {
            let c = classnames('sort', {
              'sort--none': this.state.sort.field !== o.key,
              'sort--asc': this.state.sort.field === o.key && this.state.sort.order === 'asc',
              'sort--desc': this.state.sort.field === o.key && this.state.sort.order === 'desc'
            });
            return (
              <th key={o.key}><a href='' className={c} onClick={this.sortLinkClickHandler.bind(null, o.key)}>{o.value}</a></th>
            );
          })}
        </tr>
      </thead>
    );
  },

  renderTableBody: function () {
    let sorted = _(this.state.data.data).sortBy(this.state.sort.field);
    if (this.state.sort.order === 'desc') {
      sorted = sorted.reverse();
    }
    sorted = sorted.value();

    return (
      <tbody>
      {_.map(sorted, (o, i) => {
        return (
          <tr key={`tr-${i}-${_.kebabCase(o.country)}`}>
          {_.map(this.state.data.meta.display, d => {
            return (
              <td key={`tr-${i}-td-${_.kebabCase(d.key)}`}>{o[d.key]}</td>
            );
          })}
          </tr>
        );
      })}
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
          {this.state.fetchingData ? (
            <p>Loading data...</p>
          ) : (
          <table className='table'>
            {this.renderTableHead()}
            {this.renderTableBody()}
          </table>
          )}
        </div>
      </section>
    );
  }
});

module.exports = TableWidget;
