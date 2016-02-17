import fetch from 'isomorphic-fetch';
import * as actions from './action-types';
import config from '../config';

// ////////////////////////////////////////////////////////////////////////////
// //// Fetch Forms Thunk

function requestOcStatus () {
  return {
    type: actions.REQUEST_OC_STATUS
  };
}

function receiveOcStatus (json) {
  return {
    type: actions.RECEIVE_OC_STATUS,
    items: json.forms,
    receivedAt: Date.now()
  };
}

export function fetchOcStatus () {
  return dispatch => {
    dispatch(requestOcStatus());

    return fetch(`${config.api}/forms`)
      .then(response => response.json())
      .then(json => {
        dispatch(receiveOcStatus(json));
      })
      .catch(e => {
        // TODO: Handle Error.
        throw e;
      });
  };
}
