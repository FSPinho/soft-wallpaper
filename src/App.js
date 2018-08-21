import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { AsyncStorage } from 'react-native';
import BackgroundTask from 'react-native-background-task';
import RNLanguages from 'react-native-languages';
import OneSignal from 'react-native-onesignal';
import { RootNavigator } from './navigation';
import { i18n } from './services';
import DataBase from "./services/DataBase";
import { ThemeProvider } from './theme';




BackgroundTask.define(async () => {

    try {

        // const i18n.t('')

    } catch (err) {
        /** ... */
    }

    BackgroundTask.finish()

})


class App extends React.Component {

    async componentWillMount() {
        RNLanguages.addEventListener('change', this.onLanguagesChange)

        OneSignal.init("33a1e47f-a59f-469a-bd05-8fadec55dce7");
    }

    async componentDidMount() {
        BackgroundTask.schedule()

        await this.doCheckBackgroundServiceStatus()

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
            await DataBase.updateCurrentUserProfileAttribute('oneSignalDeviceId', userId)
        } catch (err) {
            /** ... */
        }
    }

    async doCheckBackgroundServiceStatus() {
        const status = await BackgroundTask.statusAsync()

        if (status.available) {
            console.log("App:doCheckBackgroundServiceStatus - Running!")
        } else {
            const reason = status.unavailableReason
            if (reason === BackgroundTask.UNAVAILABLE_DENIED) {
                console.log("App:doCheckBackgroundServiceStatus - Unavailable denied!")
            } else if (reason === BackgroundTask.UNAVAILABLE_RESTRICTED) {
                console.log("App:doCheckBackgroundServiceStatus - Unavailable restricted!")
            }
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