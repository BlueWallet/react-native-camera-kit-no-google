#import <Foundation/Foundation.h>
#include <string>

// QR payloads may contain embedded NULs. Never use the NUL-terminated overload.
static inline std::string CKUTF8String(NSString *value) {
  const char *bytes = value.UTF8String;
  return bytes ? std::string(bytes, [value lengthOfBytesUsingEncoding:NSUTF8StringEncoding]) : std::string();
}
