'use strict';
import React from 'react';

const Dropdown = React.createClass({
  displayName: 'Dropdown',

  propTypes: {
    className: React.PropTypes.string,
    triggerTitle: React.PropTypes.string,
    triggerClassName: React.PropTypes.string,
    triggerText: React.PropTypes.string,
    closeDropdown: React.PropTypes.func,
    children: React.PropTypes.node
  },

  _bodyListener: function (e) {
    // Get the dropdown that is a parent of the clicked element. If any.
    let theSelf = e.target;
    if (theSelf.tagName === 'HTML' || theSelf.tagName === 'BODY' || theSelf.getAttribute('data-hook') === 'dropdown:close') {
      this.setState({open: false});
      return;
    }

    do {
      if (theSelf && theSelf.getAttribute('data-hook') === 'dropdown') {
        break;
      }
      theSelf = theSelf.parentNode;
    } while (theSelf && theSelf.tagName !== 'BODY');

    if (theSelf !== this.refs.dropdown) {
      this.setState({open: false});
    }
  },

  getDefaultProps: function () {
    return {
      element: 'div',
      className: '',

      triggerTitle: '',
      triggerClassName: '',
      triggerText: ''
    };
  },

  getInitialState: function () {
    return {
      open: false
    };
  },

  // Lifecycle method.
  // Called once as soon as the component has a DOM representation.
  componentDidMount: function () {
    window.addEventListener('click', this._bodyListener);
  },

  // Lifecycle method.
  // Called once as soon as the component has a DOM representation.
  componentWillUnmount: function () {
    window.removeEventListener('click', this._bodyListener);
  },

  _toggleDropdown: function (e) {
    e.preventDefault();
    this.setState({ open: !this.state.open });
  },

  render: function () {
    var klasses = ['drop'];
    if (this.state.open) {
      klasses.push('drop--open');
    }
    if (this.props.className) {
      klasses.push(this.props.className);
    }

    return (
      <this.props.element className={klasses.join(' ')} data-hook='dropdown' ref='dropdown'>
        <a href='#' title={this.props.triggerTitle} className={this.props.triggerClassName} onClick={this._toggleDropdown}><span>{this.props.triggerText}</span></a>
        <div className='drop__content'>
          {this.props.children}
        </div>
      </this.props.element>
    );
  }
});

module.exports = Dropdown;
