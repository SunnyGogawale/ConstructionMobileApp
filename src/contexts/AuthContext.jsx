import React, {createContext, useCallback, useMemo, useReducer} from 'react';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return {...state, isLoading: true, error: null};
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGIN_FAILURE':
      return {...state, isLoading: false, error: action.payload};
    case 'LOGOUT':
      return {...initialState};
    case 'CLEAR_ERROR':
      return {...state, error: null};
    default:
      return state;
  }
}

export function AuthProvider({children}) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loginStart = useCallback(() => dispatch({type: 'LOGIN_START'}), []);

  const loginSuccess = useCallback(
    (user, token) => dispatch({type: 'LOGIN_SUCCESS', payload: {user, token}}),
    [],
  );

  const loginFailure = useCallback(
    error => dispatch({type: 'LOGIN_FAILURE', payload: error}),
    [],
  );

  const logout = useCallback(() => dispatch({type: 'LOGOUT'}), []);

  const clearError = useCallback(() => dispatch({type: 'CLEAR_ERROR'}), []);

  const value = useMemo(
    () => ({...state, loginStart, loginSuccess, loginFailure, logout, clearError}),
    [state, loginStart, loginSuccess, loginFailure, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
