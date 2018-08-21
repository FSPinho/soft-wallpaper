import DateFormat from 'dateformat';
import React from 'react';
import { translate } from 'react-i18next';
import { ActivityIndicator, Button, Image, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import NumericInput from 'react-native-numeric-input';
import OneSignal from 'react-native-onesignal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HeaderButtons from 'react-navigation-header-buttons';
import { Box, Page, Paper } from '../components';
import Touchable from '../components/Touchable';
import { HomeNavigator } from '../navigation';
import { Alert, DataBase } from '../services';
import { withTheme } from "../theme";


const MyHeaderButtons = translate('common')(({ t, onSend, disabled }) =>
    <HeaderButtons IconComponent={Icon}
        iconSize={23}
        OverflowIcon={
            <Icon name="dots-vertical" size={23} />
        }>
        <HeaderButtons.Item show="always" title={t("button-send")}
            disabled={disabled}
            iconName="check"
            buttonStyle={{ color: !disabled ? "rgba(0, 0, 0, .83)" : "rgba(0, 0, 0, .2)" }}
            onPress={disabled ? () => { } : onSend} />
    </HeaderButtons>
)


class AddMeeting extends React.Component {

    static navigationOptions = ({ navigation }) => {
        const params = navigation.state.params || {}

        return {
            headerTitle: translate('common')(({ t }) =>
                <Box centralize fit>
                    <Text>{t('add-meeting-screen-title')}</Text>
                </Box>
            ),
            headerRight: <MyHeaderButtons disabled={params.disabled} onSend={params.doSend} />,
            tabBarVisible: false,
            swipeEnabled: false,
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            meeting: {
                label: '',
                duration: 1,
                participants: [],
                suggestions: [],
                selectedSuggestion: null,
                uid: null,
                userUid: null,
            },
            loading: false,
        }
    }

    asyncSetState = async state => new Promise(a => (
        this.setState({ ...this.state, ...state }, a)
    ))

    doChangeLoading = loading =>
        this.asyncSetState({ loading })

    componentWillMount() {
        this.props.navigation.setParams({ doSend: this.doSend, disabled: !this.state.meeting.selectedSuggestion })
    }

    async componentDidMount() {
        const meeting = await this.props.navigation.getParam("meeting", null)
        if (meeting) {
            // meeting.startTime = new Date(meeting.startTime)
            // meeting.endTime = new Date(meeting.endTime)
            await this.asyncSetState({ meeting: { ...meeting } })
        } else {
            const currentUser = await DataBase.getCurrentUserProfile()
            await this.asyncSetState({ meeting: { ...this.state.meeting, participants: [currentUser] } })
        }

        await this.doUpdateSuggestions()

        await DataBase.addOnBreakCreatedListener(this.doUpdateSuggestions)
    }

    doSend = async () => {
        this.doChangeLoading(true)
        try {

            const { meeting } = this.state
            let saved = meeting

            const currentUser = await DataBase.getCurrentUserProfile()
            const { participants } = meeting
            for (let p of participants) {
                const u = await DataBase.getUserProfile(p.uid)

                try {

                    console.log("AddMeeting:doSend - Sending push notification to user", u.displayName, u.oneSignalDeviceId)

                    if (u.oneSignalDeviceId && currentUser.uid != u.uid) {
                        let data = { meetingUid: saved.uid }
                        let contents = {
                            'en': `${this.props.t('meeting-notification-message', {
                                user: currentUser.displayName,
                                day: DateFormat(meeting.selectedSuggestion.day, "dd/mm/yyyy"),
                                hour: DateFormat(meeting.selectedSuggestion.startTime, "HH:MM"),
                                count: participants.length
                            })}`
                        }
                        OneSignal.postNotification(contents, data, u.oneSignalDeviceId);
                    }
                } catch (err) {
                    console.warn("AddMeeting:doSend - Sending push notification fail", err)
                }
            }

            console.log("AddMeeting:doSend - Sending meeting ", { ...meeting, suggestions: [] })

            if (meeting.uid) {
                await DataBase.updateMeeting(meeting)
            }
            else {
                await DataBase.createMeeting(meeting)
            }

            this.props.navigation.goBack()
            Alert.showLongText(this.props.t('meeting-sent'))

        } catch (err) {
            Alert.showLongText(this.props.t('send-meeting-fail'))
        }
        this.doChangeLoading(false)
    }

    doChangeMeetingLabel = async (label) =>
        this.asyncSetState({ meeting: { ...this.state.meeting, label } })

    doChangeMeetingDuration = async (duration) => {
        await this.asyncSetState({ meeting: { ...this.state.meeting, duration } })
        await this.doUpdateSuggestions()
    }

    doAddParticipant = async () => {
        await this.props.navigation.navigate(
            HomeNavigator.ROUTES.ADD_PARTICIPANT,
            {
                onConfirm: this.onAddParticipantConfirm,
                selectedUsers: this.state.meeting.participants
            }
        )
    }

    onAddParticipantConfirm = async (participants) => {
        await this.asyncSetState({
            meeting: {
                ...this.state.meeting,
                participants
            }
        })
        await this.doUpdateSuggestions()
    }

    doRemoveParticipant = async participant => {
        const participants = [...this.state.meeting.participants.filter(p => p.uid !== participant.uid)]
        await this.asyncSetState({
            meeting: {
                ...this.state.meeting,
                participants
            }
        })
        await this.doUpdateSuggestions()
    }

    doUpdateSuggestions = async () => {

        const { duration } = this.state.meeting
        const _getBreakDuration = _break => {
            const offset = +new Date(_break.endTime) - +new Date(_break.startTime)
            return offset / (1000 * 60 * 60)
        }
        const _getNearbyBreaks = (_break, offset) => {
            _break.day = new Date(_break.day)
            _break.startTime = new Date(_break.startTime)
            _break.endTime = new Date(_break.endTime)

            if (_break.type === 'DAILY') {
                const breaks = []
                const day = new Date()

                day.setHours(_break.startTime.getHours())
                day.setMinutes(_break.startTime.getMinutes())

                if (+day < +new Date())
                    day.setDate(day.getDate() + 1)

                for (let i = 0; i < offset; i++) {
                    const _day = new Date(day)
                    _day.setDate(_day.getDate() + i)

                    breaks.push({
                        ..._break,
                        duration: _getBreakDuration(_break),
                        day: _day
                    })
                }
                return breaks
            } else if (_break.type === 'WEEKLY') {
                const WEEK_DAYS = {
                    MON: 1,
                    TUE: 2,
                    WED: 3,
                    THU: 4,
                    FRI: 5,
                    SAT: 6,
                    SUN: 7,
                }
                const breaks = []
                const day = new Date()
                const weekDay = WEEK_DAYS[_break.weekDay]
                const diff = weekDay - day.getDay()
                day.setDate(day.getDate() + diff)

                if (+day < +new Date())
                    day.setDate(day.getDate() + 7)

                for (let i = 0; i < offset; i++) {
                    const _day = new Date(day)
                    _day.setDate(_day.getDate() + i * 7)
                    breaks.push({
                        ..._break,
                        duration: _getBreakDuration(_break),
                        day: _day
                    })
                }
                return breaks
            }

            return [{ ..._break, duration: _getBreakDuration(_break) }]
        }

        const _getBreakKey = b =>
            `${DateFormat(new Date(b.day), 'yyyy-mm-dd')}-${DateFormat(new Date(b.startTime), 'yyyy-mm-dd')}-${DateFormat(new Date(b.endTime), 'yyyy-mm-dd')}`

        const _mergeBreaks = (b1, b2, duration) => {
            if (DateFormat(new Date(b1.day), "yyyy-mm-dd") === DateFormat(new Date(b2.day), "yyyy-mm-dd")) {
                b1.startTime = new Date(b1.startTime)
                b1.startTime.setDate(new Date().getDate())
                b1.startTime.setMonth(new Date().getMonth())
                b1.startTime.setFullYear(new Date().getFullYear())

                b1.endTime = new Date(b1.endTime)
                b1.endTime.setDate(new Date().getDate())
                b1.endTime.setMonth(new Date().getMonth())
                b1.endTime.setFullYear(new Date().getFullYear())

                b2.startTime = new Date(b2.startTime)
                b2.startTime.setDate(new Date().getDate())
                b2.startTime.setMonth(new Date().getMonth())
                b2.startTime.setFullYear(new Date().getFullYear())

                b2.endTime = new Date(b2.endTime)
                b2.endTime.setDate(new Date().getDate())
                b2.endTime.setMonth(new Date().getMonth())
                b2.endTime.setFullYear(new Date().getFullYear())

                const _start = +b1.startTime > +b2.startTime ? b1.startTime : b2.startTime
                const _end = +b1.endTime < +b2.endTime ? b1.endTime : b2.endTime

                if (+_start >= +_end)
                    return null

                const offset = +_end - +_start
                if (offset / (1000 * 60 * 60) < duration)
                    return null

                const b = {
                    startTime: _start,
                    endTime: _end,
                    day: new Date(b1.day),
                    userUid: b1.userUid,
                    assurance: b1.assurance + b2.assurance,
                    users: {
                        ...(b1.users || {}),
                        ...(b2.users || {}),
                        [b1.userUid]: true,
                        [b2.userUid]: true
                    }
                }
                b.key = _getBreakKey(b)
                return b
            }

            return null
        }

        const _getUserBestBreaks = async user => {

            const breaks = await DataBase.getBreaks(user)
            let breaksExtended = []
            breaks.map(b => breaksExtended = [...breaksExtended, ..._getNearbyBreaks(b, 14)])
            breaksExtended.sort((b1, b2) => +new Date(b1.day) - +new Date(b2.day))
            return breaksExtended.filter(b => b.duration >= duration)
        }

        this.doChangeLoading(true)

        const users = this.state.meeting.participants
        let suggestionsMap = {}
        let breaks = []

        for (let user of users)
            breaks = [...breaks, ...await _getUserBestBreaks(user)]

        for (let _break of breaks) {
            let _breakBuff = { ..._break, users: {}, key: _getBreakKey(_break) }
            for (let anotherBreak of breaks) {
                const tmp = _mergeBreaks({ ..._breakBuff }, { ...anotherBreak }, duration)
                if (tmp) {
                    _breakBuff = tmp
                }
            }
            suggestionsMap[_breakBuff.key] = _breakBuff
        }

        let suggestions = Object.keys(suggestionsMap).map(k => ({ ...suggestionsMap[k], key: k }))

        suggestions = suggestions.sort((s1, s2) => {
            const userCount = Object.keys(s2.users).length - Object.keys(s1.users).length
            const assurance = s2.assurance - s1.assurance
            const dates = +new Date(s1.day) - +new Date(s2.day)
            return userCount !== 0 ? userCount : assurance !== 0 ? assurance : dates
        }).filter(s => Object.keys(s.users).length >= this.state.meeting.participants.length / 2)

        await this.asyncSetState({
            meeting: {
                ...this.state.meeting,
                suggestions,
                selectedSuggestion: suggestions[0]
            }
        })

        this.props.navigation.setParams({ doSend: this.doSend, disabled: !this.state.meeting.selectedSuggestion })
        this.doChangeLoading(false)

    }

    doToggleSuggestion = async suggestion => {
        await this.asyncSetState({
            meeting: {
                ...this.state.meeting,
                selectedSuggestion: suggestion
            }
        })
    }

    render() {

        const { t, theme, styles } = this.props
        const {
            label,
            duration,
            participants,
            suggestions,
            selectedSuggestion
        } = this.state.meeting
        const { loading } = this.state

        const users = {}
        participants.map(p => users[p.uid] = p)

        return (
            <Page>
                <ScrollView>
                    <Box fit alignStretch column padding>
                        <Paper padding>
                            <Box column centralize alignStretch>
                                <TextInput placeholder={t('placeholder-meeting-label')}
                                    onChangeText={this.doChangeMeetingLabel}
                                    value={label}
                                    style={styles.input} />
                            </Box>
                        </Paper>
                        {
                            participants.map(p => (
                                <Paper key={p.uid}>
                                    <Box center>
                                        <Image source={{ uri: p.photoURL + '?type=square&width=192' }}
                                            style={styles.participantAvatar} />
                                        <Box column padding style={styles.participantInfo}>
                                            <Text style={styles.participantName}>
                                                {p.displayName}
                                            </Text>
                                            <Text style={styles.participantEmail}>
                                                {p.email}
                                            </Text>
                                        </Box>
                                        <Touchable
                                            primary
                                            onPress={() => this.doRemoveParticipant(p)}
                                        >

                                            <Box centralize padding>
                                                <Icon style={styles.addParticipantIcon}
                                                    color={theme.paperTextSecondary.color}
                                                    name="delete"
                                                    size={23} />
                                            </Box>

                                        </Touchable>
                                    </Box>
                                </Paper>
                            ))
                        }
                        <Paper style={[styles.addParticipantCard, styles.marginBottom]}>
                            <Touchable
                                onPress={this.doAddParticipant}
                            >

                                <Box centralize padding>
                                    <Text style={styles.addParticipantText}>{t('button-add-participant')}</Text>
                                    <Icon style={styles.addParticipantIcon}
                                        color={theme.palette.Primary["500"].text}
                                        name="account-plus"
                                        size={23} />
                                </Box>

                            </Touchable>
                        </Paper>

                        <Paper padding style={styles.marginBottom}>
                            <Text>{t('label-meeting-duration')}</Text>
                            <Box centralize>
                                <NumericInput
                                    inputStyle={styles.numericInput}
                                    sepratorWidth={0}
                                    borderColor='transparent'
                                    value={duration}
                                    onChange={this.doChangeMeetingDuration}
                                    totalWidth={240}
                                    totalHeight={56}
                                    iconSize={23}
                                    step={0.5}
                                    editable={false}
                                    valueType='real'
                                />
                            </Box>
                        </Paper>

                        {
                            suggestions.length === 0 ? (
                                <Paper>
                                    <Box centralize padding>
                                        <Text style={{ marginRight: 16 }}>{t('no-suggestions-message')}</Text>
                                        <Button title={t('update-free-schedule')}
                                            color={theme.palette.Primary['500'].color}
                                            onPress={() => {
                                                this.props.navigation.navigate(HomeNavigator.ROUTES.SCHEDULE)
                                            }} />
                                    </Box>
                                </Paper>

                            ) : (
                                    <Box column>
                                        <Paper>
                                            <Box centralize padding>
                                                <Text style={{ marginRight: 16, flex: 1 }}>
                                                    {t('suggestions-message')}
                                                </Text>
                                                <Button title={t('update-free-schedule')}
                                                    color={theme.palette.Primary['500'].color}
                                                    onPress={() => {
                                                        this.props.navigation.navigate(HomeNavigator.ROUTES.SCHEDULE)
                                                    }} />
                                            </Box>
                                        </Paper>
                                        {
                                            suggestions.slice(0, 1).map((item, i) => (
                                                <Paper key={i}
                                                    style={{
                                                        backgroundColor: (
                                                            selectedSuggestion
                                                            && selectedSuggestion.key === item.key
                                                        ) ? theme.palette.Primary['500'].color : theme.paper.backgroundColor
                                                    }}>
                                                    <Touchable
                                                        onPress={() => this.doToggleSuggestion(item)}
                                                        primary={!(selectedSuggestion && selectedSuggestion.key === item.key)}>
                                                        <Box padding center>
                                                            <Box column style={styles.suggestionLeftContent}>
                                                                <Box column style={styles.marginBottom}>
                                                                    <Text
                                                                        style={[
                                                                            styles.title,
                                                                            (selectedSuggestion
                                                                                && selectedSuggestion.key === item.key) ?
                                                                                { color: theme.palette.Primary['500'].text } : null
                                                                        ]}>
                                                                        {t(
                                                                            "date",
                                                                            {
                                                                                day: DateFormat(item.day, "dd/mm/yyyy"),
                                                                                start: DateFormat(new Date(item.startTime), "HH:MM"),
                                                                                end: DateFormat(new Date(item.endTime), "HH:MM"),
                                                                            }
                                                                        )}
                                                                    </Text>
                                                                </Box>
                                                                <Box>
                                                                    {
                                                                        Object.keys(item.users).sort().filter(u => !!users[u]).map((u, i) => (
                                                                            <Image
                                                                                key={i}
                                                                                source={{ uri: users[u].photoURL + '?type=square&width=192' }}
                                                                                style={styles.suggestionAvatar} />
                                                                        ))
                                                                    }
                                                                </Box>
                                                                {
                                                                    (Object.keys(item.users).length !== participants.length) && (
                                                                        <Text
                                                                            style={{
                                                                                color: theme.palette.Red.A200.color,
                                                                                marginTop: 8,
                                                                            }}>
                                                                            {t('incomplete-users-warning')}
                                                                        </Text>
                                                                    )
                                                                }
                                                            </Box>

                                                            {
                                                                selectedSuggestion && selectedSuggestion.key === item.key &&
                                                                <Box centralize style={styles.greenMark}>
                                                                    <Icon color={theme.palette.Primary['500'].color}
                                                                        name='check'
                                                                        size={23} />
                                                                </Box>
                                                            }

                                                        </Box>
                                                    </Touchable>
                                                </Paper>
                                            ))
                                        }
                                    </Box>
                                )
                        }

                    </Box>
                </ScrollView>

                {
                    loading && (
                        <Box fitAbsolute centralize style={styles.loading}>
                            <ActivityIndicator size="large" color={theme.palette.Primary["500"].color} />
                        </Box>
                    )
                }

            </Page>
        )
    }
}

const styles = theme => StyleSheet.create({
    marginBottom: {
        marginBottom: 16
    },
    participantAvatar: {
        width: 36,
        height: 36,
        margin: 16,
        marginRight: 0,
        borderRadius: 192,
    },
    suggestionAvatar: {
        width: 36,
        height: 36,
        borderRadius: 192,
    },
    suggestionLeftContent: {
        flex: 1,
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        ...theme.paperTextPrimary
    },
    participantEmail: {
        ...theme.paperTextSecondary
    },
    addParticipantCard: {
        backgroundColor: theme.palette.Primary["500"].color,
    },
    addParticipantText: {
        color: theme.palette.Primary["500"].text,
    },
    addParticipantIcon: {
        marginLeft: 16
    },
    meetingTimeItem: {
        flex: 1,
    },
    meetingTimeItemLarge: {
        flex: 2,
    },
    input: {
        marginBottom: 16
    },
    inputValue: {
        ...theme.text.h4,
    },
    numericInput: {
        borderWidth: 0,
    },
    title: {
        ...theme.paperTextPrimary
    },
    subtitle: {
        ...theme.paperTextSecondary
    },
    greenMark: {
        width: 48,
        height: 48,
        borderRadius: 192,
        backgroundColor: theme.palette.Primary['500'].text,
    },
    loading: {
        backgroundColor: 'rgba(255, 255, 255, .5)',
        zIndex: 1000
    }
})

export default translate('common')(withTheme(styles, AddMeeting))