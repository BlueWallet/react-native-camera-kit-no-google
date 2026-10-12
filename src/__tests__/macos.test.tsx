const mockMobile = {
  detectQRCodeInImage: jest.fn().mockResolvedValue('mobile'),
};
const mockMac = {
  getCameraDevices: jest.fn().mockResolvedValue([{ id: 'usb', name: 'USB Camera' }]),
  detectQRCodeInImage: jest.fn().mockResolvedValue('macos'),
  requestDeviceCameraAuthorization: jest.fn().mockResolvedValue(true),
  checkDeviceCameraAuthorizationStatus: jest.fn().mockResolvedValue(false),
};
let mockPlatform = 'macos';

jest.mock('react-native', () => ({
  NativeModules: { CameraKit: {} },
  Platform: { get OS() { return mockPlatform; } },
  TurboModuleRegistry: {
    getEnforcing: jest.fn(name => {
      if (name === 'RNCameraKitMacOSModule' && mockPlatform === 'macos') { return mockMac; }
      if (name === 'RNCameraKitModule' && mockPlatform !== 'macos') { return mockMobile; }
      throw new Error(`Wrong platform module loaded: ${name}`);
    }),
  },
}));

describe('platform module selection', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('loads only the macOS TurboModule and forwards methods', async () => {
    mockPlatform = 'macos';
    const api = require('../index');
    await expect(api.getCameraDevices()).resolves.toEqual([{ id: 'usb', name: 'USB Camera' }]);
    await expect(api.detectQRCodeInImage('image')).resolves.toBe('macos');
    expect(mockMac.detectQRCodeInImage).toHaveBeenCalledWith('image');
    await expect(api.requestDeviceCameraAuthorization()).resolves.toBe(true);
    await expect(api.checkDeviceCameraAuthorizationStatus()).resolves.toBe(false);
  });

  it.each(['ios', 'android'])('preserves %s module and rejects device enumeration', async platform => {
    mockPlatform = platform;
    const api = require('../index');
    await expect(api.getCameraDevices()).rejects.toThrow('only supported on macOS');
    await expect(api.detectQRCodeInImage('image')).resolves.toBe('mobile');
    expect(mockMac.getCameraDevices).not.toHaveBeenCalled();
  });

  it('rejects Android permission helpers instead of calling the unimplemented native methods', async () => {
    mockPlatform = 'android';
    const api = require('../index');
    await expect(api.requestDeviceCameraAuthorization()).rejects.toThrow('PermissionsAndroid');
    await expect(api.checkDeviceCameraAuthorizationStatus()).rejects.toThrow('PermissionsAndroid');
  });

  it('propagates device enumeration failure', async () => {
    mockPlatform = 'macos';
    const api = require('../index');
    mockMac.getCameraDevices.mockRejectedValueOnce(new Error('device discovery failed'));
    await expect(api.getCameraDevices()).rejects.toThrow('device discovery failed');
  });
});
