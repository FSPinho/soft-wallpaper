import {SwitchNavigator, StackNavigator} from 'react-navigation'

import {Login, Home} from '../pages'


const ROUTES = {
    LOGIN: 'LOGIN',
    HOME: 'HOME'
}

const Navigator = SwitchNavigator({
    [ROUTES.LOGIN]: {screen: Login},
    [ROUTES.HOME]: StackNavigator({
        [ROUTES.HOME]: {screen: Home}
    }, {
        headerMode: 'none'
    }),
})

Navigator.ROUTES = ROUTES

export default Navigator