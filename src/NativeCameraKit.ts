import { Platform } from 'react-native';
import type { Spec as MobileSpec } from './specs/NativeCameraKitModule';
import type { Spec as MacOSSpec } from './specs/NativeCameraKitMacOSModule';

// Do not evaluate the other platform's getEnforcing() call.
const NativeCameraKit: MobileSpec | MacOSSpec = Platform.OS === 'macos'
  ? require('./specs/NativeCameraKitMacOSModule').default
  : require('./specs/NativeCameraKitModule').default;

export default NativeCameraKit;
