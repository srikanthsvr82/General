import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import configureStore from './store/configure-ots-setup-store';
import NavigationContainer from 'ots-containers/navigation/navigation-container';
import OTSProgramFormsContainer from 'ots-containers/ots-program-forms/ots-program-forms-container';
import LoadingOverlay from '../components/shared/loading-overlay/loading-overlay.jsx';

// ReFlux stuff for header component
import Header from 'components/header/header.jsx';
import RootComponent from 'components/root/root.jsx';
import RootStore from 'actions-stores/root/root-store';
import HeaderStore from 'actions-stores/header/header-store';

// Actions needed to sync reflux store locales with redux store
import { setClientLocales, setClientRequestHeaders } from 'redux-shared/client/client-dux';

var rootStore = new RootStore (
    { name: 'header', store: HeaderStore }
);

class HeaderWrapper extends RootComponent {
    render () {
        return (
            <div>
                <Header { ...rootStore.state.header }/>
            </div>
        );
    }
}

class Entry extends Component {
    render() {
        const { clientId } = this.props;
        return (
            <div>
                <HeaderWrapper store={ rootStore }/>
                <div className="container">
                    <div className="row">
                        <h1 className="col-xs-12">OTS Card Setup</h1>
                        <p className="col-xs-8 text-justify">
                            { this.props.headerText.currentStep && this.props.headerText.currentStep.headerText }
                        </p>
                    </div>
                    {
                        clientId
                            ? (
                            <div className="row">
                                <div className="col-xs-3">
                                    <NavigationContainer />
                                </div>
                                <div className="col-xs-9">
                                    <OTSProgramFormsContainer />
                                </div>
                            </div>
                        )
                            : (
                            <div className="row">
                                <div className="col-xs-12">Loading client data...</div>
                            </div>
                        )
                    }
                </div>
                <LoadingOverlay loading={ this.props.busy } />
            </div>
        )
    }
}

Entry = connect(
    // mapStateToProps
    state => ( {
        clientId: state.client.clientId, headerText: state.navigation,
        busy: state.page.busy
    } ),
    // mapDispatchToProps
    dispatch => ( {} )
)( Entry );

// ReactDOM render
const reduxStore = configureStore();
function loadReduxState() {
    reduxStore.dispatch( setClientLocales( rootStore.state.header.client.locales ) );
    reduxStore.dispatch( setClientRequestHeaders( rootStore.state.header.client.clientId, rootStore.state.header.client.clientCode) );
}
// If we have locale data, then let the store know, otherwise listen for it
if ( rootStore.state.header.client.locales.length !== 0 ) {
    loadReduxState();
} else {
    const unsubscribeFromRootStore = rootStore.listen( state => {
        if ( state.header.client.locales.length !== 0 && reduxStore.getState().client.locales.length === 0 ) {
            loadReduxState();
            unsubscribeFromRootStore();
        }
    });
}

var appRoot = document.getElementById( 'app-root' );
ReactDOM.render( <Provider store={ reduxStore }><Entry /></Provider>, appRoot );
