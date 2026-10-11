import Foundation

// Shared by the main and capture queues. Invalidating synchronously prevents an
// in-flight Vision request (or queued main-thread delivery) escaping after stop.
final class CameraState {
    private let lock = NSLock()
    private var generation: UInt64 = 0
    private var sessionGeneration: UInt64 = 0
    private var configuredSession: UInt64?
    private var active = false
    private var scanning = false
    private var interval: TimeInterval = 2
    private var lastEvent = -Double.infinity
    private var pending = false

    func configure(active: Bool, scanning: Bool, delay: Int) -> UInt64 {
        lock.lock(); defer { lock.unlock() }
        generation &+= 1
        sessionGeneration &+= 1
        self.active = active
        self.scanning = scanning
        interval = Double(max(0, delay)) / 1000
        lastEvent = -Double.infinity
        pending = false
        return generation
    }

    // Scanner changes invalidate Vision results without cancelling camera startup
    // or interrupting a running preview.
    func updateScanning(scanning: Bool, delay: Int) -> UInt64 {
        lock.lock(); defer { lock.unlock() }
        generation &+= 1
        self.scanning = scanning
        interval = Double(max(0, delay)) / 1000
        lastEvent = -Double.infinity
        pending = false
        return generation
    }

    var sessionToken: UInt64 {
        lock.lock(); defer { lock.unlock() }
        return sessionGeneration
    }

    func isSessionCurrent(_ token: UInt64) -> Bool {
        lock.lock(); defer { lock.unlock() }
        return active && token == sessionGeneration
    }

    // Called on the capture queue after the previous hardware session stops.
    func beginSession(_ token: UInt64) -> Bool {
        lock.lock(); defer { lock.unlock() }
        guard active && token == sessionGeneration else { return false }
        configuredSession = token
        return true
    }

    var errorSessionToken: UInt64? {
        lock.lock(); defer { lock.unlock() }
        return configuredSession
    }

    func isCurrent(_ token: UInt64) -> Bool {
        lock.lock(); defer { lock.unlock() }
        return active && token == generation
    }

    func canScan(_ token: UInt64, now: TimeInterval) -> Bool {
        lock.lock(); defer { lock.unlock() }
        return active && scanning && token == generation && !pending && now - lastEvent >= interval
    }

    func reserveEvent(_ token: UInt64, now: TimeInterval) -> Bool {
        lock.lock(); defer { lock.unlock() }
        guard active && scanning && token == generation && !pending && now - lastEvent >= interval else { return false }
        pending = true
        lastEvent = now
        return true
    }

    func consumeEvent(_ token: UInt64, now: TimeInterval) -> Bool {
        lock.lock(); defer { lock.unlock() }
        guard active && scanning && token == generation && pending else { return false }
        pending = false
        lastEvent = now
        return true
    }
}

func selectedCameraID(requested: String, available: [String], defaultID: String?) -> String? {
    if !requested.isEmpty { return available.contains(requested) ? requested : nil }
    return defaultID.flatMap { available.contains($0) ? $0 : nil }
}
