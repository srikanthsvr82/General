import fetch from 'actions-stores/shared/fetch';
import { clearState } from 'rec-ducks/reducer';
import queryString from 'query-string';
import { fetchBillCodeOptions } from 'redux-shared/billcode/billcode-options-dux';
import { fetchDates } from 'rec-ducks/dates-dux';
import { fetchProgramAudiences } from 'rec-ducks/audience-dux';
import { actions as PageActions } from 'gq-ducks/page-dux';

export const PROGRAM_STATUS = {
    COMPLETE: 'complete',
    INCOMPLETE: 'incomplete'
};

/**** Action Types ****/
const SET_PROGRAM_NAME = 'SET_PROGRAM_NAME';
const SET_TOGGLE_DATA = 'SET_TOGGLE_DATA';
const SET_BILLCODE_DATA = 'SET_BILLCODE_DATA';
const SET_UPDATED_BATCH_DETAILS = 'SET_UPDATED_BATCH_DETAILS';
const UPDATE_BATCH_DATA = 'UPDATE_BATCH_DATA';
const SET_SHOW_BATCH_FLAG = 'SET_SHOW_BATCH_FLAG';
const SET_UPDATED_BATCH_DESC = 'SET_UPDATED_BATCH_DESC';
const SET_UPDATED_BATCH_DESC_LOCALES = 'SET_UPDATED_BATCH_DESC_LOCALES';
const PROGRAM_BASICS_SET_PROGRAM_STATUS = 'PROGRAM_BASICS_SET_PROGRAM_STATUS';

/**
 * REDUCERS
 */

const parsedQueryString = queryString.parse( location.search );

// initial State will have 10 bill codes with empty values to create 10 drop downs
let billCodes = [];
for ( var i = 0; i < 10; i++ ) {
    billCodes.push( {
        id: i + 1,
        sortOrder: i + 1,
        billCode: '',
        customValue: ''
    } )
}

const initialState = {
    env: window.location.hostname.search( 'pprd') != -1 ? 'pprd' : window.location.hostname.search( 'qa' ) != -1 ? 'qa' : window.location.hostname === 'localhost' ? 'qa' : 'prod' ,
    programId: parsedQueryString.programId,
    programNumber: parsedQueryString.programNumber,
    programStatus: PROGRAM_STATUS.INCOMPLETE,
    programType: 'ots',
    showBatchFlag: null,
    tableData: {
        rows: [],
        meta: {
            rowCount: 0,
            rowsPerPage: 0,
            page: 1,
            totalPages: 1,
            sortedOn : null,
            sortedOrder: 'descending',
            downloadLinks: false
        },
        invalidProgramNumber: false
    },
    billCodes: billCodes
};

export default function reducer ( state = initialState, action ) {

    const newState = clearState( state, action );
    switch( action.type ) {

        case PROGRAM_BASICS_SET_DATA:
            return {
                ...newState,
                ...action.newData
            };

        case PROGRAM_FAILED_BATCH_DATA:
            return {
                ...newState,
                programDescription: '',
                tableData: {
                    rows: [],
                    meta: {},
                    invalidProgramNumber: true
                }
            };

        case PROGRAM_SET_TOKEN:
            return {
                ...newState,
                token: action.token
            };

        case PROGRAM_SET_BATCH_DATA:
            return {
                ...newState,

                tableData: {
                    rows: action.batchData.batches.map( ( batch, index ) => {

                        const updatedBillCodes = state.billCodes.filter( billCode => {
                            const upBillCode = batch.billCodes.find( code => {
                                return ( code.sortOrder === billCode.sortOrder );
                            } );

                            return !upBillCode;
                        } );

                        const tempBillCodes = [ ...batch.billCodes , ...updatedBillCodes ].sort( ( a, b ) => a.sortOrder > b.sortOrder );

                        const billCodeOptions =  JSON.parse( sessionStorage.billCodeOptions );

                        const newBillCodes = tempBillCodes.map( bc => {
                            return {
                                ...bc,
                                billCodeLabel: ( billCodeOptions.find( b => bc.billCode === b.key ) || {} ).label
                            }
                        } );

                        // look for the correct default media label
                        const defaultLocale = JSON.parse( sessionStorage.defaultLocale );

                        let tempBatchDescription = batch.batchDescription.find( item => item.locale ===  defaultLocale.key );
                        if ( !tempBatchDescription ) {
                                // if for some reason default locale doesn't exist, set a default
                                tempBatchDescription = {
                                    displayName: defaultLocale.label,
                                    locale: defaultLocale.key,
                                    cmText: 'OTS Cards'
                                }
                        }

                        const tempBatchDescriptionLocales = batch.batchDescription.filter( item => item.locale !== defaultLocale.key );

                        return {
                            batchNumber: batch.batchNumber,
                            batchDescription: tempBatchDescription,
                            batchDescriptionLocales: tempBatchDescriptionLocales,
                            billCodes: newBillCodes,
                            isBillCodesActive: batch.isBillCodesActive
                        } } ),
                    meta: {
                        downloadLinks: false,
                        page : 1,
                        rowCount : action.batchData.batches.length,
                        rowsPerPage : 50,
                        sortedOn : null,
                        sortedOrder : 'descending',
                        totalPages : action.batchData.batches.length / 50 + ( action.batchData.batches.length % 50 ? 1 : 0),
                    },
                    invalidProgramNumber: false
                },
                programNumber: action.batchData.programNumber,
                clientName: action.batchData.clientName,
                programDescription: action.batchData.programDescription
            };

        case SET_UPDATED_BATCH_DETAILS:
            return {
                ...newState,
                batchDetails: action.batchDetails,
                showBatchFlag: true
            };

        case SET_UPDATED_BATCH_DESC:
            let modifiedBatchDetails = Object.assign( {},state.batchDetails );

            modifiedBatchDetails.batchDescription = action.batchDescription;

            return {
                ...newState,
                batchDetails: modifiedBatchDetails
            };

        case SET_UPDATED_BATCH_DESC_LOCALES:

            const formattedBatchDescLocales = action.batchDescriptionLocales.map( bc => {
                return {
                    cmText: bc.value ? bc.value : bc.cmText,
                    displayName: bc.displayName,
                    locale: bc.locale
                }
            } );

            let UpdatedBatchDetails = Object.assign( {}, state.batchDetails );

            UpdatedBatchDetails.batchDescriptionLocales = formattedBatchDescLocales;

            return {
                ...newState,
                batchDetails: UpdatedBatchDetails
            };

        case SET_TOGGLE_DATA:

            let modifiedBatchData = Object.assign( {}, state.batchDetails );

            modifiedBatchData[ action.toggleData.name ] = action.toggleData.flag;

            return {
                ...newState,
                batchDetails: modifiedBatchData
            };

        case SET_BILLCODE_DATA:
            let ModifiedBillCodeBatchData = JSON.parse( JSON.stringify( state.batchDetails ) );

            const index = ModifiedBillCodeBatchData.billCodes.findIndex( item => item.sortOrder === action.billCode.sortOrder );

            if( action.name === 'customValue' ) {
                ModifiedBillCodeBatchData.billCodes[ index ].customValue = action.value;
                ModifiedBillCodeBatchData.billCodes[ index ].billCodeLabel = action.billCode.billCodeLabel;
                ModifiedBillCodeBatchData.billCodes[ index ].customvalueError = action.billCode.customValueError;

            } else {
                ModifiedBillCodeBatchData.billCodes[ index ].billCode = action.value;
                ModifiedBillCodeBatchData.billCodes[ index ].customValue = '';
                ModifiedBillCodeBatchData.billCodes[ index ].billCodeLabel = action.billCode.billCodeLabel;
                ModifiedBillCodeBatchData.billCodes[ index ].billCodeError = action.billCode.billCodeError;
            }

            /****** Validations for bill codes *****/
            ModifiedBillCodeBatchData.billCodes.forEach( ( b, index ) => {

                if( b.billCode !== '' ) {
                    ModifiedBillCodeBatchData.billCodes[ index ].billCodeError = '';
                    ModifiedBillCodeBatchData.billCodes[ index ].customValueError = '';
                }
                if( b.billCode && b.billCode !== 'customvalue' &&
                    ModifiedBillCodeBatchData.billCodes.some( fb => fb.sortOrder !== b.sortOrder && fb.billCode === b.billCode ) ) {
                    b.billCodeError = 'Duplicate BillCode Selected';
                }else if ( b.billCode === 'customvalue' && b.customValue &&
                    ModifiedBillCodeBatchData.billCodes.some( fb => fb.sortOrder !== b.sortOrder && fb.customValue !== null && ( fb.customValue && fb.customValue.toLowerCase() === b.customValue.toLowerCase() ) ) ) {
                    b.customValueError = 'Duplicate Custom Value';
                }

                if ( b.billCode === 'customvalue' && !b.customValue ) {
                    b.customValueError = 'Field Required';
                }
                else if ( b.billCode === 'customvalue' && b.customValue && b.customValue.length > 25 ) {
                    b.customValueError = 'Maximum Length is 25 Characters';
                }
            } );

            return {
                ...newState,
                batchDetails: ModifiedBillCodeBatchData
            };

        case PROGRAM_BASICS_SET_PROGRAM_STATUS:
            return {
                ...newState,
                programStatus: action.status
            };

        case UPDATE_BATCH_DATA:
            let updatedTableData = JSON.parse( JSON.stringify( state.tableData ) );

            const i = updatedTableData.rows.findIndex( row => row.batchNumber === action.batchData.batchNumber );
         
            if ( !action.batchData.isBillCodesActive ) {
                action.batchData.billCodes.forEach( ( billCode ) => {
                    billCode.billCode = '';
                    billCode.customValue = null;
                    billCode.billCodeLabel = null;
                } );
            }

            updatedTableData.rows[ i ] = action.batchData;

            return {
                ...newState,
                tableData: updatedTableData,
                showBatchFlag: false
            };

        case SET_PROGRAM_NAME:
            return {
                ...newState,
                ...action.data
            };

        case SET_SHOW_BATCH_FLAG:
            return {
                ...newState,
                ...action.flag
            };

        default:
            return newState;
    }
}

/**
 * ACTIONS
 */


export const updateBatchDetails = ( batchDetails ) => {
    return {
        type: SET_UPDATED_BATCH_DETAILS,
        batchDetails
    };
};

export const updateShowBatchFlag = ( flag ) => {
    return {
        type: SET_SHOW_BATCH_FLAG,
        flag
    };
};

export const updateBatchDescription = ( batchDescription ) => {
    return {
        type: SET_UPDATED_BATCH_DESC,
        batchDescription
    };
};

export const updateBatchDescLocales = ( batchDescriptionLocales ) => {
    return {
        type: SET_UPDATED_BATCH_DESC_LOCALES,
        batchDescriptionLocales
    };
};

export const toggleChange = ( toggleData ) => {
    return {
        type: SET_TOGGLE_DATA,
        toggleData
    };
};

export const updateBatchData = ( batchData ) => {
    return {
        type: UPDATE_BATCH_DATA,
        batchData
    };
};

export const updateBillCode = ( value, billCode, name ) => {
    return {
        type: SET_BILLCODE_DATA,
        name,
        value,
        billCode
    };
};

export const programNameChange = ( data ) => {
    return {
        type: SET_PROGRAM_NAME,
        data
    };
};

const setProgramStatus = ( status ) => {
    return {
        type: PROGRAM_BASICS_SET_PROGRAM_STATUS,
        status
    };
};

export function saveProgramStatus ( status ) {
    return ( dispatch, getState ) => {
        const state = getState();
        const body = {
            programId: state.programBasics.programId,
            status,
            programType: state.programBasics.programType
        };
        return fetch( '/hcadmin/services/v1.0/program/status', { method: 'post', body } )
            .then( ( ProgramStatusUpdateValidationErrorResponse ) => {
                if ( ProgramStatusUpdateValidationErrorResponse.errorMessages.length === 0 || status !== PROGRAM_STATUS.COMPLETE /* ignore errors if we aren't trying to set to complete */) {
                    dispatch( setProgramStatus( status ) );
                } else {
                    ProgramStatusUpdateValidationErrorResponse.errorMessages.forEach( error => {
                        dispatch( PageActions.error( error ) );
                    } );
                    throw new Error( `Program status can't be set to "${ status }". ${ ProgramStatusUpdateValidationErrorResponse.errorMessages.join( ' ' ) }` );
                }
            } );
    };
}

export function fetchToken() {
    return ( dispatch ) => {
        return fetch( `/hcadmin/services/v1.0/jwt/token` )
            .then ( response => {
                dispatch( setToken( response.result ) );
        } )
    };
}

export function fetchBatchData() {
    return ( dispatch, getState ) => {
        const state = getState();

        !state.page.busy && dispatch( PageActions.busy( true ) );

        const env = ( state.programBasics.env.toLowerCase() === 'prod' ? '' : state.programBasics.env + '.' );
        const url = `https://${ env }api.biw.cloud/v1/ots/programs/${ state.programBasics.programNumber }`;
        
        return fetch( url,
            {  headers: { 'authorization': `Bearer ${ state.programBasics.token }`, 'ots-errors': 'text' }
            } )
            .then( ( response ) => {
                dispatch( setBatchData( response ) );
            } ).catch( error => {
                dispatch( failedBatchData( error ) );
            } ).then( () => {
                dispatch( PageActions.busy( false ) );
            } );
    };
}

export function fetchProgramBasics() {
    return ( dispatch, getState ) => {
        const state = getState();
        if ( state.programBasics.programId ) {
            dispatch( PageActions.busy( true ) );

            return fetch( `/hcadmin/services/v1.0/ots/program/${ state.programBasics.programId }/basics` )
                .then( ( ProgramGeneralResponse ) => {
                    dispatch( setProgramBasicsData( ProgramGeneralResponse ) );
                } )
                .then( () => {
                    return dispatch( fetchToken() );
                } )
                .then( () => {
                    return dispatch( fetchBatchData() );
                } ).catch( () => {
                    dispatch( PageActions.busy( false ) );
                } );
        }else {
            return dispatch( fetchToken() )
                .then ( () => {
                    dispatch( fetchBatchData() );
                } )
        }
    };
}

export const PROGRAM_SET_TOKEN = 'PROGRAM_SET_TOKEN';
export function setToken( token ) {
    return {
        type: PROGRAM_SET_TOKEN,
        token
    }
}

export const PROGRAM_SET_BATCH_DATA = 'PROGRAM_SET_BATCH_DATA';
export function setBatchData( batchData ) {
    return {
        type: PROGRAM_SET_BATCH_DATA,
        batchData
    }
}

export const PROGRAM_FAILED_BATCH_DATA = 'PROGRAM_FAILED_BATCH_DATA';
export function failedBatchData( error ) {
    return {
        type: PROGRAM_FAILED_BATCH_DATA,
        error
    }
}

export const PROGRAM_BASICS_SET_DATA = 'PROGRAM_BASICS_SET_DATA';
export function setProgramBasicsData( newData ) {
    return {
        type: PROGRAM_BASICS_SET_DATA,
        newData
    }
}

export function saveBatchInfo( BatchDetailsRequest ) {
    return ( dispatch, getState ) => {

        dispatch( PageActions.busy( true ) );

        const state = getState();

        const env = ( state.programBasics.env.toLowerCase() === 'prod' ? '' : state.programBasics.env + '.' );
        const url = `https://${ env }api.biw.cloud/v1/ots/programs/${ state.programBasics.programNumber }`;

        return fetch( url,
            {
                method: 'post',
                body: BatchDetailsRequest,
                headers: {
                    'authorization': `Bearer ${ state.programBasics.token }`,
                    'ots-errors': 'text',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            } )
            .then( ( ProgramGeneralResponse  ) => {
                dispatch( setProgramBasicsData( ProgramGeneralResponse ) );
            } )
            .then( () => {
                dispatch( PageActions.busy( false ) );
            } );
    };
}

export function saveProgramBasics( ProgramGeneralRequest ) {
    return ( dispatch, getState ) => {
        const state = getState();
        return fetch( `/hcadmin/services/v1.0/ots/program/basics`, { method: 'post', body: ProgramGeneralRequest } )
            .then( ( ProgramGeneralResponse  ) => {
                if ( history.pushState ) {
                    var newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + `?mode=edit&programId=${ ProgramGeneralResponse.programId }&programType=ots`;
                    window.history.pushState( { path:newUrl },'',newUrl );
                }
                dispatch( setProgramBasicsData( ProgramGeneralResponse ) );
            } );
    };
}

export const fetchProgramBasicsDependencies = () => {
    return ( dispatch ) => {
        return Promise.all( [
            dispatch( fetchBillCodeOptions() ),
            dispatch( fetchDates() ), // Not really a dependency, but need to show the data in the navigation
            dispatch( fetchProgramAudiences() )// Not really a dependency, but need to show the data in the navigation
        ] );
    };
};


