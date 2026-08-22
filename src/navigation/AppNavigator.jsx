import React, {useEffect, useState} from 'react';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ProjectManagerDashboardScreen from '../screens/ProjectManagerDashboardScreen';
import WorkerDashboardScreen from '../screens/WorkerDashboardScreen';
import {SCREEN_NAMES} from '../constants/screenNames';

function AppNavigator() {
  const [screen, setScreen] = useState(SCREEN_NAMES.splash);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen(SCREEN_NAMES.login);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (screen === SCREEN_NAMES.splash) {
    return <SplashScreen />;
  }

  if (screen === SCREEN_NAMES.forgotPassword) {
    return (
      <ForgotPasswordScreen onBack={() => setScreen(SCREEN_NAMES.login)} />
    );
  }

  if (screen === SCREEN_NAMES.adminDashboard) {
    return <AdminDashboardScreen user={authUser} />;
  }

  if (screen === SCREEN_NAMES.pmDashboard) {
    return <ProjectManagerDashboardScreen user={authUser} />;
  }

  if (screen === SCREEN_NAMES.workerDashboard) {
    return <WorkerDashboardScreen user={authUser} />;
  }

  const handleLoginSuccess = user => {
    if (user?.role === 'admin') {
      setAuthUser(user);
      setScreen(SCREEN_NAMES.adminDashboard);
      return true;
    }

    if (user?.role === 'project_manager') {
      setAuthUser(user);
      setScreen(SCREEN_NAMES.pmDashboard);
      return true;
    }

    if (user?.role === 'worker') {
      setAuthUser(user);
      setScreen(SCREEN_NAMES.workerDashboard);
      return true;
    }

    return false;
  };

  return (
    <LoginScreen
      onForgotPassword={() => setScreen(SCREEN_NAMES.forgotPassword)}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

export default AppNavigator;
