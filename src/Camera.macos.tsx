import React from 'react';
import type { CameraApi } from './types';
import type { CameraProps } from './CameraProps';
import NativeCamera from './specs/CameraNativeComponent';
import NativeCameraKit from './NativeCameraKit';

const Camera = React.forwardRef<CameraApi, CameraProps>((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    capture: () => Promise.reject(
      new Error('Camera.capture() is not supported on macOS; only QR scanning is available.'),
    ),
    requestDeviceCameraAuthorization: () => NativeCameraKit.requestDeviceCameraAuthorization(),
    checkDeviceCameraAuthorizationStatus: () => NativeCameraKit.checkDeviceCameraAuthorizationStatus(),
  }), []);

  const nativeProps = {
    ...props,
    allowedBarcodeTypes: props.allowedBarcodeTypes ?? ['qr'],
    scanThrottleDelay: props.scanThrottleDelay ?? 2000,
  };
  // Public color and event types differ from the generated native view types.
  // @ts-expect-error props for codegen differ from the user-facing ones
  return <NativeCamera {...nativeProps} />;
});

export default Camera;
