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


class Meetings extends React.Component {

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
                    }}>{t('meetings-screen-title')}</Text>
                </Box>
            ),
            headerLeft: user ? <Image source={{ uri: user.photoURL + '?type=square&width=64' }}
                style={{ width: 36, height: 36, marginLeft: 16, borderRadius: 192 }} /> : undefined,
            headerRight: <MyHeaderButtons theme={theme} onSignOut={doSignOut} />,
            headerTintColor: 'white',
            headerStyle: {
                backgroundColor: theme ? theme.palette.Primary['500'].color : '#fff',
                elevation: noShadow ? 0 : 2
            }
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            meetings: [],
            meetingsParticipating: [],
            refreshing: false,
            firstLoad: true,
        }
    }

    async componentWillMount() {
        await DataBase.addOnMeetingCreatedListener(this.doRefreshMeetings)
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
        await DataBase.removeOnMeetingCreatedListener(this.doRefreshMeetings)
    }

    handleOnScroll = async ({ nativeEvent }) => {
        const { contentOffset: { y }, velocity: { y: yVelocity } } = nativeEvent

        // if (yVelocity > 0 && this.state.fabVisible)
        //     this.asyncSetState({ fabVisible: false })
        // else if (!this.state.fabVisible)
        //     this.asyncSetState({ fabVisible: true })

        if (y > 16)
            this.props.navigation.setParams({ doSignOut: this.doSignOut, theme: this.props.theme, noShadow: false, t: this.props.t, user: await DataBase.getCurrentUser() })
        else
            this.props.navigation.setParams({ doSignOut: this.doSignOut, theme: this.props.theme, noShadow: true, t: this.props.t, user: await DataBase.getCurrentUser() })

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

    doOpenNewMeetingScreen = async () => {
        this.props.navigation.navigate(HomeNavigator.ROUTES.ADD_MEETING)
    }

    doOpenEditMeetingScreen = async (meeting) => {
        this.props.navigation.navigate(HomeNavigator.ROUTES.ADD_MEETING, { "meeting": meeting })
    }

    doDeleteMeeting = async (meeting) => {
        try {
            await Alert.ask(this, this.props.t('alert-confirm-delete-meeting'))
            await DataBase.deleteMeeting(meeting)
            await Alert.showText(this.props.t('message-meeting-deleted'))
        } catch (error) {
            console.log("Meetings:doDeleteMeeting - Meeting not deleted: ", error)
        }
    }

    doRefreshMeetings = async () => {
        await this.doChangeRefreshing(true)

        console.log("Meetings:doRefreshSchedule - Getting meetings...")
        const meetings = await DataBase.getMeetings()
        const meetingsParticipating = await DataBase.getMeetingsParticipating()

        console.log("Meetings:doRefreshSchedule - Found " + meetings.length + " new meetings")
        await this.asyncSetState({
            meetings: [...meetings],
            meetingsParticipating: [...meetingsParticipating],
            firstLoad: false
        })

        await this.doChangeRefreshing(false)
    }

    meetingKeyExtractor = meeting => (
        meeting.uid
    )

    render() {

        const { t, theme, styles } = this.props
        const { meetings, meetingsParticipating, refreshing } = this.state

        const _meetings = [
            ...meetings,
            ...meetingsParticipating,
        ]

        return (
            <Page>

                <Box style={styles.backHeader} ref="backHeader" />

                {
                    (!!meetings.length || !!meetingsParticipating.length) ? (
                        <FlatList
                            style={styles.meetingList}
                            data={_meetings}
                            keyExtractor={this.meetingKeyExtractor}
                            ListHeaderComponent={() =>
                                <Box column>
                                    <Box style={styles.listTopListStart} />
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
                                <Paper style={styles.meetingItem}>
                                    <Touchable
                                        primary
                                        onPress={() => this.doOpenEditMeetingScreen(item)}>

                                        <Box fit centralize>
                                            <Box padding column style={{ flex: 1 }}>
                                                <Text style={styles.meetingItemTitle}>
                                                    {item.label}
                                                </Text>

                                                {
                                                    item.selectedSuggestion && (
                                                        <Text style={styles.meetingItemSubtitle}>
                                                            {
                                                                DateFormat(new Date(item.selectedSuggestion.day), "dd/mm/yyyy")
                                                            }, {DateFormat(new Date(item.selectedSuggestion.startTime), "HH:MM")}
                                                        </Text>
                                                    )
                                                }

                                                <Box>
                                                    <Box fitAbsolute>
                                                        {
                                                            item.participants && item.participants.length
                                                            && item.participants.slice(0, 8).map((u, i) => (
                                                                <Box style={styles.userAvatarWrapper} key={i}>
                                                                    <Box style={styles.userAvatarBackground} />
                                                                </Box>
                                                            ))
                                                        }
                                                    </Box>
                                                    {
                                                        item.participants && item.participants.length
                                                        && item.participants.slice(0, 8).map((u, i) => (
                                                            <Box style={styles.userAvatarWrapper} key={i}>
                                                                <Image
                                                                    source={{ uri: u.photoURL + '?type=square&width=64' }}
                                                                    style={styles.userAvatar} />
                                                            </Box>
                                                        ))
                                                    }
                                                    {
                                                        item.participants && item.participants.length > 8
                                                        && (
                                                            <Box style={styles.userAvatarFake} centralize>
                                                                <Text style={styles.userAvatarFakeText}>...</Text>
                                                            </Box>
                                                        )
                                                    }
                                                </Box>
                                            </Box>

                                            <Box style={{ width: 56 }}>
                                                <Touchable
                                                    primary
                                                    onPress={() => this.doDeleteMeeting(item)}>
                                                    <Box style={styles.meetingItemMenu} centralize>
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
                                                        name={'ios-people-outline'}
                                                        style={{ marginBottom: 16 }} />
                                                    <Text style={styles.emptyListText}>{t('empty-meetings-message')}</Text>
                                                </Box>
                                            )
                                    }
                                </Box>
                            </Box>
                        )
                }


                <Fab color={theme.palette.Primary['500'].color}
                    onPress={this.doOpenNewMeetingScreen}
                    icon={'plus'}
                    style={styles.fab}
                    animated={!meetings.length && !meetingsParticipating.length}
                    animatedText={t('add-first-meeting-button')}
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
        backgroundColor: theme.palette.Primary['500'].color
    },
    meetingList: {
        flex: 1,
        padding: 16
    },
    meetingItem: {
        height: 96,
        borderRadius: 0,
        marginBottom: -1
    },
    meetingItemMenu: {
        width: 48,
        height: 48
    },
    meetingItemTitle: {
        ...theme.text.p,
        ...theme.paperTextPrimary,
    },
    meetingItemSubtitle: {
        ...theme.text.p,
        ...theme.paperTextSecondary,
    },
    meetingItemText: {
        ...theme.text.p,
        ...theme.paperTextPrimary,
    },
    emptyListText: {
        color: theme.palette.Black.Disabled.color,
        textAlign: 'center',
        ...theme.text.h4,
    },
    userAvatarWrapper: {
        width: 36 / 3 * 2
    },
    userAvatarBackground: {
        width: 36,
        height: 36,
        marginTop: 16,
        borderRadius: 192,
        backgroundColor: theme.palette.Primary['500'].color
    },
    userAvatar: {
        width: 36 - 4,
        height: 36 - 4,
        margin: 2,
        marginTop: 16 + 2,
        borderRadius: 192,
        borderColor: 'transparent',
        borderWidth: 2
    },
    userAvatarFake: {
        width: 36,
        height: 36,
        marginTop: 16,
        borderRadius: 192,
        backgroundColor: theme.palette.Primary['500'].color
    },
    userAvatarFakeText: {
        color: theme.palette.White.Primary.color
    },
    listHeader: {
        paddingBottom: 16
    },
    listTopListStart: {
        flex: 1,
        backgroundColor: theme.palette.White.Primary.color,
        borderTopLeftRadius: theme.paper.borderRadius,
        borderTopRightRadius: theme.paper.borderRadius,
        height: 16,
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
    fab: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 1000
    }
})

export default translate('common')(withTheme(styles, Meetings))