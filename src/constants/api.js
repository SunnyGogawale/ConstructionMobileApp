import {Platform} from 'react-native';

const API_BASE_URL = Platform.select({
  ios: 'http://localhost:5002/api/v1',
  android: 'http://10.0.2.2:5002/api/v1',
  default: 'http://localhost:5002/api/v1',
});

export default API_BASE_URL;
