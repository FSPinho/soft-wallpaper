import React from 'react';
import { translate } from 'react-i18next';
import { Image, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HeaderButtons from 'react-navigation-header-buttons';
import { Box, Page } from '../components';
import Fab from '../components/Fab';
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

class Loved extends React.Component {

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
                    }}>{t('wallpaper-generator-screen-title')}</Text>
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
            refreshing: false,
            fabVisible: true
        }
    }

    async componentWillMount() {
    }

    async componentDidMount() {
        this.props.navigation.setParams({
            theme: this.props.theme,
            t: this.props.t
        })
    }

    async componentWillUnmount() {
    }

    asyncSetState = async state => new Promise(a =>
        this.setState({ ...this.state, ...state }, a)
    )

    doChangeRefreshing = refreshing => (
        this.asyncSetState({ refreshing })
    )

    render() {

        const { t, theme, styles } = this.props
        const { refreshing } = this.state

        return (
            <Page>
                <Box style={styles.backHeader} ref="backHeader" />

                <Fab color={theme.palette.Accent.A200.color}
                    onPress={() => {}}
                    icon={'plus'}
                    style={styles.fab}
                    animated={false}
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

export default translate('common')(withTheme(styles, Loved))