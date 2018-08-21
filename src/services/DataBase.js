import Fuse from "fuse.js";
import FireBase from 'react-native-firebase';

const isAuth = () => {
    return !!FireBase.auth().currentUser
}

const getCurrentUser = async () => {
    const _user = {...FireBase.auth().currentUser._user}
    return _user
}

const getUser = async (uid) => {
    const dataBaseRef = FireBase.database().ref('users').child(uid)
    const dataSnapshot = await dataBaseRef.once('value')
    const user = await dataSnapshot.val()
    user.uid = user.email
    return user
}

const getCurrentUserProfile = async () => {
    try {

        if (isAuth()) {
            const currentUser = await getCurrentUser()
            const { uid } = currentUser
            const dataBaseRef = FireBase.database().ref('users').child(uid)
            const dataSnapshot = await dataBaseRef.once('value')

            if (dataSnapshot.exists() && (await dataSnapshot.val()).uid) {
                console.log("DataBase:getCurrentUserProfile - returning existing user profile")
                await dataBaseRef.set({...(await dataSnapshot.val()), providerData: currentUser.providerData})
                return await dataSnapshot.val()

            } else {
                console.info("DataBase:getCurrentUserProfile - creating new user profile and returning")
                await dataBaseRef.set(currentUser)
                return currentUser
            }
        }

        console.warn("DataBase:getCurrentUserProfile - User is not logged!")

    } catch (err) {

        console.warn("DataBase:getCurrentUserProfile -", err)
        throw new Error(err)
    }
}

const getUserProfile = async (uid) => {
    try {

        const dataBaseRef = FireBase.database().ref('users').child(uid)
        const dataSnapshot = await dataBaseRef.once('value')

        console.log("DataBase:getCurrentUserProfile - returning existing user profile")
        return await dataSnapshot.val()

    } catch (err) {

        console.warn("DataBase:getCurrentUserProfile -", err)
        throw new Error(err)
    }
}

const updateCurrentUserProfileAttribute = async (attribute, value) => {
    try {

        const { uid } = await getCurrentUserProfile()
        const dataBaseRef = FireBase.database().ref('users').child(uid).child(attribute)
        await dataBaseRef.set(value)
        return await getCurrentUserProfile()

    } catch (err) {

        console.warn("DataBase:updateProfileAttribute -", err)
        throw new Error(err)

    }
}

const searchUsers = async (_query, limit = 1024) => {
    try {

        const query = (_query || '')
        const dataBaseRef = FireBase.database().ref('users')
        const dataSnapshot = await dataBaseRef
            .orderByChild('displayName')
            .startAt(query.toUpperCase().slice(0, 3).replace(/[^\w\d]*/g, ''))
            .endAt(query.toLowerCase().slice(0, 3).replace(/[^\w\d]*/g, '') + "\uf8ff")
            .limitToFirst(limit)
            .once('value')

        const dataSnapshot2 = await dataBaseRef
            .orderByChild('email')
            .startAt(query.toUpperCase().slice(0, 3).replace(/[^\w\d]*/g, ''))
            .endAt(query.toLowerCase().slice(0, 3).replace(/[^\w\d]*/g, '') + "\uf8ff")
            .limitToFirst(limit)
            .once('value')

        const users = {}
        dataSnapshot.forEach(cs => {
            users[cs.key] = ({ ...cs.val(), uid: cs.key })
        })
        dataSnapshot2.forEach(cs => {
            users[cs.key] = ({ ...cs.val(), uid: cs.key })
        })

        const queryOptions = {
            keys: [{
                name: 'displayName',
                weight: .7
            }, {
                name: 'email',
                weight: .3
            }]
        };
        var fuse = new Fuse(Object.keys(users).map(k => users[k]), queryOptions)

        return fuse.search(query)

    } catch (err) {

        console.warn("DataBase:searchUsers -", err)
        throw new Error(err)

    }
}


const createBreak = async (_break) => {
    try {

        const { uid } = await getCurrentUser()
        _break.userUid = uid
        await FireBase.database().ref('breaks').push(_break)

    } catch (err) {

        console.warn("DataBase:createBreak -", err)
        throw new Error(err)

    }
}

const updateBreak = async (_break) => {
    try {

        const { uid } = _break
        const dataBaseRef = FireBase.database().ref('breaks').child(uid)
        await dataBaseRef.set(_break)
        return _break

    } catch (err) {

        console.warn("DataBase:updateBreak -", err)
        throw new Error(err)

    }
}

const deleteBreak = async (_break) => {
    try {

        const { uid } = _break
        const dataBaseRef = FireBase.database().ref('breaks').child(uid)
        await dataBaseRef.remove()
        return _break

    } catch (err) {

        console.warn("DataBase:updateBreak -", err)
        throw new Error(err)

    }
}


const getBreaks = async (user) => {
    try {

        const { uid } = user ? user : (await getCurrentUser())
        const dataBaseRef = FireBase.database().ref('breaks')
        const dataSnapshot = await dataBaseRef
            .orderByChild('userUid')
            .equalTo(uid)
            .once('value')

        const _breaks = []
        dataSnapshot.forEach(cs => {
            _breaks.push({ ...cs.val(), uid: cs.key })
        })
        return _breaks

    } catch (err) {

        console.warn("DataBase:getBreaks -", err)
        throw new Error(err)

    }
}

const addOnBreakCreatedListener = async listener => {
    try {
        FireBase.database().ref('breaks').on('child_added', listener)
        FireBase.database().ref('breaks').on('child_changed', listener)
        FireBase.database().ref('breaks').on('child_removed', listener)
    } catch (err) {
        console.warn("DataBase:addOnBreakCreatedListener -", err)
        throw new Error(err)
    }
}

const removeOnBreakCreatedListener = async listener => {
    try {
        FireBase.database().ref('breaks').off('child_added', listener)
        FireBase.database().ref('breaks').off('child_changed', listener)
        FireBase.database().ref('breaks').off('child_removed', listener)
    } catch (err) {
        console.warn("DataBase:addOnBreakCreatedListener -", err)
        throw new Error(err)
    }
}


const createMeeting = async (_meeting) => {
    try {

        const { uid } = await getCurrentUser()
        _meeting.userUid = uid
        const ref = FireBase.database().ref('meetings').push()
        _meeting.uid = ref.key
        await ref.set(_meeting)
        return _meeting

    } catch (err) {

        console.warn("DataBase:createMeeting -", err)
        throw new Error(err)

    }
}

const updateMeeting = async (_meeting) => {
    try {

        const { uid } = _meeting
        const dataBaseRef = FireBase.database().ref('meetings').child(uid)
        await dataBaseRef.set(_meeting)
        return _meeting

    } catch (err) {

        console.warn("DataBase:updateMeeting -", err)
        throw new Error(err)

    }
}

const deleteMeeting = async (_meeting) => {
    try {

        const { uid } = _meeting
        const dataBaseRef = FireBase.database().ref('meetings').child(uid)
        await dataBaseRef.remove()
        return _meeting

    } catch (err) {

        console.warn("DataBase:updateMeeting -", err)
        throw new Error(err)

    }
}


const getMeetings = async () => {
    try {

        const { uid } = await getCurrentUser()
        const dataBaseRef = FireBase.database().ref('meetings')
        const dataSnapshot = await dataBaseRef
            .orderByChild('userUid')
            .equalTo(uid)
            .once('value')

        const _meetings = []
        dataSnapshot.forEach(cs => {
            _meetings.push({ ...cs.val(), uid: cs.key })
        })
        return _meetings

    } catch (err) {

        console.warn("DataBase:getMeetings -", err)
        throw new Error(err)

    }
}

const getMeetingsParticipating = async () => {
    try {

        const { uid } = await getCurrentUser()
        const dataBaseRef = FireBase.database().ref('meetings')
        const dataSnapshot = await dataBaseRef
            .orderByChild(`selectedSuggestion/users/${uid}`)
            .equalTo(true)
            .once('value')
        const _meetings = []
        dataSnapshot.forEach(cs => {
            if (cs.val().userUid !== uid)
                _meetings.push({ ...cs.val(), uid: cs.key })
        })
        return _meetings

    } catch (err) {

        console.warn("DataBase:getMeetings -", err)
        throw new Error(err)

    }
}

const addOnMeetingCreatedListener = async listener => {
    try {
        FireBase.database().ref('meetings').on('child_added', listener)
        FireBase.database().ref('meetings').on('child_changed', listener)
        FireBase.database().ref('meetings').on('child_removed', listener)
    } catch (err) {
        console.warn("DataBase:addOnMeetingCreatedListener -", err)
        throw new Error(err)
    }
}

const removeOnMeetingCreatedListener = async listener => {
    try {
        FireBase.database().ref('meetings').off('child_added', listener)
        FireBase.database().ref('meetings').off('child_changed', listener)
        FireBase.database().ref('meetings').off('child_removed', listener)
    } catch (err) {
        console.warn("DataBase:addOnMeetingCreatedListener -", err)
        throw new Error(err)
    }
}


export default {
    isAuth,
    getCurrentUser,
    getCurrentUserProfile,
    getUserProfile,
    updateCurrentUserProfileAttribute,
    searchUsers,

    createBreak,
    updateBreak,
    deleteBreak,
    getBreaks,
    addOnBreakCreatedListener,
    removeOnBreakCreatedListener,

    createMeeting,
    updateMeeting,
    deleteMeeting,
    getMeetings,
    getMeetingsParticipating,
    addOnMeetingCreatedListener,
    removeOnMeetingCreatedListener
}