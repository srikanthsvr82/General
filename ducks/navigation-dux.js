import fetch from 'actions-stores/shared/fetch';
import { fetchProgramBasics, fetchProgramBasicsDependencies } from './program-basics-dux';
import { fetchDates } from 'rec-ducks/dates-dux';
import { fetchProgramAudiences, fetchProgramAudiencesDependencies } from 'ots-ducks/audience-dux';
import { PROGRAM_STATUS } from 'ots-ducks/program-basics-dux';

export const NAV_STATUS = {
    UNSAVED: 1,
    LOCKED: 2,
    COMPLETE: 4,
    ERROR: 16
};

export const NAV_STEPS = {
    PROGRAM_BASICS: {
        order: 0,
        title: 'Program Basics',
        headerText: 'Complete the required Program Basics fields and then click on the Save & Next button to move onto the next step.',
        code: 'p',
        fetchAction: fetchProgramBasics,
        fetchDependenciesAction: fetchProgramBasicsDependencies,
        prerequisiteSteps: null
    },
    DATES: {
        order: 1,
        title: 'Dates',
        headerText: 'To select the Program Start and End Dates, click on the XX/XX/XXXX representing the date being setup. ' +
        'Use the calendar widget to select the appropriate date(s). ' +
        'Click the Save & Next button to continue. Program start and end dates determine when deposit files can be loaded and rules appear on website. ' +
        'An end date is not required for a deposit program. All dates are editable after the program is live.',
        code: 'd',
        fetchAction: fetchDates,
        fetchDependenciesAction: null,
        prerequisiteSteps: null
    },
    AUDIENCES: {
        order: 2,
        title: 'Audiences',
        headerText: 'Using the Audiences setup on the Audience Definition page, select the appropriate PRO Accounts Audience(s) from the dropdown menu. ' +
        'If you click on the “x” to the left of the audience name it will remove that audience. ' +
        'If you click on the “x” on the right side it will remove all audiences on the page. ' +
        'Click Save & Next button to continue. Audiences must first be defined on the Audience Definition page to appear in the audience dropdown. ' +
        'To define an audience, go to the Administration tab, select Audience Definition.',
        code: 'a',
        fetchAction: fetchProgramAudiences,
        fetchDependenciesAction: fetchProgramAudiencesDependencies,
        prerequisiteSteps: null
    }
};

NAV_STEPS.PROGRAM_BASICS.prerequisiteSteps = [];

NAV_STEPS.DATES.prerequisiteSteps = [
    NAV_STEPS.PROGRAM_BASICS
];

NAV_STEPS.AUDIENCES.prerequisiteSteps = [
    NAV_STEPS.DATES
];

const initialState = {
    currentStep: null,
    stageStatus: {
        [ NAV_STEPS.PROGRAM_BASICS.code ]: NAV_STATUS.UNSAVED,
        [ NAV_STEPS.DATES.code ]: NAV_STATUS.LOCKED,
        [ NAV_STEPS.AUDIENCES.code ]: NAV_STATUS.LOCKED
    }
};

export default function reducer( state = initialState, action ) {
    switch ( action.type ) {
        case SET_NAV_STAGE_STATUS:
            return {
                ...state,
                stageStatus: {
                    ...state.stageStatus,
                    ...action.newValue
                }
            };
        case NAVIGATION_SET_CURRENT_STEP:
            return {
                ...state,
                currentStep: action.step
            };
        default:
            return state;
    }
}


const NAVIGATION_SET_CURRENT_STEP = 'NAVIGATION_SET_CURRENT_STEP';
function setCurrentStep( step ) {
    return {
        type: NAVIGATION_SET_CURRENT_STEP,
        step
    };
}


export function saveErrorSteps( stepList ) {
    return ( dispatch, getState ) => {
        const state = getState();
        const newStageStatus = {
            ...state.navigation.stageStatus
        };
        stepList.forEach( step => {
            newStageStatus[ step.code ] = NAV_STATUS.ERROR;
        } );
        return dispatch( saveProgramNavigationStageStatus( newStageStatus ) );
    };
}


export function completeNavStep() {
    return ( dispatch, getState ) => {
        const state = getState();
        const step = state.navigation.currentStep;
        const newStageStatus = {
            ...state.navigation.stageStatus,
            [ step.code ]: NAV_STATUS.COMPLETE
        };
        const remainingOrderedSteps = Object.keys( NAV_STEPS ).map( key => NAV_STEPS[ key ] ).sort( ( a, b ) => a.order - b.order ).slice( step.order + 1 );
        remainingOrderedSteps.forEach( ( orderedStep, index ) => {
            const orderedStepStatus = newStageStatus[ orderedStep.code ];
            if ( orderedStepStatus !== NAV_STATUS.ERROR ) { // Only completing a step can change it's value from ERROR
                if ( haveStatus( NAV_STATUS.LOCKED, orderedStep.prerequisiteSteps, newStageStatus ) || haveStatus( NAV_STATUS.UNSAVED, orderedStep.prerequisiteSteps, newStageStatus ) ) {
                    // If any prereqs are locked, this step must be locked
                    newStageStatus[ orderedStep.code ] = NAV_STATUS.LOCKED;
                } else if ( orderedStepStatus !== NAV_STATUS.COMPLETE ) {
                    newStageStatus[ orderedStep.code ] = NAV_STATUS.UNSAVED;
                }
            }
        } );

        return dispatch( saveProgramNavigationStageStatus( newStageStatus ) );
    };
}

const SET_NAV_STAGE_STATUS = 'SET_NAV_STAGE_STATUS';
function setProgramNavigationStageStatus( newValue ) {
    return {
        type: SET_NAV_STAGE_STATUS,
        newValue: JSON.parse( newValue.replace( /\&quot\;/g, '"' ) )
    };
}


export function saveProgramNavigationStageStatus( newStageStatus ) {
    return ( dispatch, getState ) => {
        const state = getState();
        const ProgramStageRequest = {
            programId: state.programBasics.programId,
            stageStatus: JSON.stringify( newStageStatus )
        };
        return fetch( '/hcadmin/services/v1.0/program/stageStatus', { method: 'post', body: ProgramStageRequest } )
            .then( StringResult => {
                dispatch( setProgramNavigationStageStatus( StringResult.result ) );
            } );
    };
}



const haveStatus = ( status, stepList, stageStatus ) => {
    return !!( stepList.find( step => stageStatus[ step.code ] === status ) );
};


export function fetchProgramNavigationStageStatus() {
    return ( dispatch, getState ) => {
        const state = getState();
        if ( state.programBasics.programId ) {
            return fetch( `/hcadmin/services/v1.0/program/stageStatus/${ state.programBasics.programId }` )
                .then( StringResult => {
                    dispatch( setProgramNavigationStageStatus( StringResult.result ) );
                } );
        }
        return Promise.resolve();
    };
}


export function navigate ( step ) {
    return ( dispatch, getState ) => {

        const state = getState(),
            programId = state.programBasics.programId,
            fetchDependenciesAction = step.fetchDependenciesAction ? step.fetchDependenciesAction : () => () => { return Promise.resolve(); },
            fetchAction = step.fetchAction;


        return dispatch( fetchDependenciesAction() )
            .then( () => {
                return dispatch( fetchAction() );
            } )
            .then( () => {
                return dispatch( setCurrentStep( step ) );
            } );
    };
}

export function navigateNext () {
    return ( dispatch, getState ) => {
        const state = getState(),
            nextStepOrder = state.navigation.currentStep === null ? 0 : state.navigation.currentStep.order + 1;
        return dispatch( navigate( getStepByOrder( nextStepOrder ) ) );
    };
}


const getStepsAsArray = () => Object.keys( NAV_STEPS ).map( key => NAV_STEPS[ key ] );
const getStepByOrder = order => getStepsAsArray().find( step => step.order === order );

export const allExceptLastStepsComplete = ( state ) => {
    const steps = Object.keys( NAV_STEPS ).map( key => NAV_STEPS[ key ] ),
        maxOrder = Math.max( ...steps.map( step => step.order ) ),
        lastStepCode = steps.find( step => step.order === maxOrder ).code;
    return Object.keys( state.stageStatus )
            .filter( key => key !== lastStepCode )
            .map( key => state.stageStatus[ key ] )
            .filter( status => status !== NAV_STATUS.COMPLETE ).length === 0;
};

