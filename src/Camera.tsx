import { lazy } from 'react';
import { Platform } from 'react-native';

const Camera = lazy(() =>
  Platform.OS === 'ios'
    ? import('./Camera.ios')
    : Platform.OS === 'macos'
      ? import('./Camera.macos')
      : import('./Camera.android'),
);

export default Camera;
