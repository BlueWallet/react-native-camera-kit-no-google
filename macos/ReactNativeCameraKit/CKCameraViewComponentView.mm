#import "CKCameraViewComponentView.h"
#import "CKStringConversion.h"
#include <algorithm>
#import <react/renderer/components/NativeCameraKitSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeCameraKitSpec/EventEmitters.h>
#import <react/renderer/components/NativeCameraKitSpec/Props.h>
#import <react/renderer/components/NativeCameraKitSpec/RCTComponentViewHelpers.h>
#import <AppKit/AppKit.h>
#import <AVFoundation/AVFoundation.h>
#import "ReactNativeCameraKit-Swift.h"

using namespace facebook::react;

@interface CKCameraViewComponentView () <RCTCKCameraViewProtocol>
@end

@implementation CKCameraViewComponentView {
  CKMacCameraView *_camera;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<CKCameraComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if ((self = [super initWithFrame:frame])) {
    _props = std::make_shared<const CKCameraProps>();
    [self prepareCamera];
  }
  return self;
}

- (void)prepareCamera {
  _camera = [[CKMacCameraView alloc] initWithFrame:self.bounds];
  __weak CKCameraViewComponentView *weakSelf = self;
  _camera.onReadCode = ^(NSString *value) {
    CKCameraViewComponentView *view = weakSelf;
    if (view && view->_eventEmitter) {
      std::static_pointer_cast<const CKCameraEventEmitter>(view->_eventEmitter)
          ->onReadCode({.codeStringValue = CKUTF8String(value), .codeFormat = "qr"});
    }
  };
  _camera.onError = ^(NSString *message) {
    CKCameraViewComponentView *view = weakSelf;
    if (view && view->_eventEmitter) {
      std::static_pointer_cast<const CKCameraEventEmitter>(view->_eventEmitter)
          ->onError({.errorMessage = CKUTF8String(message)});
    }
  };
  _camera.onCameraDevicesChanged = ^{
    CKCameraViewComponentView *view = weakSelf;
    if (view && view->_eventEmitter) {
      std::static_pointer_cast<const CKCameraEventEmitter>(view->_eventEmitter)->onCameraDevicesChanged({});
    }
  };
  self.contentView = _camera;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps {
  const auto &p = *std::static_pointer_cast<const CKCameraProps>(props);
  // JS supplies ['qr'] for an omitted list, preserving an explicit [] as invalid.
  const bool qrAllowed = std::find(p.allowedBarcodeTypes.begin(), p.allowedBarcodeTypes.end(), "qr") != p.allowedBarcodeTypes.end();
  NSString *deviceID = [[NSString alloc] initWithBytes:p.cameraDeviceId.data()
                                               length:p.cameraDeviceId.size()
                                             encoding:NSUTF8StringEncoding];
  [_camera configure:deviceID
            scanning:p.scanBarcode throttle:p.scanThrottleDelay
             contain:p.resizeMode == "contain" qrAllowed:qrAllowed];
  [super updateProps:props oldProps:oldProps];
}

+ (BOOL)shouldBeRecycled { return NO; }

- (void)prepareForRecycle {
  [_camera stop];
  _camera.onReadCode = nil;
  _camera.onError = nil;
  _camera.onCameraDevicesChanged = nil;
  [super prepareForRecycle];
  [self prepareCamera];
}
@end

Class<RCTComponentViewProtocol> CKCameraCls(void) {
  return CKCameraViewComponentView.class;
}
