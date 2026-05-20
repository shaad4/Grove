import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name : 'auth',
    initialState : {
        accessToken : null,
        user : null,
        tenant : null,
    },
    reducers : {
        setCredentials(state, {payload}) {
            state.accessToken = payload.accessToken
            state.user = payload.user
            state.tenant = payload.tenant
        },
        setAccessToken(state, {payload}){
            state.accessToken = payload
        },
        clearAuth(state){
            state.accessToken = null
            state.user = null
            state.tenant = null
        },
    },
})

export const { setCredentials, setAccessToken, clearAuth} = authSlice.actions

export const selectAccessToken = (s) => s.auth.accessToken
export const selectCurrentUser = (s) => s.auth.user
export const selectTenant      = (s) => s.auth.tenant
export const selectIsAuth      = (s) => !!s.auth.accessToken && !!s.auth.user

export default authSlice.reducer