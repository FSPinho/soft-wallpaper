import React from 'react'
import PropTypes from 'prop-types'
import {StyleSheet, ScrollView, View} from 'react-native'

import Box from './Box'
import {withTheme} from '../theme'


class Page extends React.Component {

    render() {

        const {
            children,
            style,
            styles,
            noBackground,
            ...anotherProps
        } = this.props

        const _styles = []

        if (noBackground) {
            _styles.push(styles.noBackground)
        }

        _styles.push(styles.root)
        _styles.push(style)

        return (
            <Box fitAbsolute
                 style={_styles}
                 {...anotherProps}>
                {children}
            </Box>
        )
    }
}

Page.defaultProps = {
    noBackground: false,
}

Page.propTypes = {
    noBackground: PropTypes.bool,
    children: PropTypes.any,
    style: PropTypes.any,
}

const styles = (theme) => StyleSheet.create({
    root: {
        backgroundColor: theme.page.backgroundColor,
    },
    noBackground: {
        backgroundColor: 'transparent'
    }
})

export default withTheme(styles, Page)