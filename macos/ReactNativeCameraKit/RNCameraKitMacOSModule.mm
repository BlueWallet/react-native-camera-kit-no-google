#import <NativeCameraKitSpec/NativeCameraKitSpec.h>
#import <React/RCTBridgeModule.h>
#import <AppKit/AppKit.h>
#import <AVFoundation/AVFoundation.h>
#import "ReactNativeCameraKit-Swift.h"

@interface RNCameraKitMacOSModule : NSObject <NativeCameraKitMacOSModuleSpec>
@end

@implementation RNCameraKitMacOSModule
RCT_EXPORT_MODULE(RNCameraKitMacOSModule)

+ (BOOL)requiresMainQueueSetup { return NO; }

- (void)requestDeviceCameraAuthorization:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [CKMacCameraServices requestAuthorization:^(BOOL granted) { resolve(@(granted)); }];
}

- (void)checkDeviceCameraAuthorizationStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve(@([CKMacCameraServices authorized]));
}

- (void)getCameraDevices:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve([CKMacCameraServices devices]);
}

- (void)detectQRCodeInImage:(NSString *)base64 resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [CKMacCameraServices detectQR:base64 completion:^(NSString *value, NSError *error) {
    if (error) { reject(@"E_QR_IMAGE", error.localizedDescription, error); }
    else { resolve(value ?: (id)kCFNull); }
  }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeCameraKitMacOSModuleSpecJSI>(params);
}
@end
