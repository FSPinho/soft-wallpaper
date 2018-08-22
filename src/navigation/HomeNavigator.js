import React, { Component } from 'react';
import { translate } from 'react-i18next';
import { StackNavigator } from 'react-navigation';
import { WallpaperGenerator } from '../pages';
import { withTheme } from '../theme';

const ROUTES = {
    WALLPAPER_GENERATOR: 'WALLPAPER-GENERATOR',
    LOVED: 'LOVED',
}

class Navigator extends Component {

    constructor(props) {
        super(props)

        const { theme, t } = props

        // this.Navigator = createMaterialBottomTabNavigator({
        //     [ROUTES.WALLPAPER_GENERATOR]: StackNavigator({
        //         [ROUTES.WALLPAPER_GENERATOR]: { screen: WallpaperGenerator, title: t('tab-' + ROUTES.WALLPAPER_GENERATOR.toLowerCase()) },
        //     }),
        //     [ROUTES.LOVED]: StackNavigator({
        //         [ROUTES.LOVED]: { screen: Loved, title: t('tab-' + ROUTES.LOVED.toLowerCase()) },
        //     }),
        // }, {
        //         lazy: false,
        //         shifting: true,
        //         navigationOptions: ({ navigation }) => {
        //             const { routeName } = navigation.state;

        //             let iconName;
        //             let iconFocusedName;
        //             let tabBarColor;

        //             if (routeName === ROUTES.WALLPAPER_GENERATOR) {
        //                 iconFocusedName = 'ios-images'
        //                 iconName = 'ios-images-outline'
        //                 tabBarColor = theme.palette.Primary['500'].color
        //             } else if (routeName === ROUTES.LOVED) {
        //                 iconFocusedName = 'ios-heart'
        //                 iconName = 'ios-heart-outline'
        //                 tabBarColor = theme.palette.Accent.A200.color
        //             }

        //             return {
        //                 tabBarIcon: ({ focused, tintColor }) => <Icon size={23} name={focused ? iconFocusedName : iconName} color={tintColor} />,
        //                 tabBarLabel: t('tab-' + routeName.toLowerCase()),
        //                 tabBarColor
        //             }
        //         }
        //     })
        this.Navigator = StackNavigator({
            [ROUTES.WALLPAPER_GENERATOR]: { screen: WallpaperGenerator, title: t('tab-' + ROUTES.WALLPAPER_GENERATOR.toLowerCase()) },
        })
    }

    render() {
        return <this.Navigator />
    }

}

const Wrapper = translate('common')(withTheme({}, Navigator))
Wrapper.ROUTES = ROUTES

export default Wrapper