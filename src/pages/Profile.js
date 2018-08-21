import React from 'react'
import {Image, StyleSheet, Text, ActivityIndicator} from 'react-native'
import {translate} from 'react-i18next'

import {Alert, DataBase} from '../services'
import {Box, Page, Paper} from '../components'
import {withTheme} from '../theme'


class Profile extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            user: null,
            loading: true,
        }
    }

    async asyncSetState(state) {
        return new Promise(a => {
            this.setState({
                ...this.state,
                ...state
            }, a)
        })
    }

    async componentWillMount() {
        try {
            await this.doSetLoading(true)
            const user = await DataBase.getCurrentUserProfile()
            if (user)
                await this.asyncSetState({user})
            await this.doSetLoading(false)
        } catch (err) {
            Alert.showLongText(this.props.t('something-went-wrong'))
            console.warn("Profile:componentWillMount - cant get current user profile!")
        }
    }

    doSetLoading = async loading => {
        await this.asyncSetState({loading})
    }

    render() {
        const {t, styles, theme} = this.props
        const {user, loading} = this.state

        if (loading)
            return (
                <Box fitAbsolute centralize>
                    <ActivityIndicator/>
                </Box>
            )

        if (!user)
            return (
                <Box fitAbsolute centralize>
                    <Text>{t('something-went-wrong')}</Text>
                </Box>
            )

        return (
            <Page>
                <Box fit centralize>
                    <Paper>
                        {
                            loading ? (
                                <ActivityIndicator size="large" color={theme.palette.Primary["500"].color}/>
                            ) : (
                                <Box column padding>
                                    <Image source={{uri: user.photoURL + '?type=square&width=192'}}
                                           style={styles.avatar}/>
                                    <Text style={styles.displayName}>
                                        {user.displayName}
                                    </Text>
                                </Box>
                            )
                        }
                    </Paper>
                </Box>
            </Page>
        )
    }
}

const styles = theme => StyleSheet.create({
    avatar: {
        width: 192,
        height: 192,
        marginBottom: 16
    },
    displayName: {
        color: theme.paperTextPrimary.color,
    }
})

export default translate('common')(withTheme(styles, Profile))