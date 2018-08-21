import React from 'react';
import { translate } from 'react-i18next';
import { ActivityIndicator, Image, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewShot, { releaseCapture } from "react-native-view-shot";
import HeaderButtons from 'react-navigation-header-buttons';
import { Box, Page, Paper } from '../components';
import Fab from '../components/Fab';
import Alert from '../services/Alert';
import WallpaperManager from '../services/WallpaperManager';
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

class WallpaperGenerator extends React.Component {

    static navigationOptions = ({ navigation }) => {
        const params = navigation.state.params || {}
        const {
            doSignOut,
            theme,
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
                elevation: 2
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

        this.doChangeRefreshing(true)

        try {

            const path = await this.refs.wallpaperRef.capture()
            const clearPath = path.replace('file://', '')
            await WallpaperManager.setWallpaper({ path: clearPath })
            await releaseCapture(path)
            Alert.showLongText(this.props.t('wallpaper-set-success-message'))

        } catch (error) {
            console.log("WallpaperGenerator:componentDidMount - Can't generate wallpaper:", error)
            Alert.showLongText(this.props.t('wallpaper-set-error-message'))
        }

        this.doChangeRefreshing(false)
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
                    onPress={() => { }}
                    icon={'check'}
                    style={styles.fab}
                    animated={false}
                    animatedText={t('add-first-break-button')}
                />

                <Box centralize fit column padding>
                    <Paper padding fit >
                        <ViewShot ref="wallpaperRef"
                            options={{ format: "png" }}
                            style={{ flex: 1 }}>

                            <Box centralize fit style={styles.wallpaperRoot}>
                                <Text>Wallpaper</Text>
                            </Box>

                        </ViewShot>
                    </Paper>

                    {
                        refreshing &&
                        (
                            <Box centralize fitAbsolute>
                                <ActivityIndicator color={theme.palette.Primary.color} />
                            </Box>
                        )
                    }
                </Box>

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
    fab: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 1000
    },
    wallpaperRoot: {
        backgroundColor: theme.palette.White['500'].color
    }
})

export default translate('common')(withTheme(styles, WallpaperGenerator))