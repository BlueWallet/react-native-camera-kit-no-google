import AppKit
import CoreImage
import Foundation
import ImageIO

var assertions = 0
func expect(_ condition: @autoclosure () -> Bool, _ message: String) {
    assertions += 1
    guard condition() else { fatalError(message) }
}

expect(selectedCameraID(requested: "usb", available: ["built-in", "usb"], defaultID: "built-in") == "usb", "explicit selection")
expect(selectedCameraID(requested: "gone", available: ["built-in"], defaultID: "built-in") == nil, "disconnected selection must never fall back")
expect(selectedCameraID(requested: "", available: ["built-in", "usb"], defaultID: "usb") == "usb", "system default selection")
expect(selectedCameraID(requested: "", available: [], defaultID: nil) == nil, "no cameras")

let state = CameraState()
let first = state.configure(active: true, scanning: true, delay: 100)
expect(state.canScan(first, now: 1), "first scan is immediate")
expect(state.reserveEvent(first, now: 1), "reserve first result")
expect(!state.reserveEvent(first, now: 2), "only one pending delivery")
expect(state.consumeEvent(first, now: 1), "deliver first event")
expect(!state.canScan(first, now: 1.099), "throttle below interval")
expect(state.reserveEvent(first, now: 1.101), "same payload can be emitted again after interval")
let switched = state.configure(active: true, scanning: true, delay: 100)
expect(!state.consumeEvent(first, now: 1), "discard pending event after camera switch")
expect(!state.reserveEvent(first, now: 3), "discard Vision result from previous camera")
expect(state.reserveEvent(switched, now: 3), "new camera starts immediately")
expect(!state.consumeEvent(first, now: 1), "old result cannot consume new pending event")
expect(state.consumeEvent(switched, now: 3), "new event remains available")
let delayed = state.configure(active: true, scanning: true, delay: 100)
expect(state.reserveEvent(delayed, now: 10), "reserve before main-thread delay")
expect(state.consumeEvent(delayed, now: 20), "delayed main-thread delivery")
expect(!state.canScan(delayed, now: 20.05), "throttle measured from delivery, avoiding catch-up bursts")
let disabled = state.configure(active: true, scanning: false, delay: 0)
expect(!state.canScan(disabled, now: 4), "disabled scanner")
expect(!state.reserveEvent(disabled, now: 4), "disabled scanner emits nothing")
let stopped = state.configure(active: false, scanning: true, delay: 0)
expect(!state.isCurrent(stopped), "stopped session is inactive")
expect(!state.reserveEvent(switched, now: 5), "stop invalidates in-flight results")
let reopened = state.configure(active: true, scanning: true, delay: 0)
expect(state.reserveEvent(reopened, now: 5), "reopened session works")
expect(state.consumeEvent(reopened, now: 5), "reopened event")
expect(state.reserveEvent(reopened, now: 5), "zero throttle supported")

// A scan prop update must not cancel pending startup or restart the hardware.
let lifecycle = CameraState()
let initialFrame = lifecycle.configure(active: true, scanning: true, delay: 100)
let firstSession = lifecycle.sessionToken
let scanOff = lifecycle.updateScanning(scanning: false, delay: 100)
expect(lifecycle.isSessionCurrent(firstSession), "scan disable preserves pending camera startup")
expect(lifecycle.beginSession(firstSession), "startup can finish after a scanner update")
expect(!lifecycle.reserveEvent(initialFrame, now: 1), "in-flight frame discarded after scan disable")
expect(!lifecycle.canScan(scanOff, now: 1), "disabled scan cannot process frames")
let scanOn = lifecycle.updateScanning(scanning: true, delay: 200)
expect(lifecycle.isSessionCurrent(firstSession), "scanner enable preserves running preview")
expect(lifecycle.reserveEvent(scanOn, now: 1), "new scan configuration can emit")
expect(lifecycle.consumeEvent(scanOn, now: 1), "new scan event delivered")
expect(!lifecycle.canScan(scanOn, now: 1.15), "new throttle applied without restarting preview")
let runtimeErrorSession = lifecycle.errorSessionToken!
_ = lifecycle.configure(active: true, scanning: true, delay: 100)
expect(!lifecycle.isSessionCurrent(runtimeErrorSession), "old runtime error discarded after camera switch")
expect(!lifecycle.beginSession(firstSession), "superseded startup cannot configure the new session")
expect(lifecycle.errorSessionToken == firstSession, "errors retain old hardware identity until new setup begins")
let nextSession = lifecycle.sessionToken
expect(lifecycle.beginSession(nextSession), "new hardware session starts")
expect(lifecycle.errorSessionToken == nextSession, "errors now belong to the new hardware session")
_ = lifecycle.configure(active: false, scanning: false, delay: 0)
_ = lifecycle.updateScanning(scanning: true, delay: 0)
expect(!lifecycle.isSessionCurrent(nextSession), "scanner props cannot reactivate an unmounted camera")

let context = CIContext()
func png(_ image: CIImage, orientation: Int = 1) -> Data {
    let cgImage = context.createCGImage(image, from: image.extent)!
    let data = NSMutableData()
    let destination = CGImageDestinationCreateWithData(data, "public.png" as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, cgImage, [kCGImagePropertyOrientation: orientation] as CFDictionary)
    CGImageDestinationFinalize(destination)
    return data as Data
}

for payload in ["CameraKit macOS static QR", "ur:bytes/1-2/first-frame", "ur:bytes/2-2/second-frame"] {
    let filter = CIFilter(name: "CIQRCodeGenerator")!
    filter.setValue(Data(payload.utf8), forKey: "inputMessage")
    let qr = filter.outputImage!.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
    let white = CIImage(color: CIColor.white).cropped(to: qr.extent.insetBy(dx: -40, dy: -40))
    let image = qr.composited(over: white)
    for orientation in 1...8 {
        let decoded = try decodeQRImage(png(image, orientation: orientation))
        expect(decoded == payload, "known QR payload and image orientation \(orientation)")
    }
}
let blank = CIImage(color: CIColor.white).cropped(to: CGRect(x: 0, y: 0, width: 400, height: 400))
let emptyResult = try decodeQRImage(png(blank))
expect(emptyResult == nil, "valid image without QR resolves nil")
do {
    _ = try decodeQRImage(Data("invalid image".utf8))
    fatalError("invalid image should fail")
} catch { assertions += 1 }
print("Passed \(assertions) macOS assertions (device selection, event lifecycle, throttle, QR image decoding).")
