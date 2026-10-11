import AVFoundation
import Foundation
import ImageIO
import Vision

func cameraDevices() -> [AVCaptureDevice] {
    AVCaptureDevice.DiscoverySession(deviceTypes: [.builtInWideAngleCamera, .external, .continuityCamera, .deskViewCamera],
                                     mediaType: .video, position: .unspecified).devices
}

func decodeQRImage(_ data: Data) throws -> String? {
    guard let source = CGImageSourceCreateWithData(data as CFData, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "CameraKit", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not decode image data"])
    }
    let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
    let rawOrientation = (properties?[kCGImagePropertyOrientation] as? NSNumber)?.uint32Value ?? 1
    let orientation = CGImagePropertyOrientation(rawValue: rawOrientation) ?? .up
    let request = VNDetectBarcodesRequest()
    request.symbologies = [.qr]
    try VNImageRequestHandler(cgImage: image, orientation: orientation).perform([request])
    return request.results?.first?.payloadStringValue
}

@objc(CKMacCameraServices)
public final class MacCameraServices: NSObject {
    private static let imageQueue = DispatchQueue(label: "CameraKit.image", qos: .userInitiated)

    @objc public static func devices() -> [[String: String]] {
        cameraDevices().map { ["id": $0.uniqueID, "name": $0.localizedName] }
    }

    @objc public static func authorized() -> Bool {
        AVCaptureDevice.authorizationStatus(for: .video) == .authorized
    }

    @objc public static func requestAuthorization(_ completion: @escaping (Bool) -> Void) {
        AVCaptureDevice.requestAccess(for: .video, completionHandler: completion)
    }

    @objc public static func detectQR(_ base64: String, completion: @escaping (String?, NSError?) -> Void) {
        imageQueue.async {
            let payload = base64.hasPrefix("data:") ? String(base64.split(separator: ",", maxSplits: 1).last ?? "") : base64
            guard let data = Data(base64Encoded: payload, options: .ignoreUnknownCharacters), !data.isEmpty else {
                completion(nil, NSError(domain: "CameraKit", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not decode base64 image data"]))
                return
            }
            do { completion(try decodeQRImage(data), nil) }
            catch { completion(nil, error as NSError) }
        }
    }
}
