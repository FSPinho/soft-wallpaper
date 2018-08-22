import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { AsyncStorage } from 'react-native';
import RNLanguages from 'react-native-languages';
import OneSignal from 'react-native-onesignal';
import { RootNavigator } from './navigation';
import { i18n } from './services';
import { ThemeProvider } from './theme';

class App extends React.Component {

    async componentWillMount() {
        RNLanguages.addEventListener('change', this.onLanguagesChange)

        OneSignal.init("33a1e47f-a59f-469a-bd05-8fadec55dce7");
    }

    async componentDidMount() {
        OneSignal.addEventListener('opened', this.onNotificationOpened)
        OneSignal.addEventListener('ids', this.onIds)
        OneSignal.configure()
    }

    componentWillUnmount() {
        RNLanguages.removeEventListener('change', this.onLanguagesChange)
        OneSignal.removeEventListener('opened', this.onNotificationOpened());
        OneSignal.removeEventListener('ids', this.onIds);
    }

    onLanguagesChange = ({language}) => {
        i18n.changeLanguage(language)
    }

    onNotificationOpened = openResult => {
        // console.log('Message: ', openResult.notification.payload.body);
        // console.log('Data: ', openResult.notification.payload.additionalData);
        // console.log('isActive: ', openResult.notification.isAppInFocus);
        // console.log('openResult: ', openResult);
    }

    onIds = async (device) => {
        const {userId} = device

        try {
            await AsyncStorage.setItem("OneSignal:userId", userId)
            // await DataBase.updateCurrentUserProfileAttribute('oneSignalDeviceId', userId)
        } catch (err) {
            /** ... */
        }
    }

    render() {
        return (
            <I18nextProvider i18n={i18n}>
                <ThemeProvider>
                    <RootNavigator/>
                </ThemeProvider>
            </I18nextProvider>
        )
    }
}

export default App