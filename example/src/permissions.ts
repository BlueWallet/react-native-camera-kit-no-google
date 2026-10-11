import { PermissionsAndroid, Platform } from 'react-native';
import {
  checkDeviceCameraAuthorizationStatus,
  requestDeviceCameraAuthorization,
} from 'react-native-camera-kit-no-google';

export const checkCameraAccess = () =>
  Platform.OS === 'android'
    ? PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
    : checkDeviceCameraAuthorizationStatus();

export const requestCameraAccess = async () =>
  Platform.OS === 'android'
    ? (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)) === PermissionsAndroid.RESULTS.GRANTED
    : requestDeviceCameraAuthorization();
