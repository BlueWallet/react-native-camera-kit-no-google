#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
output=$(mktemp -d)
trap 'rm -rf "$output"' EXIT
xcrun swiftc -swift-version 5 \
  macos/ReactNativeCameraKit/CameraState.swift \
  macos/ReactNativeCameraKit/MacCameraServices.swift \
  macos/Tests/main.swift -o "$output/camera-tests"
"$output/camera-tests"
xcrun clang++ -std=c++20 -fobjc-arc -framework Foundation \
  macos/Tests/strings.mm -o "$output/string-tests"
"$output/string-tests"
