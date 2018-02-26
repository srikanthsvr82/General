import fetch from 'actions-stores/shared/fetch';
import _ from 'lodash';
import { fetchClientAudienceList, CLIENT_AUDIENCE_LIST_SET } from 'redux-shared/client/client-dux';
import { actions as PageActions } from 'gq-ducks/page-dux';


export const initialState = {
    audienceOptions:[],
    initSelectValue: []
};

export default function reducer ( state = initialState, action ) {
    switch ( action.type ) {

        case PROGRAM_AUDIENCE_SET :
            let audienceSelects = [];

            if( action.newData.hasOwnProperty( 'receiverSpecifyAudience' ) ) {
                audienceSelects = action.newData.receiverSpecifyAudience.map( ( item ) => ({
                    value: item.id,
                    label: item.audienceName,
                    count: item.participantCount
                } ) );
            }

            return {
                ...state,
                initSelectValue : _.sortBy( audienceSelects,'label' ),
                audienceType: action.newData.receiverAudienceType,
                id: action.newData.programId
            };
            break;

        case CLIENT_AUDIENCE_LIST_SET:
            const audienceOptions = action.newData.map( ( option ) => {
                return {
                    value: option.id.toString(),
                    label: option.audienceName,
                    count: option.paxCount
                }
            } );

            return {
                ...state,
                audienceOptions: audienceOptions
            };
            break;

        case 'audience/saving':
            break;

        default:
            return {
                ...state,
            };
            break;
    }
}

export function fetchProgramAudiences () {
    return ( dispatch, getState ) => {
        const state = getState();
        if ( state.programBasics.programId ) {
            return fetch( `/hcadmin/services/v1.0/program/${ state.programBasics.programId }/audience` )
                .then( ( AudienceResponse ) => {
                    dispatch( setProgramAudiences( AudienceResponse ) );
                } );
        }
        return Promise.resolve();
    };
}

export const PROGRAM_AUDIENCE_SET = 'PROGRAM_AUDIENCE_SET';
export function setProgramAudiences ( newData ) {
    return {
        type: PROGRAM_AUDIENCE_SET,
        newData
    }
}

export function saveProgramAudiences ( depositAudiencesListRequest ) {
    return ( dispatch ) => {
        dispatch( PageActions.busy( true ) );

        return fetch( `/hcadmin/services/v1.0/program/audience`, { method: 'post', body: depositAudiencesListRequest } )
            .then( ( AudienceResponse  ) => {
                dispatch( setProgramAudiences( AudienceResponse ) );
            } )
            .then( () => {
                dispatch( PageActions.busy( false ) );
            } );
    };
}

export const fetchProgramAudiencesDependencies = () => {
    return ( dispatch, getState ) => {
        return Promise.all( [
            dispatch( fetchClientAudienceList() )
        ] );
    };
};
