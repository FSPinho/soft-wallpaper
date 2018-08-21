import React from 'react';
import { translate } from 'react-i18next';
import { HomeNavigator } from "../navigation";



class Home extends React.Component {

    componentWillMount() {
        /** ... */
    }

    componentWillUnmount() {
        /** ... */
    }

    render() {
        return (
            <HomeNavigator/>
        )
    }
}

export default translate('common')(Home)