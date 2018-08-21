import { StackNavigator, SwitchNavigator } from 'react-navigation';
import { Home } from '../pages';

const ROUTES = {
    HOME: 'HOME'
}

const Navigator = SwitchNavigator({
    [ROUTES.HOME]: StackNavigator({
        [ROUTES.HOME]: {screen: Home}
    }, {
        headerMode: 'none'
    }),
})

Navigator.ROUTES = ROUTES

export default Navigator