import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  requestDeviceCameraAuthorization(): Promise<boolean>;
  checkDeviceCameraAuthorizationStatus(): Promise<boolean>;
  detectQRCodeInImage(base64: string): Promise<string | null>;
  getCameraDevices(): Promise<Array<{ id: string; name: string }>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCameraKitMacOSModule');
