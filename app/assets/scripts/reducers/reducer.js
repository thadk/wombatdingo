import _ from 'lodash';
import { combineReducers } from 'redux';
import * as actions from '../actions/action-types';

const ocStatus = function (state = {items: [], fetching: false, fetched: false}, action) {
  switch (action.type) {
    case actions.REQUEST_FORMS:
      console.log('REQUEST_FORMS');
      state = _.cloneDeep(state);
      state.fetching = true;
      break;
    case actions.RECEIVE_FORMS:
      console.log('RECEIVE_FORMS');
      state = _.cloneDeep(state);
      state.items = action.items;
      state.fetching = false;
      state.fetched = true;
      break;
  }
  return state;
};

export default combineReducers({
  ocStatus
});
