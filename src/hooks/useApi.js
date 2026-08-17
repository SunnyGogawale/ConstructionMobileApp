import {useCallback, useReducer} from 'react';

const initialState = {data: null, loading: false, error: null};

function reducer(state, action) {
  switch (action.type) {
    case 'REQUEST':
      return {data: null, loading: true, error: null};
    case 'SUCCESS':
      return {data: action.payload, loading: false, error: null};
    case 'FAILURE':
      return {data: null, loading: false, error: action.payload};
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function useApi(apiFn) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const execute = useCallback(
    async (...args) => {
      dispatch({type: 'REQUEST'});
      try {
        const result = await apiFn(...args);
        dispatch({type: 'SUCCESS', payload: result});
        return result;
      } catch (err) {
        dispatch({type: 'FAILURE', payload: err.message});
        throw err;
      }
    },
    [apiFn],
  );

  const reset = useCallback(() => dispatch({type: 'RESET'}), []);

  return {...state, execute, reset};
}

export default useApi;
