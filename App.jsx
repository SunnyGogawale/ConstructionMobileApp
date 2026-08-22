/**
 * @format
 */

import React from 'react';
import {Provider} from 'react-redux';
import store from './src/redux/store';
import {AuthProvider} from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </Provider>
  );
}

export default App;
