//
//  PerformanceManager.swift
//  mowie.ios
//
//  Performance monitoring and animation control
//

import UIKit

class PerformanceManager {
    static let shared = PerformanceManager()
    
    private init() {}
    
    /// Determines if animations should be enabled based on device performance and settings
    func shouldAnimate() -> Bool {
        // Check if low power mode is enabled
        if ProcessInfo.processInfo.isLowPowerModeEnabled {
            print("🔋 Low power mode enabled - disabling animations")
            return false
        }
        
        // Check accessibility settings for reduced motion
        if UIAccessibility.isReduceMotionEnabled {
            print("♿ Reduce motion enabled - disabling animations")
            return false
        }
        
        // Check device performance tier
        let devicePerformance = getDevicePerformanceTier()
        
        switch devicePerformance {
        case .high:
            return true
        case .medium:
            // Enable animations but with conservative settings
            return true
        case .low:
            print("📱 Low performance device - disabling animations")
            return false
        }
    }
    
    /// Get performance characteristics for animation tuning
    func getAnimationDuration(base: TimeInterval) -> TimeInterval {
        if !shouldAnimate() {
            return 0.0
        }
        
        let devicePerformance = getDevicePerformanceTier()
        switch devicePerformance {
        case .high:
            return base
        case .medium:
            return base * 0.8 // Slightly faster for medium devices
        case .low:
            return 0.0
        }
    }
    
    private enum DevicePerformance {
        case high    // iPhone 12 Pro and newer
        case medium  // iPhone X to iPhone 11 Pro
        case low     // iPhone SE and older
    }
    
    private func getDevicePerformanceTier() -> DevicePerformance {
        var systemInfo = utsname()
        uname(&systemInfo)
        
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value))!)
        }
        
        // iPhone performance mapping
        switch identifier {
        // High performance devices (iPhone 12 Pro and newer)
        case "iPhone13,2", "iPhone13,3", "iPhone13,4",  // iPhone 12 series
             "iPhone14,2", "iPhone14,3", "iPhone14,4", "iPhone14,5", "iPhone14,6", "iPhone14,7", "iPhone14,8", // iPhone 13 series
             "iPhone15,2", "iPhone15,3", "iPhone15,4", "iPhone15,5": // iPhone 14 series and newer
            print("📱 High performance device detected: \(identifier)")
            return .high
            
        // Medium performance devices (iPhone X to iPhone 11 Pro)
        case "iPhone10,3", "iPhone10,6", // iPhone X
             "iPhone11,2", "iPhone11,4", "iPhone11,6", "iPhone11,8", // iPhone XS series
             "iPhone12,1", "iPhone12,3", "iPhone12,5": // iPhone 11 series
            print("📱 Medium performance device detected: \(identifier)")
            return .medium
            
        // Low performance devices (iPhone SE and older)
        default:
            print("📱 Low performance device detected: \(identifier)")
            return .low
        }
    }
}

// MARK: - Animation Helpers

extension PerformanceManager {
    
    /// Safe animation wrapper that respects performance settings
    func animate(duration: TimeInterval,
                delay: TimeInterval = 0,
                options: UIView.AnimationOptions = [],
                animations: @escaping () -> Void,
                completion: ((Bool) -> Void)? = nil) {
        
        let adjustedDuration = getAnimationDuration(base: duration)
        
        if adjustedDuration > 0 {
            UIView.animate(withDuration: adjustedDuration,
                          delay: delay,
                          options: options,
                          animations: animations,
                          completion: completion)
        } else {
            // Execute immediately without animation
            animations()
            completion?(true)
        }
    }
    
    /// Safe spring animation wrapper
    func animateSpring(duration: TimeInterval,
                      delay: TimeInterval = 0,
                      damping: CGFloat = 0.7,
                      velocity: CGFloat = 0.5,
                      options: UIView.AnimationOptions = [],
                      animations: @escaping () -> Void,
                      completion: ((Bool) -> Void)? = nil) {
        
        let adjustedDuration = getAnimationDuration(base: duration)
        
        if adjustedDuration > 0 {
            UIView.animate(withDuration: adjustedDuration,
                          delay: delay,
                          usingSpringWithDamping: damping,
                          initialSpringVelocity: velocity,
                          options: options,
                          animations: animations,
                          completion: completion)
        } else {
            // Execute immediately without animation
            animations()
            completion?(true)
        }
    }
}