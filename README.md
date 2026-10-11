<h1 align="center">
    🎈 React Native Camera Kit (No Google)
</h1>

<p align="center">
  A <strong>high performance, easy to use, rock solid</strong><br>
  camera library for React Native apps.<br>
  <strong>No Google dependencies.</strong>
</p>

<p align="center">
  <a href="https://github.com/limpbrains/react-native-camera-kit-no-google/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="React Native Camera Kit is released under the MIT license." />
  </a>
  <a href="https://www.npmjs.org/package/react-native-camera-kit-no-google">
    <img src="https://badge.fury.io/js/react-native-camera-kit-no-google.svg" alt="Current npm package version." />
  </a>
</p>

> **⚠️ Fork Notice**
>
> This is a fork of [teslamotors/react-native-camera-kit](https://github.com/teslamotors/react-native-camera-kit) with **Google ML Kit removed** from Android.
>
> **Why?** Google ML Kit is closed source. This fork uses a completely open source pure Kotlin QR decoder instead.

## Key Differences from Original

| Feature | Original | This Fork |
|---------|----------|-----------|
| Android barcode library | Google ML Kit (closed source) | Pure Kotlin ([limpbrains/qr](https://github.com/limpbrains/qr)) |
| Source code | Closed source (ML Kit) | Fully open source |
| Google Play Services | Required | Not required |
| Barcode formats | Multiple formats | **QR codes only** |

### Limitations

- **Android barcode scanning supports QR codes only** (no EAN, UPC, Code128, etc.)
- iOS barcode scanning is unchanged (uses native AVFoundation, supports all formats)

### QR Decoder Attribution

The Android QR decoder is based on:
- [limpbrains/qr](https://github.com/limpbrains/qr) - Kotlin QR code reader library
- [paulmillr/qr](https://github.com/paulmillr/qr) - Original JavaScript implementation by Paul Miller

<table>
  <tr>
    <td>
      <img src="images/screenshot.jpg"/>
    </td>
    <td>
      <ul>
        <li><h3>Cross Platform (iOS and Android)</h3></li>
        <li><h3>Optimized for performance and high photo capture rate</h3></li>
        <li><h3>QR Code scanning support (QR only on Android)</h3></li>
        <li><h3>Face detection support (iOS only)</h3></li>
        <li><h3>Camera preview support in iOS simulator</h3></li>
        <li><h3>No Google dependencies</h3></li>
      </ul>
    </td>
  </tr>
</table>

## Installation (RN > 0.60)

```bash
yarn add react-native-camera-kit-no-google
```

```bash
cd ios && pod install && cd ..
```

Android:
[Review your Kotlin configuration](./docs/kotlin.md) to ensure it's compatible with this library.

## Permissions

You must use a separate library for prompting the user for permissions before rendering the `<Camera .../>` component.  
We recommend zoontek's library, react-native-permissions:
https://github.com/zoontek/react-native-permissions#ios-flow

**If you fail to prompt for permission, the camera will appear blank / black.**

### Why no permissions API?

Conceptually, permissions are simple: Granted / Denied.  
However, in reality it's not that simple due to privacy enhancements on iOS and Android.

[Here's an example diagram from react-native-permissions's README](https://github.com/zoontek/react-native-permissions#ios-flow), which illustrates the complexity of the user-experience, which we don't want to duplicate in a camera library:

```
   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   ┃ check(PERMISSIONS.IOS.CAMERA) ┃
   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                   │
       Is the feature available
           on this device ?
                   │           ╔════╗
                   ├───────────║ NO ║──────────────┐
                   │           ╚════╝              │
                ╔═════╗                            ▼
                ║ YES ║                 ┌─────────────────────┐
                ╚═════╝                 │ RESULTS.UNAVAILABLE │
                   │                    └─────────────────────┘
           Is the permission
             requestable ?
                   │           ╔════╗
                   ├───────────║ NO ║──────────────┐
                   │           ╚════╝              │
                ╔═════╗                            ▼
                ║ YES ║                  ┌───────────────────┐
                ╚═════╝                  │ RESULTS.BLOCKED / │
                   │                     │ RESULTS.LIMITED / │
                   │                     │  RESULTS.GRANTED  │
                   ▼                     └───────────────────┘
          ┌────────────────┐
          │ RESULTS.DENIED │
          └────────────────┘
                   │
                   ▼
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ request(PERMISSIONS.IOS.CAMERA) ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                   │
         Does the user accept
            the request ?
                   │           ╔════╗
                   ├───────────║ NO ║──────────────┐
                   │           ╚════╝              │
                ╔═════╗                            ▼
                ║ YES ║                   ┌─────────────────┐
                ╚═════╝                   │ RESULTS.BLOCKED │
                   │                      └─────────────────┘
                   ▼
          ┌─────────────────┐
          │ RESULTS.GRANTED │
          └─────────────────┘
```

In earlier versions of react-native-camera-kit, permissions were provided with an API, but for the above reasons, these APIs will be removed.

#### Android

Add the following uses-permission to your `AndroidManifest.xml` (usually found at: `android/src/main/`)

```java
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

#### iOS

Add the following usage descriptions to your `Info.plist` (usually found at: `ios/PROJECT_NAME/`)

```xml
<key>NSCameraUsageDescription</key>
<string>For taking photos</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>For saving photos</string>
```

## Running the example project

- `yarn bootstrap`
- `yarn example ios` or `yarn example android`

## Components

### Camera

Barebones camera component if you need advanced/customized interface

```ts
import { Camera, CameraType } from 'react-native-camera-kit-no-google';
```

```tsx
<Camera
  ref={(ref) => (this.camera = ref)}
  cameraType={CameraType.Back} // front/back(default)
  flashMode="auto"
/>
```

#### Barcode / QR Code Scanning

Additionally, the Camera can be used for barcode scanning

```tsx
<Camera
  ...
  // Barcode props
  scanBarcode={true}
  onReadCode={(event) => Alert.alert('QR code found')} // optional
  showFrame={true} // (default false) optional, show frame with transparent layer (qr code or barcode will be read on this area ONLY), start animation for scanner, that stops when a code has been found. Frame always at center of the screen
  laserColor='red' // (default red) optional, color of laser in scanner frame
  frameColor='white' // (default white) optional, color of border of scanner frame
/>
```

#### Face Detection

Detect faces in real time on **iOS** using Apple Vision.

> **Android:** Face detection is not available in this fork (upstream uses Google ML Kit). Enabling `faceDetectionEnabled` on Android fires `onFaceDetectionInstallStatus` once with `'unavailable'`.

```tsx
<Camera
  ...
  faceDetectionEnabled={true}
  faceDetectionThrottleMs={100} // optional, default 100ms
  onFaceDetected={(event) => {
    // event.nativeEvent.faces: FaceData[]
    // each face: { id, yaw, pitch, roll, boundsX, boundsY, boundsWidth, boundsHeight }
  }}
/>
```

### Camera Props (Optional)

| Props                           | Type                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`                           | Ref                                    | Reference on the camera view                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `style`                         | StyleProp\<ViewStyle>                  | Style to apply on the camera view                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `flashMode`                     | `'on'`/`'off'`/`'auto'`                | Camera flash mode. Default: `auto`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `focusMode`                     | `'on'`/`'off'`                         | Camera focus mode. Default: `on`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `zoomMode`                      | `'on'`/`'off'`                         | Enable the pinch to zoom gesture. Default: `on`. If `on`, you must pass `zoom` as `undefined` or avoid setting `zoomMode` to allow pinch to zoom                                                                                                                                                                                                                                                                                                           |
| `zoom`                          | `number`                               | Control the zoom. Default: `1.0`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `maxZoom`                       | `number`                               | Maximum zoom allowed (but not beyond what camera allows). Default: `undefined` (camera default max)                                                                                                                                                                                                                                                                                                                                                        |
| `onZoom`                        | Function                               | Callback when user makes a pinch gesture, regardless of what the `zoom` prop was set to. Returned event contains `zoom`. Ex: `onZoom={(e) => console.log(e.nativeEvent.zoom)}`.                                                                                                                                                                                                                                                                            |
| `torchMode`                     | `'on'`/`'off'`                         | Toggle flash light when camera is active. Default: `off`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `cameraType`                    | CameraType.Back/CameraType.Front       | Choose what camera to use. Default: `CameraType.Back`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `onOrientationChange`           | Function                               | Callback when physical device orientation changes. Returned event contains `orientation`. Ex: `onOrientationChange={(event) => console.log(event.nativeEvent.orientation)}`. Use `import { Orientation } from 'react-native-camera-kit-no-google'; if (event.nativeEvent.orientation === Orientation.PORTRAIT) { ... }` to understand the new value                                                                                                       |
| `allowedBarcodeTypes`           | string[]                               | Limits which barcode formats can be detected. Ex: `['qr', 'ean-13', 'code-128']`. If empty or omitted, all supported formats are scanned. **Note**: Android only supports `'qr'` in this fork. iOS supports all formats.                                                                                                                                                                                                                                   |
| **Android only**                |
| `onError`                       | Function                               | Android only. Callback when camera fails to initialize. Ex: `onError={(e) => console.log(e.nativeEvent.errorMessage)}`.                                                                                                                                                                                                                                                                                                                                    |
| `shutterPhotoSound`             | `boolean`                              | Android only. Enable or disable the shutter sound when capturing a photo. Default: `true`                                                                                                                                                                                                                                                                                                                                                                  |
| **iOS only**                    |
| `ratioOverlay`                  | `'int:int'`                            | Show a guiding overlay in the camera preview for the selected ratio. Does not crop image as of v9.0. Example: `'16:9'`                                                                                                                                                                                                                                                                                                                                     |
| `ratioOverlayColor`             | Color                                  | Any color with alpha. Default: `'#ffffff77'`                                                                                                                                                                                                                                                                                                                                                                                                               |
| `resetFocusTimeout`             | `number`                               | Dismiss tap to focus after this many milliseconds. Default `0` (disabled). Example: `5000` is 5 seconds.                                                                                                                                                                                                                                                                                                                                                   |
| `resetFocusWhenMotionDetected`  | Boolean                                | Dismiss tap to focus when focus area content changes. Native iOS feature, see documentation: https://developer.apple.com/documentation/avfoundation/avcapturedevice/1624644-subjectareachangemonitoringenabl?language=objc). Default `true`.                                                                                                                                                                                                               |
| `resizeMode`                    | `'cover' / 'contain'`                  | Determines the scaling and cropping behavior of content within the view. `cover` (resizeAspectFill on iOS) scales the content to fill the view completely, potentially cropping content if its aspect ratio differs from the view. `contain` (resizeAspect on iOS) scales the content to fit within the view's bounds without cropping, ensuring all content is visible but may introduce letterboxing. Default behavior depends on the specific use case. |
| `scanThrottleDelay`             | `number`                               | Duration between scan detection in milliseconds. Default 2000 (2s)                                                                                                                                                                                                                                                                                                                                                                                         |
| `maxPhotoQualityPrioritization` | `'balanced'` / `'quality'` / `'speed'` | [iOS 13 and newer](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/3182995-maxphotoqualityprioritization). `'speed'` provides a 60-80% median capture time reduction vs 'quality' setting. Tested on iPhone 6S Max (66% faster) and iPhone 15 Pro Max (76% faster!). Default `balanced`                                                                                                                                        |
| `iOsDeferredStart`              | `boolean`                              | iOS 26+ only. Enables `AVCaptureOutput.deferredStartEnabled` when supported to get the preview visible faster. Default `true`. When enabled, the first capture can be delayed by a few hundred milliseconds. Ignored on Android and on older iOS versions.                                                                                                                                                                                                 |
| `onCaptureButtonPressIn`        | Function                               | Callback when iPhone capture button is pressed in or Android volume or camera button is pressed in. Ex: `onCaptureButtonPressIn={() => console.log("volume button pressed in")}`                                                                                                                                                                                                                                                                           |
| `onCaptureButtonPressOut`       | Function                               | Callback when iPhone capture button is released or Android volume or camera button is released. Ex: `onCaptureButtonPressOut={() => console.log("volume button released")}`                                                                                                                                                                                                                                                                                |
| **Barcode only**                |
| `scanBarcode`                   | `boolean`                              | Enable barcode scanner. Default: `false`                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `showFrame`                     | `boolean`                              | Show frame in barcode scanner. Default: `false`                                                                                                                                                                                                                                                                                                                                                                                                            |
| `barcodeFrameSize`              | `object`                               | Frame size of barcode scanner. Default: `{ width: 300, height: 150 }`                                                                                                                                                                                                                                                                                                                                                                                      |
| `laserColor`                    | Color                                  | Color of barcode scanner laser visualization. Default: `red`                                                                                                                                                                                                                                                                                                                                                                                               |
| `frameColor`                    | Color                                  | Color of barcode scanner frame visualization. Default: `yellow`                                                                                                                                                                                                                                                                                                                                                                                            |
| `onReadCode`                    | Function                               | Callback when scanner successfully reads barcode. Returned event contains `codeStringValue`. Default: `null`. Ex: `onReadCode={(event) => console.log(event.nativeEvent.codeStringValue)}`                                                                                                                                                                                                                                                                 |
| **Face detection (iOS only)**   |
| `faceDetectionEnabled`          | `boolean`                              | Enable real-time face detection on iOS. Default: `false`. On Android, enabling fires `onFaceDetectionInstallStatus` with `'unavailable'`.                                                                                                                                                                                                                                                  |
| `faceDetectionThrottleMs`       | `number`                               | Minimum milliseconds between `onFaceDetected` emits. Default: `100`. iOS only.                                                                                                                                                                                                                                                                                                                                                                             |
| `onFaceDetected`                | Function                               | Callback while face detection is active on iOS, with one entry per detected face (empty array if none).                                                                                                                                                                                                                                                                                    |
| `onFaceDetectionInstallStatus`  | Function                               | **Android only.** Fires `'unavailable'` when face detection is enabled (not supported in this fork).                                                                                                                                                                                                                                                                                       |

### detectQRCodeInImage(base64)

Detect and decode a QR code from a static image. Takes a base64-encoded image string. Returns a promise that resolves with the decoded string, or `null` if the image is valid but contains no QR code. Rejects only on actual errors (invalid base64, undecodable image data, detector failure).

```ts
import { detectQRCodeInImage } from 'react-native-camera-kit-no-google';

try {
  const decoded = await detectQRCodeInImage(base64ImageData);
  if (decoded === null) {
    // Image was valid but no QR code was found
  } else {
    console.log('QR code:', decoded);
  }
} catch (e) {
  // Invalid image data or internal detection failure — e.message has details
}
```

Rejection error codes: `E_INVALID_IMAGE` (bad base64 or undecodable image) and `E_QR_DETECTION_FAILED` (Android: QR decoder error; iOS: Vision framework error or detector init failure).

This API is exclusive to this fork and is not available in the original react-native-camera-kit.

It does **not** require camera permissions — it works purely on image data. Useful for detecting QR codes from:
- Images picked from the photo library
- Clipboard images
- Files received via deep links or share extensions

| Platform | Implementation |
|----------|---------------|
| iOS (device) | Vision framework (`VNDetectBarcodesRequest`) |
| iOS (simulator) | CoreImage (`CIDetector`) |
| Android | [limpbrains/qr](https://github.com/limpbrains/qr) |

### Imperative API

_Note: Must be called on a valid camera ref_

#### capture()

Capture image as JPEG.

A temporary file is created. You _must_ move this file to a permanent location (e.g. the app's 'Documents' folder) if you need it beyond the current session of the app as it may be deleted when the user leaves the app. You can move files by using a file system library such as [react-native-fs](https://github.com/itinance/react-native-fs) or [expo-filesystem](https://docs.expo.io/versions/latest/sdk/filesystem/).
(On Android we currently have an unsupported `outputPath` prop but it's subject to change at any time).

Note that the reason you're getting a URL despite it being a file is because Android 10+ encourages URIs. To keep things consistent regardless of settings or platform we always send back a URI.

```ts
const { uri } = await this.camera.capture();
// uri = 'file:///data/user/0/com.myorg.myapp/cache/ckcap123123123123.jpg'
```

If you want to store it permanently, here's an example using [react-native-fs](https://github.com/itinance/react-native-fs):

```ts
import RNFS from 'react-native-fs';
// [...]
let { uri } = await this.camera.capture();
if (uri.startsWith('file://')) {
  // Platform dependent, iOS & Android uses '/'
  const pathSplitter = '/';
  // file:///foo/bar.jpg => /foo/bar.jpg
  const filePath = uri.replace('file://', '');
  // /foo/bar.jpg => [foo, bar.jpg]
  const pathSegments = filePath.split(pathSplitter);
  // [foo, bar.jpg] => bar.jpg
  const fileName = pathSegments[pathSegments.length - 1];

  await RNFS.moveFile(filePath, `${RNFS.DocumentDirectoryPath}/${fileName}`);
  uri = `file://${destFilePath}`;
}
```

## Using with Expo

If you are using Expo Managed Workflow, you can use this library with a third-party plugin `expo-react-native-camera-kit`.

[See more here](https://github.com/avantstay/expo-react-native-camera-kit)

## Contributing

The [Android camera QR test](e2e/android/scan-qr.yaml) uses Maestro to check the
decoded value `Craig Wright Is Not Satoshi` through the emulator's `imagefile`
rear camera. CI uploads an MP4 recording, JUnit results, screenshots, and logs.
To run locally with a bundled release example APK and an emulator configured
with `-camera-back imagefile:$PWD/e2e/android/fixtures/qr.png`:

```sh
node e2e/android/run.mjs --serial emulator-5556
```

- Pull Requests are welcome, if you open a pull request we will do our best to get to it in a timely manner
- Pull Request Reviews are even more welcome! we need help testing, reviewing, and updating open PRs
- If you are interested in contributing more actively, please contact us.

## License

The MIT License.

See [LICENSE](LICENSE)
