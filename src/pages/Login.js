import React from 'react';
import { translate } from 'react-i18next';
import { ActivityIndicator, Animated, AsyncStorage, Easing, ImageBackground, StyleSheet, Text } from 'react-native';
import { AccessToken, LoginManager } from 'react-native-fbsdk';
import Firebase from 'react-native-firebase';
import { GoogleSignin } from 'react-native-google-signin';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box } from '../components';
import Touchable from '../components/Touchable';
import { RootNavigator } from '../navigation';
import { Alert } from '../services';
import DataBase from "../services/DataBase";
import { withTheme } from "../theme";


class Login extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            loading: false,
            buttonTranslation1: new Animated.Value(0),
            buttonTranslation2: new Animated.Value(0),
        }
    }

    async componentDidMount() {
        await GoogleSignin.configure({
            iosClientId: '1080841665208-kmi5dt11e2ps5ejfdputbaj20526f582.apps.googleusercontent.com'
        });

        Animated.parallel([
            Animated.timing(this.state.buttonTranslation1, {
                toValue: 1,
                duration: 600,
                easing: Easing.bezier(.8, .2, .2, .8)
            }),
            Animated.timing(this.state.buttonTranslation2, {
                toValue: 1,
                duration: 600,
                delay: 200,
                easing: Easing.bezier(.8, .2, .2, .8)
            })
        ]).start()
    }

    async componentWillMount() {
        this.unsubscribe = Firebase.auth().onAuthStateChanged(async user => {
            this.setLoading(false)

            if (user) {
                console.log("Login:componentWillMount - User was signed in: " + user.displayName)
                this.props.navigation.navigate(RootNavigator.ROUTES.HOME)

                try {
                    const userId = await AsyncStorage.getItem("OneSignal:userId")
                    await DataBase.updateCurrentUserProfileAttribute('oneSignalDeviceId', userId)
                } catch (err) {
                    /** ... */
                }
            }
        })
    }

    componentWillUnmount() {
        if (this.unsubscribe)
            this.unsubscribe()
    }

    setLoading = loading =>
        this.setState({ ...this.state, loading })

    doFacebookLogin = async () => {

        this.setLoading(true)
        let fbCredential = null

        try {

            const result = await LoginManager.logInWithReadPermissions(['email', 'public_profile'])

            if (result.isCancelled) {
                Alert.showText(this.props.t('facebook-login-canceled'))
                console.log("Login:doFacebookLogin - Login with facebook canceled!")
                this.setLoading(false)
            }

            else {
                const data = await AccessToken.getCurrentAccessToken()

                if (!data) {
                    Alert.showText(this.props.t('facebook-login-error'))
                    console.log('Login:doFacebookLogin - Something went wrong obtaining the users access token!')
                    this.setLoading(false)
                } else {
                    fbCredential = Firebase.auth.FacebookAuthProvider.credential(data.accessToken)
                    await Firebase.auth().signInAndRetrieveDataWithCredential(fbCredential)
                    await DataBase.getCurrentUserProfile()
                }
            }

        } catch (err) {
            if (err.code === 'auth/account-exists-with-different-credential') {

                try {
                    console.warn("Login:doFacebookLogin - Trying google...")
                    const data = await GoogleSignin.signIn()
                    const gCredential = Firebase.auth.GoogleAuthProvider.credential(data.idToken, data.accessToken)
                    await Firebase.auth().signInAndRetrieveDataWithCredential(gCredential)
                    Firebase.auth().currentUser.linkWithCredential(fbCredential)
                } catch (err) {
                    Alert.showText(this.props.t('facebook-login-error'))
                    console.warn("Login:doFacebookLogin - Could not log in with Facebook:", err)
                }
            } else {
                Alert.showText(this.props.t('facebook-login-error'))
                console.warn("Login:doFacebookLogin - Could not log in with Facebook:", err)
            }
        }

        this.setLoading(false)
    }

    doGoogleLogin = async () => {
        this.setLoading(true)
        try {
            const data = await GoogleSignin.signIn()
            const credential = Firebase.auth.GoogleAuthProvider.credential(data.idToken, data.accessToken)
            await Firebase.auth().signInAndRetrieveDataWithCredential(credential)
            await DataBase.getCurrentUserProfile()

        } catch (err) {
            Alert.showText(this.props.t('google-login-error'))
            console.warn("Login:doGoogleLogin - Could not log in with Google:", err)
        }
        this.setLoading(false)
    }

    doExecuteAfterCheckPlayServices = async (func) => {
        try {
            await GoogleSignin.hasPlayServices({ autoResolve: true })
            func()
        } catch (err) {
            console.warn("Login:doExecuteAfterCheckPlayServices - User no have play services:", err)
        }
    }

    render() {

        const { styles, t, theme } = this.props

        if (this.state.loading)
            return (
                <Box fitAbsolute centralize>
                    <ActivityIndicator size="large" />
                </Box>
            )

        return (
            <Box fitAbsolute centralize alignStretch column>

                <ImageBackground style={{ flex: 1 }}
                    source={require('./home-bg.png')}>

                    <Box fitAbsolute centralize justifySpaceAround column>

                        <Text style={styles.title}>{t('app-name')}</Text>

                        <Box centralize column>

                            <Animated.View
                                style={{
                                    transform: [{
                                        translateY: this.state.buttonTranslation1.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [56, 0],
                                        })
                                    }],
                                    opacity: this.state.buttonTranslation1
                                }}>

                                <Box style={styles.loginFacebookButton} centralize>
                                    <Touchable onPress={() => this.doExecuteAfterCheckPlayServices(this.doFacebookLogin)}
                                        style={{ flex: 1 }}>
                                        <Box centralize fit padding>
                                            <Icon size={18} name={'facebook'}
                                                color={theme.palette.White.Primary.color} />
                                            <Box style={{ flex: 1 }}>
                                                <Text style={styles.loginFacebookButtonText}>{t('login-with-facebook')}</Text>
                                            </Box>
                                        </Box>
                                    </Touchable>
                                </Box>

                            </Animated.View>
                            <Animated.View
                                style={{
                                    transform: [{
                                        translateY: this.state.buttonTranslation2.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [56, 0],
                                        })
                                    }],
                                    opacity: this.state.buttonTranslation2
                                }}>

                                <Box style={styles.loginGoogleButton} centralize>
                                    <Touchable onPress={() => this.doExecuteAfterCheckPlayServices(this.doGoogleLogin)}
                                        primary style={{ flex: 1 }}>
                                        <Box centralize fit padding>
                                            <Icon size={18} name={'google'}
                                                color={theme.palette.Accent.A200.color} />
                                            <Box style={{ flex: 1 }}>
                                                <Text style={styles.loginGoogleButtonText}>{t('login-with-google')}</Text>
                                            </Box>
                                        </Box>
                                    </Touchable>
                                </Box>
                            </Animated.View>
                        </Box>
                    </Box>
                </ImageBackground>

            </Box>
        )
    }
}

const styles = theme => StyleSheet.create({
    title: {
        fontWeight: "900",
        fontSize: 56,
        color: theme.palette.White.Primary.color
    },
    loginFacebookButton: {
        width: 240,
        height: 56,
        marginTop: 16,
        backgroundColor: theme.palette.Accent.A200.color,
        borderRadius: 4
    },
    loginFacebookButtonText: {
        fontWeight: '500',
        marginLeft: 8,
        color: theme.palette.White.Primary.color
    },
    loginGoogleButton: {
        width: 240,
        height: 56,
        marginTop: 16,
        backgroundColor: theme.palette.DeepPurple['50'].color,
        borderRadius: 4
    },
    loginGoogleButtonText: {
        fontWeight: '500',
        marginLeft: 8
    }
})

export default translate('common')(withTheme(styles, Login))