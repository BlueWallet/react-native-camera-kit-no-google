import AppKit
import AVFoundation
import Vision

@objc(CKMacCameraView)
public final class MacCameraView: NSView, AVCaptureVideoDataOutputSampleBufferDelegate {
    @objc public var onReadCode: ((String) -> Void)?
    @objc public var onError: ((String) -> Void)?
    @objc public var onCameraDevicesChanged: (() -> Void)?

    private let session = AVCaptureSession()
    private let captureQueue = DispatchQueue(label: "CameraKit.capture", qos: .userInitiated)
    private let state = CameraState()
    private var preview: AVCaptureVideoPreviewLayer!
    private var observers: [NSObjectProtocol] = []
    private var windowObserver: NSObjectProtocol?
    // Main-thread settings.
    private var requestedID = ""
    private var scan = false
    private var delay = 2000
    private var qrAllowed = true
    private var closed = false
    // Only accessed on captureQueue.
    private var captureToken: UInt64 = 0
    private var activeOutput: AVCaptureVideoDataOutput?

    public override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        wantsLayer = true
        layer?.backgroundColor = NSColor.black.cgColor
        preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        layer?.addSublayer(preview)
        let center = NotificationCenter.default
        for name in [AVCaptureDevice.wasConnectedNotification, AVCaptureDevice.wasDisconnectedNotification] {
            observers.append(center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                guard let self else { return }
                guard self.window != nil && !self.closed else { return }
                self.onCameraDevicesChanged?()
                self.restart()
            })
        }
        observers.append(center.addObserver(forName: AVCaptureSession.runtimeErrorNotification, object: session, queue: nil) { [weak self] note in
            guard let self else { return }
            let message = (note.userInfo?[AVCaptureSessionErrorKey] as? NSError)?.localizedDescription ?? "Camera session failed"
            // Snapshot the hardware session at notification time, before a queued
            // restart can associate this failure with a different device.
            guard let token = self.state.errorSessionToken else { return }
            self.reportSessionError(message, token: token)
        })
        observers.append(center.addObserver(forName: NSApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
            self?.restart() // Re-check permission after returning from System Settings.
        })
    }

    public required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

    public override func layout() {
        super.layout()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        preview.frame = bounds
        CATransaction.commit()
    }

    public override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        if let windowObserver { NotificationCenter.default.removeObserver(windowObserver) }
        windowObserver = nil
        closed = false
        if let window {
            windowObserver = NotificationCenter.default.addObserver(forName: NSWindow.willCloseNotification, object: window, queue: .main) { [weak self] _ in
                self?.closed = true
                self?.stop()
            }
            restart()
        } else {
            stop()
        }
    }

    @objc public func configure(_ deviceID: String, scanning: Bool, throttle: Int, contain: Bool, qrAllowed: Bool) {
        preview.videoGravity = contain ? .resizeAspect : .resizeAspectFill
        let normalizedDelay = throttle < 0 ? 2000 : throttle
        let deviceChanged = requestedID != deviceID
        let scanChanged = scan != scanning || delay != normalizedDelay || self.qrAllowed != qrAllowed
        requestedID = deviceID
        scan = scanning
        delay = normalizedDelay
        self.qrAllowed = qrAllowed
        if deviceChanged {
            restart()
        } else if scanChanged {
            let token = state.updateScanning(scanning: scan && qrAllowed, delay: delay)
            captureQueue.async { [weak self] in self?.captureToken = token }
            if !qrAllowed { report("macOS supports only QR; allowedBarcodeTypes must include 'qr'.", token: token) }
        }
    }

    private func restart() {
        guard window != nil && !closed else { return }
        let token = state.configure(active: true, scanning: scan && qrAllowed, delay: delay)
        let sessionToken = state.sessionToken
        let deviceID = requestedID
        if !qrAllowed { report("macOS supports only QR; allowedBarcodeTypes must include 'qr'.", token: token) }
        captureQueue.async { [weak self] in
            guard let self, self.state.isSessionCurrent(sessionToken) else { return }
            self.captureToken = token
            self.activeOutput = nil
            self.session.stopRunning()
            guard self.state.beginSession(sessionToken) else { return }
            self.session.beginConfiguration()
            self.session.inputs.forEach { self.session.removeInput($0) }
            self.session.outputs.forEach { self.session.removeOutput($0) }
            guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
                self.session.commitConfiguration()
                self.reportSessionError("Camera permission has not been granted.", token: sessionToken)
                return
            }
            let devices = cameraDevices()
            let chosen = selectedCameraID(requested: deviceID, available: devices.map(\.uniqueID),
                                          defaultID: AVCaptureDevice.default(for: .video)?.uniqueID)
            guard let device = devices.first(where: { $0.uniqueID == chosen }) else {
                self.session.commitConfiguration()
                self.reportSessionError(deviceID.isEmpty ? "No cameras are available." : "The selected camera is disconnected or unavailable.", token: sessionToken)
                return
            }
            do {
                let input = try AVCaptureDeviceInput(device: device)
                let output = AVCaptureVideoDataOutput()
                output.alwaysDiscardsLateVideoFrames = true
                output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
                output.setSampleBufferDelegate(self, queue: self.captureQueue)
                guard self.session.canAddInput(input), self.session.canAddOutput(output) else {
                    throw NSError(domain: "CameraKit", code: 2, userInfo: [NSLocalizedDescriptionKey: "Cannot configure camera input/output"])
                }
                self.session.addInput(input)
                self.session.addOutput(output)
                self.activeOutput = output
                if self.session.canSetSessionPreset(.high) { self.session.sessionPreset = .high }
                // Vision receives the unmirrored, sensor-upright macOS video buffer.
                // Preview mirroring is independent and cannot alter decoded bytes.
                if let connection = output.connection(with: .video), connection.isVideoMirroringSupported {
                    connection.automaticallyAdjustsVideoMirroring = false
                    connection.isVideoMirrored = false
                }
                self.session.commitConfiguration()
                guard self.state.isSessionCurrent(sessionToken) else { return }
                self.session.startRunning()
                if !self.session.isRunning { self.reportSessionError("Camera failed to start.", token: sessionToken) }
            } catch {
                self.session.commitConfiguration()
                self.reportSessionError(error.localizedDescription, token: sessionToken)
            }
        }
    }

    @objc public func stop() {
        _ = state.configure(active: false, scanning: false, delay: delay)
        // Capture the session, not the view: teardown must finish even after deinit.
        let session = session
        captureQueue.async {
            session.stopRunning()
            session.beginConfiguration()
            session.outputs.forEach { output in
                (output as? AVCaptureVideoDataOutput)?.setSampleBufferDelegate(nil, queue: nil)
                session.removeOutput(output)
            }
            session.inputs.forEach { session.removeInput($0) }
            session.commitConfiguration()
        }
    }

    private func report(_ message: String, token: UInt64) {
        DispatchQueue.main.async { [weak self] in
            guard let self, self.state.isCurrent(token) else { return }
            self.onError?(message)
        }
    }

    private func reportSessionError(_ message: String, token: UInt64) {
        DispatchQueue.main.async { [weak self] in
            guard let self, self.state.isSessionCurrent(token) else { return }
            self.onError?(message)
        }
    }

    public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        let token = captureToken
        guard output === activeOutput, state.canScan(token, now: ProcessInfo.processInfo.systemUptime),
              let buffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let request = VNDetectBarcodesRequest()
        request.symbologies = [.qr]
        do {
            try VNImageRequestHandler(cvPixelBuffer: buffer, orientation: .up).perform([request])
            guard let value = request.results?.first?.payloadStringValue,
                  state.reserveEvent(token, now: ProcessInfo.processInfo.systemUptime) else { return }
            DispatchQueue.main.async { [weak self] in
                guard let self, self.state.consumeEvent(token, now: ProcessInfo.processInfo.systemUptime) else { return }
                self.onReadCode?(value)
            }
        } catch {
            // A malformed/transient frame should not accumulate errors at camera FPS.
            if state.reserveEvent(token, now: ProcessInfo.processInfo.systemUptime) {
                DispatchQueue.main.async { [weak self] in
                    guard let self, self.state.consumeEvent(token, now: ProcessInfo.processInfo.systemUptime) else { return }
                    self.onError?("QR detection failed: \(error.localizedDescription)")
                }
            }
        }
    }

    deinit {
        observers.forEach { NotificationCenter.default.removeObserver($0) }
        if let windowObserver { NotificationCenter.default.removeObserver(windowObserver) }
        _ = state.configure(active: false, scanning: false, delay: 0)
        let session = session
        captureQueue.async { session.stopRunning() }
    }
}
