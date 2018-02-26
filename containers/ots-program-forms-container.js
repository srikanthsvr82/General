import { connect } from 'react-redux';
import OTSProgramForms from 'ots-components/ots-program-forms/ots-program-forms';

function mapStateToProps( state ) {
    return {
        currentStep: state.navigation.currentStep
    }
}

const OTSProgramFormsContainer = connect( mapStateToProps )( OTSProgramForms );
export default OTSProgramFormsContainer;
