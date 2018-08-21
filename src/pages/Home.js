import React from 'react'
import {translate} from 'react-i18next'
import FireBase from 'react-native-firebase'

import {HomeNavigator, RootNavigator} from "../navigation"


class Home extends React.Component {

    componentWillMount() {
        this.unsubscribe = FireBase.auth().onAuthStateChanged(user => {
            if (!user) {
                console.log("Home:onAuthStateChanged - User was signed out")
                this.props.navigation.navigate(RootNavigator.ROUTES.LOGIN)
            }
        })
    }

    componentWillUnmount() {
        if (this.unsubscribe)
            this.unsubscribe()
    }

    render() {
        return (
            <HomeNavigator/>
        )
    }
}

export default translate('common')(Home)