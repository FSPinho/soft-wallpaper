import DateFormat from "dateformat";
import React from 'react';
import { translate } from 'react-i18next';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text } from 'react-native';
import { LoginManager } from "react-native-fbsdk";
import Firebase from 'react-native-firebase';
import { GoogleSignin } from 'react-native-google-signin';
import IonIcon from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HeaderButtons from 'react-navigation-header-buttons';
import { Box, Page, Paper } from '../components';
import Fab from '../components/Fab';
import Touchable from '../components/Touchable';
import { HomeNavigator } from '../navigation';
import { Alert, DataBase } from "../services";
import { withTheme } from '../theme';


const MyHeaderButtons = translate('common')(({ t, theme, onSignOut }) =>
    <HeaderButtons IconComponent={Icon}
        iconSize={23}
        color="black"
        OverflowIcon={
            <Icon name="dots-vertical" size={23}
                color={theme ? theme.palette.White.Primary.color : '#fff'} />
        }>
        <HeaderButtons.Item show="never" title={t("sign-out-button")}
            onPress={onSignOut} />
    </HeaderButtons>
)


const BREAK_ASSURANCE = {
    0: 'SMALL',
    1: 'MEDIUM',
    2: 'BIG'
}


class Schedule extends React.Component {

    static navigationOptions = ({ navigation }) => {
        const params = navigation.state.params || {}
        const {
            doSignOut,
            theme,
            noShadow,
            user,
            t = () => undefined
        } = params

        return {
            headerTitle: translate('common')(({ t }) =>
                <Box alignCenter fit >
                    <Text style={{
                        fontWeight: '500',
                        marginLeft: 16,
                        color: theme ? theme.palette.White.Primary.color : '#fff'
                    }}>{t('schedule-screen-title')}</Text>
                </Box>
            ),
            headerLeft: user ? <Image source={{ uri: user.photoURL + '?type=square&width=64' }}
                style={{ width: 36, height: 36, marginLeft: 16, borderRadius: 192 }} /> : undefined,
            headerRight: <MyHeaderButtons theme={theme} onSignOut={doSignOut} />,
            headerTintColor: 'white',
            headerStyle: {
                backgroundColor: theme ? theme.palette.Accent.A200.color : '#fff',
                elevation: noShadow ? 0 : 2
            }
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            breaks: [],
            refreshing: false,
            firstLoad: true,
            fabVisible: true
        }
    }

    async componentWillMount() {
        await DataBase.addOnBreakCreatedListener(this.doRefreshSchedule)
    }

    async componentDidMount() {
        this.props.navigation.setParams({
            doSignOut: this.doSignOut,
            theme: this.props.theme,
            noShadow: true,
            user: await DataBase.getCurrentUser(),
            t: this.props.t
        })
    }

    async componentWillUnmount() {
        await DataBase.removeOnBreakCreatedListener(this.doRefreshSchedule)
    }

    handleOnScroll = async ({ nativeEvent }) => {
        const { contentOffset: { y }, velocity: { y: yVelocity } } = nativeEvent

        // if (yVelocity > 0 && this.state.fabVisible)
        //     this.asyncSetState({ fabVisible: false })
        // else if (!this.state.fabVisible)
        //     this.asyncSetState({ fabVisible: true })

        if (y > 16)
            this.props.navigation.setParams({ doSignOut: this.doSignOut, theme: this.props.theme, noShadow: false, t: this.props.t, user: await DataBase.getCurrentUser(), })
        else
            this.props.navigation.setParams({ doSignOut: this.doSignOut, theme: this.props.theme, noShadow: true, t: this.props.t, user: await DataBase.getCurrentUser(), })

        this.refs.backHeader.setNativeProps({
            top: -y * .5
        })
    }

    asyncSetState = async state => new Promise(a =>
        this.setState({ ...this.state, ...state }, a)
    )

    doChangeRefreshing = refreshing => (
        this.asyncSetState({ refreshing })
    )

    doSignOut = async () => {
        try {
            await LoginManager.logOut()
        } catch (err) { }

        try {
            await GoogleSignin.revokeAccess()
            await GoogleSignin.signOut()
        } catch (err) { }

        try {
            await Firebase.auth().signOut()
        } catch (err) { }
    }

    doOpenNewBreakScreen = async () => {
        this.props.navigation.navigate(HomeNavigator.ROUTES.ADD_BREAK)
    }

    doOpenEditBreakScreen = async (_break) => {
        this.props.navigation.navigate(HomeNavigator.ROUTES.ADD_BREAK, { "break": _break })
    }

    doDeleteBreak = async (_break) => {
        try {
            await Alert.ask(this, this.props.t('alert-confirm-delete-break'))
            await DataBase.deleteBreak(_break)
            await Alert.showText(this.props.t('message-break-deleted'))
        } catch (error) {
            console.log("Schedule:doDeleteBreak - Break not deleted: ", error)
        }
    }

    doRefreshSchedule = async () => {
        await this.doChangeRefreshing(true)

        console.log("Schedule:doRefreshSchedule - Getting breaks...")
        const breaks = await DataBase.getBreaks()

        console.log("Schedule:doRefreshSchedule - Found " + breaks.length + " new breaks")
        await this.asyncSetState({
            breaks: [...breaks],
            firstLoad: false
        })

        await this.doChangeRefreshing(false)
    }

    breakKeyExtractor = _break => (
        _break.uid
    )

    render() {

        const { t, theme, styles } = this.props
        const { breaks, refreshing } = this.state

        return (
            <Page>
                <Box style={styles.backHeader} ref="backHeader" />

                {
                    (breaks.length) ? (
                        <FlatList
                            style={styles.breaksList}
                            data={breaks}
                            keyExtractor={this.breakKeyExtractor}
                            ListHeaderComponent={() =>
                                <Box column>
                                    <Box style={styles.listTopListStart} padding>
                                        <Text style={styles.listTitle}>{t('breaks-list-header')}</Text>
                                    </Box>
                                </Box>
                            }
                            ListFooterComponent={() =>
                                <Box>
                                    <Box style={styles.listFooterListEnd} />
                                    <Box style={styles.listFooterSpacing} />
                                </Box>
                            }
                            onScroll={this.handleOnScroll}
                            renderItem={({ item }) =>
                                <Paper style={styles.breakItem}>
                                    <Touchable
                                        primary
                                        onPress={() => this.doOpenEditBreakScreen(item)}>

                                        <Box fit centralize>
                                            <Box column style={{ flex: 1, paddingLeft: 16 }}>
                                                <Text style={styles.breakItemTitle}>
                                                    {item.label}
                                                </Text>
                                                {/* <Text style={styles.breakItemText}>
                                                    {t(`break-assurance-${BREAK_ASSURANCE[item.assurance].toLowerCase()}`)}
                                                </Text> */}
                                                <Box>
                                                    {
                                                        item.type === 'WEEKLY' ? (
                                                            <Text style={styles.breakItemText}>
                                                                {t(`break-type-${item.type.toLowerCase()}`)}, {t('always-on')} {t(`break-week-day-${item.weekDay.toLowerCase()}`)}
                                                            </Text>
                                                        ) : item.type === 'ONCE' ? (
                                                            <Text style={styles.breakItemText}>
                                                                {t(`break-type-${item.type.toLowerCase()}`)} {t('on-day')} {DateFormat(item.day, "dd/mm/yyyy")}
                                                            </Text>
                                                        ) : (
                                                                    <Text style={styles.breakItemText}>
                                                                        {t(`break-type-${item.type.toLowerCase()}`)}
                                                                    </Text>
                                                                )
                                                    }
                                                </Box>
                                                <Text style={styles.breakItemText}>
                                                    {DateFormat(new Date(item.startTime), "HH:MM")} - {DateFormat(new Date(item.endTime), "HH:MM")}
                                                </Text>
                                            </Box>

                                            <Box style={{ width: 56 }}>
                                                <Touchable
                                                    primary
                                                    onPress={() => this.doDeleteBreak(item)}>
                                                    <Box style={styles.breakItemMenu} centralize>
                                                        <Icon name="delete"
                                                            size={23}
                                                            color={theme.paperTextSecondary.color} />
                                                    </Box>
                                                </Touchable>
                                            </Box>
                                        </Box>

                                    </Touchable>
                                </Paper>
                            }
                        />
                    ) : (
                            <Box centralize fit column>
                                <Box centralize style={{ width: 192 }}>
                                    {
                                        refreshing ?
                                            (
                                                <ActivityIndicator size="large" color={theme.palette.Primary["500"].color} />
                                            ) : (
                                                <Box column centralize>
                                                    <IonIcon size={96} color={theme.palette.Black.Disabled.color}
                                                        name={'ios-time-outline'}
                                                        style={{ marginBottom: 16 }} />
                                                    <Text style={styles.emptyListText}>{t('empty-breaks-message')}</Text>
                                                </Box>
                                            )
                                    }
                                </Box>
                            </Box>
                        )
                }


                <Fab color={theme.palette.Accent.A200.color}
                    onPress={this.doOpenNewBreakScreen}
                    icon={'plus'}
                    style={styles.fab}
                    animated={!breaks.length}
                    animatedText={t('add-first-break-button')}
                />

            </Page>
        )
    }
}

const styles = (theme) => StyleSheet.create({
    backHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        backgroundColor: theme.palette.Accent.A200.color
    },
    loading: {
        backgroundColor: 'rgba(255, 255, 255, .5)',
        zIndex: 100
    },
    breaksList: {
        flex: 1,
        padding: 16
    },
    breakItem: {
        height: 72,
        borderRadius: 0,
        marginBottom: -1
    },
    breakItemMenu: {
        width: 48,
        height: 48
    },
    breakItemTitle: {
        ...theme.text.p,
        ...theme.paperTextPrimary,
    },
    breakItemText: {
        ...theme.text.p,
        ...theme.paperTextSecondary,
    },
    emptyListText: {
        color: theme.palette.Black.Disabled.color,
        textAlign: 'center',
        ...theme.text.h4,
    },
    listTitle: {
        ...theme.text.p,
        ...theme.paperTextSecondary,
    },
    listHeader: {
        paddingBottom: 16
    },
    listTopListStart: {
        flex: 1,
        backgroundColor: theme.palette.White.Primary.color,
        borderTopLeftRadius: theme.paper.borderRadius,
        borderTopRightRadius: theme.paper.borderRadius,
        marginBottom: -3
    },
    listFooterListEnd: {
        flex: 1,
        backgroundColor: theme.palette.White.Primary.color,
        borderBottomLeftRadius: theme.paper.borderRadius,
        borderBottomRightRadius: theme.paper.borderRadius,
        height: 16
    },
    listFooterSpacing: {
        height: 56 + 56 + 20,
    },
    createMeetingButton: {
        backgroundColor: theme.palette.Primary['400'].color,
        borderRadius: 4
    },
    createMeetingButtonText: {
        color: theme.palette.White.Primary.color,
    },
    fab: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 1000
    }
})

export default translate('common')(withTheme(styles, Schedule))