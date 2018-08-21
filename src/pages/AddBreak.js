import DateFormat from 'dateformat';
import React from 'react';
import { translate } from 'react-i18next';
import { ActivityIndicator, DatePickerAndroid, Picker, StyleSheet, Text, TextInput, TimePickerAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HeaderButtons from 'react-navigation-header-buttons';
import { Box, Page, Paper } from '../components';
import Touchable from '../components/Touchable';
import { Alert, DataBase } from '../services';
import { withTheme } from "../theme";


const MyHeaderButtons = translate('common')(({t, onSend}) =>
    <HeaderButtons IconComponent={Icon}
                   iconSize={23}
                   color="black"
                   OverflowIcon={
                       <Icon name="dots-vertical" size={23}/>
                   }>
        <HeaderButtons.Item show="always" title={t("button-send")}
                            iconName="check"
                            onPress={onSend}/>
    </HeaderButtons>
)


const BREAK_TYPES = {
    WEEKLY: 'WEEKLY',
    DAILY: 'DAILY',
    ONCE: 'ONCE'
}

const BREAK_ASSURANCE = {
    SMALL: 0,
    MEDIUM: 1,
    BIG: 2
}

const WEEK_DAYS = {
    MON: "MON",
    TUE: "TUE",
    WED: "WED",
    THU: "THU",
    FRI: "FRI",
    SAT: "SAT",
    SUN: "SUN",
}


class AddBreak extends React.Component {

    static navigationOptions = ({navigation}) => {
        const params = navigation.state.params || {};

        return {
            headerTitle: translate('common')(({t}) =>
                <Box centralize fit>
                    <Text>{t('add-break-screen-title')}</Text>
                </Box>
            ),
            headerRight: <MyHeaderButtons onSend={params.doSend}/>,
            tabBarVisible: false,
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            _break: {
                label: '',
                type: BREAK_TYPES.WEEKLY,
                assurance: BREAK_ASSURANCE.BIG,
                day: new Date(),
                weekDay: WEEK_DAYS.MON,
                startTime: new Date(),
                endTime: new Date(),
                uid: null,
                userUid: null
            },
            loading: false
        }
    }

    asyncSetState = async state => new Promise(a => (
        this.setState({...this.state, ...state}, a)
    ))

    doChangeLoading = loading =>
        this.asyncSetState({loading})

    componentWillMount() {
        this.props.navigation.setParams({doSend: this.doSend});
    }

    async componentDidMount() {
        const _break = await this.props.navigation.getParam("break", null)
        if (_break) {
            _break.startTime = new Date(_break.startTime)
            _break.endTime = new Date(_break.endTime)
            await this.asyncSetState({_break})
        }
    }

    doSend = async () => {
        this.doChangeLoading(true)
        try {

            const {_break} = this.state

            console.log("AddBreak:doSend - Sending break ", _break)

            if (_break.uid)
                await DataBase.updateBreak(_break)
            else
                await DataBase.createBreak(_break)

            this.props.navigation.goBack()
            Alert.showLongText(this.props.t('break-sent'))

        } catch (err) {
            Alert.showLongText(this.props.t('send-break-fail'))
        }
        this.doChangeLoading(false)
    }

    onChangeBreakLabel = async (label) =>
        this.asyncSetState({_break: {...this.state._break, label}})

    onChangeBreakType = async (type) =>
        this.asyncSetState({_break: {...this.state._break, type}})

    onChangeBreakAssurance = async (assurance) =>
        this.asyncSetState({_break: {...this.state._break, assurance}})

    onChangeBreakStartTime = async () => {
        try {
            const {action, hour, minute} = await TimePickerAndroid.open({
                hour: this.state._break.startTime.getHours(),
                minute: this.state._break.startTime.getMinutes(),
                is24Hour: true
            })
            if (action !== TimePickerAndroid.dismissedAction) {
                const start = this.state._break.startTime
                start.setHours(hour)
                start.setMinutes(minute)
                await this.asyncSetState({_break: {...this.state._break, startTime: start}})
            }
        } catch (error) {
            console.warn('AddBreak:onChangeBreakStartTime - Cannot open time picker:', error);
        }
    }

    onChangeBreakEndTime = async () => {
        try {
            const {action, hour, minute} = await TimePickerAndroid.open({
                hour: this.state._break.endTime.getHours(),
                minute: this.state._break.endTime.getMinutes(),
                is24Hour: true
            })
            if (action !== TimePickerAndroid.dismissedAction) {
                const end = this.state._break.endTime
                end.setHours(hour)
                end.setMinutes(minute)
                await this.asyncSetState({_break: {...this.state._break, endTime: end}})
            }
        } catch (error) {
            console.warn('AddBreak:onChangeBreakEndTime - Cannot open time picker:', error);
        }
    }

    onChangeBreakDay = async () => {
        try {
            const {action, year, month, day} = await DatePickerAndroid.open({
                date: new Date(this.state._break.day)
            })
            if (action !== DatePickerAndroid.dismissedAction) {
                const _day = new Date(year, month, day)
                await this.asyncSetState({_break: {...this.state._break, day: _day}})
            }
        } catch (error) {
            console.warn('AddBreak:onChangeBreakDay - Cannot open date picker:', error);
        }
    }

    onChangeBreakWeekDay = async (weekDay) => {
        await this.asyncSetState({_break: {...this.state._break, weekDay}})
    }

    render() {

        const {t, theme, styles} = this.props
        const {
            label,
            startTime,
            endTime,
            assurance,
            type,
            weekDay,
            day
        } = this.state._break
        const {loading} = this.state

        return (
            <Page>
                <Box fit alignStretch column padding>
                    <Paper padding>
                        <Box column centralize alignStretch>
                            <TextInput placeholder={t('placeholder-break-label')}
                                       onChangeText={this.onChangeBreakLabel}
                                       value={label}
                                       style={styles.input}/>

                            <Text>{t('label-break-type')}</Text>
                            <Picker
                                style={styles.input}
                                mode="dropdown"
                                selectedValue={type}
                                onValueChange={this.onChangeBreakType}>
                                {Object.keys(BREAK_TYPES).map(k =>
                                    <Picker.Item key={k} label={t(`break-type-${k.toLowerCase()}`)}
                                                 value={BREAK_TYPES[k]}/>
                                )}
                            </Picker>

                            <Text>{t('label-break-assurance')}</Text>
                            <Picker
                                style={styles.input}
                                mode="dropdown"
                                selectedValue={assurance}
                                onValueChange={this.onChangeBreakAssurance}>
                                {Object.keys(BREAK_ASSURANCE).map(k =>
                                    <Picker.Item key={k} label={t(`break-assurance-${k.toLowerCase()}`)}
                                                 value={BREAK_ASSURANCE[k]}/>
                                )}
                            </Picker>

                            {
                                type === BREAK_TYPES.ONCE && (
                                    <Box column style={styles.input}>
                                        <Touchable
                                            onPress={this.onChangeBreakDay}
                                            >
                                            <Box column>
                                                <Text>{t('label-break-day')}</Text>
                                                <Text style={styles.inputValue}>{DateFormat(day, "dd/mm/yyyy")}</Text>
                                            </Box>
                                        </Touchable>
                                    </Box>
                                )
                            }

                            {
                                type === BREAK_TYPES.WEEKLY && (
                                    <Box column style={styles.input}>
                                        <Text>{t('label-break-week-day')}</Text>
                                        <Picker
                                            mode="dropdown"
                                            selectedValue={weekDay}
                                            onValueChange={this.onChangeBreakWeekDay}>
                                            {Object.keys(WEEK_DAYS).map(k =>
                                                <Picker.Item key={k} label={t(`break-week-day-${k.toLowerCase()}`)}
                                                             value={WEEK_DAYS[k]}/>
                                            )}
                                        </Picker>
                                    </Box>
                                )
                            }

                            <Box justifySpaceBetween>
                                <Box style={styles.breakTimeItem} column>
                                    <Touchable
                                        onPress={this.onChangeBreakStartTime}
                                        >
                                        <Box column>
                                            <Text>{t('label-break-start-time')}</Text>
                                            <Text style={styles.inputValue}>{DateFormat(startTime, "HH:MM")}</Text>
                                        </Box>
                                    </Touchable>
                                </Box>

                                <Box style={styles.breakTimeItem} column>
                                    <Touchable
                                        onPress={this.onChangeBreakEndTime}
                                        >
                                        <Box column>
                                            <Text>{t('label-break-end-time')}</Text>
                                            <Text style={styles.inputValue}>{DateFormat(endTime, "HH:MM")}</Text>
                                        </Box>
                                    </Touchable>
                                </Box>
                            </Box>

                        </Box>
                    </Paper>
                </Box>
                {
                    loading && (
                        <Box fitAbsolute centralize>
                            <ActivityIndicator size="large" color={theme.palette.Primary["500"].color}/>
                        </Box>
                    )
                }
            </Page>
        )
    }
}

const styles = theme => StyleSheet.create({
    breakTimeItem: {
        flex: 1,
    },
    breakTimeItemLarge: {
        flex: 2,
    },
    input: {
        marginBottom: 16
    },
    inputValue: {
        ...theme.text.h4,
    }
})

export default translate('common')(withTheme(styles, AddBreak))