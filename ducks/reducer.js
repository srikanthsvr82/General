import { combineReducers } from 'redux';
import { reducer as reduxFormReducer } from 'redux-form';
import audienceReducer, { UPDATE_PARTNERS } from 'ots-ducks/audience-dux';
import billCodeOptionsReducer from 'redux-shared/billcode/billcode-options-dux';
import clientListReducer from 'redux-shared/client/client-list-dux';
import clientReducer from 'redux-shared/client/client-dux';
import datesReducer from 'rec-ducks/dates-dux';
import navigationReducer from 'ots-ducks/navigation-dux';
import programBasicsReducer from '../ducks/program-basics-dux';
import ProgramPageReducer from '../../redux-shared/cancel-button/program-page-dux';
import pageReducer from 'gq-ducks/page-dux';


const DEFAULT = {};
export function clearState(state = DEFAULT , action) {
    switch (action.type) {
        default:
            return state;
    }
}

export default combineReducers({
    audience: audienceReducer,
    billCodeOptions: billCodeOptionsReducer,
    client: clientReducer,
    clientList: clientListReducer,
    dates: datesReducer,
    form: reduxFormReducer.plugin({
    }),
    navigation: navigationReducer,
    page: pageReducer,
    ProgramPage: ProgramPageReducer,
    programBasics: programBasicsReducer
});
