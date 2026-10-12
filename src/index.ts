import { NativeModules, Platform } from 'react-native';

import Camera from './Camera';
import NativeCameraKitModule from './NativeCameraKit';
import {
  CameraType,
  type CameraApi,
  type CaptureData,
  type FlashMode,
  type FocusMode,
  type TorchMode,
  type ZoomMode,
  type ResizeMode,
  type CodeFormat,
} from './types';

const { CameraKit } = NativeModules;

export const detectQRCodeInImage = (base64: string): Promise<string | null> => {
  return NativeCameraKitModule.detectQRCodeInImage(base64);
};

export type CameraDevice = { id: string; name: string };

export const getCameraDevices = (): Promise<CameraDevice[]> => {
  if (Platform.OS !== 'macos' || !('getCameraDevices' in NativeCameraKitModule)) {
    return Promise.reject(new Error('getCameraDevices() is only supported on macOS.'));
  }
  return NativeCameraKitModule.getCameraDevices();
};

export const requestDeviceCameraAuthorization = (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return Promise.reject(new Error('Use PermissionsAndroid to request camera access on Android.'));
  }
  return NativeCameraKitModule.requestDeviceCameraAuthorization();
};
export const checkDeviceCameraAuthorizationStatus = (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return Promise.reject(new Error('Use PermissionsAndroid to check camera access on Android.'));
  }
  return NativeCameraKitModule.checkDeviceCameraAuthorizationStatus();
};

// Start with portrait/pointing up, increment while moving counter-clockwise
export const Orientation = {
  PORTRAIT: 0, // ⬆️
  LANDSCAPE_LEFT: 1, // ⬅️
  PORTRAIT_UPSIDE_DOWN: 2, // ⬇️
  LANDSCAPE_RIGHT: 3, // ➡️
};

export default CameraKit;

export { Camera, CameraType };
export type {
    TorchMode,
    FlashMode,
    FocusMode,
    ZoomMode,
    CameraApi,
    CaptureData,
    ResizeMode,
    CodeFormat,
};
