import React, { Component } from 'react';
import { translate } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { StackNavigator } from 'react-navigation';
import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs';
import { AddBreak, AddMeeting, AddParticipant, Meetings, Profile, Schedule } from '../pages';
import { withTheme } from '../theme';

const ROUTES = {
    SCHEDULE: 'SCHEDULE',
    ADD_BREAK: 'ADD BREAK',
    MEETINGS: 'MEETINGS',
    ADD_MEETING: 'ADD MEETING',
    ADD_PARTICIPANT: 'ADD PARTICIPANT',
    PROFILE: 'PROFILE',
}

class Navigator extends Component {

    constructor(props) {
        super(props)

        const { theme, t } = props

        this.Navigator = createMaterialBottomTabNavigator({
            [ROUTES.MEETINGS]: StackNavigator({
                [ROUTES.MEETINGS]: { screen: Meetings, title: t('tab-' + ROUTES.MEETINGS.toLowerCase()) },
                [ROUTES.ADD_MEETING]: { screen: AddMeeting, title: t('tab-' + ROUTES.ADD_MEETING.toLowerCase()) },
                [ROUTES.ADD_PARTICIPANT]: { screen: AddParticipant, title: t('tab-' + ROUTES.ADD_PARTICIPANT.toLowerCase()) },
            }),

            [ROUTES.SCHEDULE]: StackNavigator({
                [ROUTES.SCHEDULE]: { screen: Schedule },
                [ROUTES.ADD_BREAK]: { screen: AddBreak },
            }),
            
            [ROUTES.PROFILE]: { screen: Profile, title: t('tab-' + ROUTES.PROFILE.toLowerCase()) },
        }, {
                lazy: false,
                shifting: true,
                navigationOptions: ({ navigation }) => {
                    const { routeName } = navigation.state;

                    let iconName;
                    let iconFocusedName;
                    let tabBarColor;

                    if (routeName === ROUTES.SCHEDULE) {
                        iconFocusedName = 'ios-time'
                        iconName = 'ios-time-outline'
                        tabBarColor = theme.palette.Accent.A200.color
                    } else if (routeName === ROUTES.MEETINGS) {
                        iconFocusedName = 'ios-people'
                        iconName = 'ios-people-outline'
                        tabBarColor = theme.palette.Primary['500'].color
                    } else {
                        iconFocusedName = 'ios-person'
                        iconName = 'ios-person-outline'
                        tabBarColor = theme.palette.Pink['500'].color
                    }

                    return {
                        tabBarIcon: ({ focused, tintColor }) => <Icon size={23} name={focused ? iconFocusedName : iconName} color={tintColor} />,
                        tabBarLabel: t('tab-' + routeName.toLowerCase()),
                        tabBarColor
                    }
                }
            })
    }

    render() {
        return <this.Navigator />
    }

}

const Wrapper = translate('common')(withTheme({}, Navigator))
Wrapper.ROUTES = ROUTES

export default Wrapper