import React from 'react';
import { translate } from 'react-i18next';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HeaderButtons from 'react-navigation-header-buttons';
import { Box, Page, Paper } from '../components';
import Touchable from '../components/Touchable';
import { DataBase } from '../services';
import { withTheme } from "../theme";


const MyHeaderButtons = translate('common')(({ t, onSend }) =>
    <HeaderButtons IconComponent={Icon}
        iconSize={23}
        color="black"
        OverflowIcon={
            <Icon name="dots-vertical" size={23} />
        }>
        <HeaderButtons.Item show="always" title={t("button-send")}
            iconName="check"
            onPress={onSend} />
    </HeaderButtons>
)

class AddParticipant extends React.Component {

    static navigationOptions = ({ navigation }) => {
        const params = navigation.state.params || {};

        return {
            headerTitle: translate('common')(({ t }) =>
                <Box centralize fit>
                    <Text>{t('add-participant-screen-title')}</Text>
                </Box>
            ),
            headerRight: <MyHeaderButtons onSend={params.doSend} />,
            tabBarVisible: false,
            swipeEnabled: false,
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            users: {},
            usersQuery: [],
            query: '',
            queryDone: '',
            queryTimestamp: 0,
            defaultUser: null,
            loading: false
        }
    }

    asyncSetState = async state => new Promise(a => (
        this.setState({ ...this.state, ...state }, a)
    ))

    doChangeLoading = loading =>
        this.asyncSetState({ loading })

    componentWillMount() {
        this.props.navigation.setParams({ doSend: this.doSend })

        this.performSearchInterval = setInterval(this.doPerformSearch, 1000 / 60)
    }

    componentWillUnmount() {
        clearInterval(this.performSearchInterval)
    }

    async componentDidMount() {
        await this.doChangeLoading(true)
        const defaultUser = DataBase.getCurrentUserProfile()
        const _selectedUsers = await this.props.navigation.getParam("selectedUsers", null)
        const selectedUsers = _selectedUsers ? _selectedUsers : [defaultUser]

        const usersQuery = await DataBase.searchUsers()
        const users = {}
        selectedUsers.map(u => users[u.uid] = u)

        await this.asyncSetState({
            defaultUser,
            users,
            usersQuery,
        })
        await this.doChangeLoading(false)
    }

    doSend = async () => {
        const users = Object.keys(this.state.users).map(k => this.state.users[k])
        const onConfirm = this.props.navigation.getParam("onConfirm", () => { })
        await onConfirm(users)
        await this.props.navigation.goBack()
    }

    doToggleUser = async (user) => {
        const isSelected = !!this.state.users[user.uid]

        if (isSelected) {
            const { users } = this.state
            delete users[user.uid]
            await this.asyncSetState({ users })
        } else {
            const { users } = this.state
            users[user.uid] = user
            await this.asyncSetState({ users })
        }
    }

    onQueryChange = async (query) => {
        await this.asyncSetState({ query, queryTimestamp: +new Date() })
    }

    doPerformSearch = async () => {
        const now = +new Date()
        if (now - this.state.queryTimestamp > 300 && this.state.query !== this.state.queryDone) {
            await this.doChangeLoading(true)
            const usersQuery = await DataBase.searchUsers(this.state.query)
            await this.asyncSetState({ usersQuery, queryDone: this.state.query })
            await this.doChangeLoading(false)
        }
    }

    render() {

        const { t, theme, styles } = this.props
        const { users, usersQuery, query, loading } = this.state

        return (
            <Page>
                <Box fit alignStretch column padding>
                    <Box alignStretch column style={styles.marginBottom}>
                        {
                            Object.keys(users)
                                .map(k => users[k])
                                .map(u => (
                                    <Paper key={u.uid}>
                                        <Touchable
                                            primary
                                            onPress={() => this.doToggleUser(u)}
                                        >

                                            <Box center>
                                                <Image source={{ uri: u.photoURL + '?type=square&width=192' }}
                                                    style={styles.userAvatar} />
                                                <Box column padding style={styles.userInfo}>
                                                    <Text style={styles.userName}>
                                                        {u.displayName}
                                                    </Text>
                                                    <Text style={styles.userEmail}>
                                                        {u.email}
                                                    </Text>
                                                </Box>

                                                <Box centralize padding>
                                                    <Box centralize>
                                                        <Icon color={theme.paperTextSecondary.color}
                                                            name='delete'
                                                            size={23} />
                                                    </Box>
                                                </Box>
                                            </Box>

                                        </Touchable>
                                    </Paper>
                                ))
                        }
                    </Box>

                    <Paper style={styles.marginBottom} padding>
                        <Box centralize>
                            {
                                loading ? (
                                    <ActivityIndicator size="large"
                                        style={styles.searchIcon}
                                        color={theme.palette.Primary["500"].color} />
                                ) : (
                                        <Icon name="magnify" size={23} style={styles.searchIcon} />
                                    )
                            }
                            <TextInput placeholder={t('label-search-users')}
                                value={query}
                                onChangeText={this.onQueryChange}
                                style={styles.searchInput} />
                        </Box>
                    </Paper>

                    {
                        usersQuery.filter(u => !users[u.uid]).map(u => (
                            <Paper key={u.uid}>
                                <Touchable
                                    primary
                                    onPress={() => this.doToggleUser(u)}
                                >

                                    <Box center>
                                        <Image source={{ uri: u.photoURL + '?type=square&width=192' }}
                                            style={styles.userAvatar} />
                                        <Box column padding style={styles.userInfo}>
                                            <Text style={styles.userName}>
                                                {u.displayName}
                                            </Text>
                                            <Text style={styles.userEmail}>
                                                {u.email}
                                            </Text>
                                        </Box>

                                        <Box centralize padding>
                                            <Box centralize>
                                                <Icon color={theme.paperTextSecondary.color}
                                                    name='account-plus'
                                                    size={23} />
                                            </Box>
                                        </Box>
                                    </Box>

                                </Touchable>
                            </Paper>
                        ))
                    }
                </Box>
            </Page>
        )
    }
}

const styles = theme => StyleSheet.create({
    marginBottom: {
        marginBottom: 16
    },
    userAvatar: {
        width: 36,
        height: 36,
        margin: 16,
        marginRight: 0,
        borderRadius: 192,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        ...theme.paperTextPrimary
    },
    userEmail: {
        ...theme.paperTextSecondary
    },
    userCheckIcon: {
        borderRadius: 192,
        backgroundColor: theme.palette.Green["500"].color,
        width: 36,
        height: 36
    },
    searchIcon: {
        marginRight: 16
    },
    searchInput: {
        flex: 1
    }
})

export default translate('common')(withTheme(styles, AddParticipant))