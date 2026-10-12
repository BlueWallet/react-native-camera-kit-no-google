#import "../ReactNativeCameraKit/CKStringConversion.h"
#include <cassert>
#include <iostream>

int main() {
  @autoreleasepool {
    const unichar payload[] = {'a', 0, 0x20AC, 'b'};
    NSString *value = [NSString stringWithCharacters:payload length:4];
    assert(CKUTF8String(value) == std::string("a\0" "\xe2\x82\xac" "b", 6));
    assert(CKUTF8String(@"").empty());
    assert(CKUTF8String(@"ordinary QR") == "ordinary QR");
    std::cout << "Passed 3 Objective-C++ QR payload conversion assertions.\n";
  }
}
