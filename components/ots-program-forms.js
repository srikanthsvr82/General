import React, { Component } from 'react';

import ProgramBasicsContainer from 'ots-containers/program-basics/program-basics-container';
import DatesContainer from 'rec-containers/dates/dates-container';
import AudienceContainer from 'ots-containers/audience/audience-container';

import './ots-program-forms.scss';

export default class OTSProgramForms extends Component {
    render() {
        const { currentStep } = this.props;
        let currentSection;

        switch ( currentStep ? currentStep.order : -1 ) {
            case 0:
                currentSection = <ProgramBasicsContainer />;
                break;
            case 1:
                currentSection = <DatesContainer />;
                break;
            case 2:
                currentSection = <AudienceContainer />;
                break;
            default:
        }

        return (
            <div className="ots-program-forms">
                <div className="row">
                    <div className="col-xs-12">
                        { currentSection }
                    </div>
                </div>
            </div>
        );
    }
}
