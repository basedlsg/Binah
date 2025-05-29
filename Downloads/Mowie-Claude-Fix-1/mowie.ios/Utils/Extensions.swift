//
//  Extensions.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 11/10/23.
//

import Foundation
import UIKit

extension UIColor {
    static func rgb(red: CGFloat, green: CGFloat, blue: CGFloat) -> UIColor {
        return UIColor.init(red: red/255, green: green/255, blue: blue/255, alpha: 1.0)
    }
    
    static func rgba(red: CGFloat, green: CGFloat, blue: CGFloat, alpha: CGFloat) -> UIColor {
        return UIColor.init(red: red/255, green: green/255, blue: blue/255, alpha: alpha)
    }
    
    static let backgroundColor = UIColor.rgb(red: 25, green: 25, blue: 25)
    static let mainBlueTint = UIColor.rgb(red: 17, green: 154, blue: 237)
    static let mowieColor = UIColor.rgb(red: 00, green: 75, blue: 00)
    
    // PHASE 1: New Design System Colors
    static let primaryDark = UIColor(red: 10/255, green: 31/255, blue: 18/255, alpha: 1.0) // #0A1F12
    static let gradientDark = UIColor(red: 15/255, green: 40/255, blue: 24/255, alpha: 1.0) // #0F2818
    static let gradientMid = UIColor(red: 26/255, green: 58/255, blue: 42/255, alpha: 1.0) // #1A3A2A
    static let gradientEnd = UIColor(red: 13/255, green: 37/255, blue: 25/255, alpha: 1.0) // #0D2519
    static let accentGreen = UIColor(red: 0/255, green: 230/255, blue: 118/255, alpha: 1.0) // #00E676
    static let glassEffect = UIColor(red: 255/255, green: 255/255, blue: 255/255, alpha: 0.08) // rgba(255,255,255,0.08)
    static let glassBorderNew = UIColor(red: 255/255, green: 255/255, blue: 255/255, alpha: 0.1) // rgba(255,255,255,0.1)
    
    // Legacy colors (keeping for backward compatibility)
    static let darkGreenGradientStart = gradientDark
    static let darkGreenGradientMid = gradientMid
    static let darkGreenGradientEnd = gradientEnd
    static let glassDark = UIColor(red: 0, green: 0, blue: 0, alpha: 0.2)
    static let glassLight = UIColor(red: 1, green: 1, blue: 1, alpha: 0.05)
    static let glassCard = UIColor(red: 0, green: 0, blue: 0, alpha: 0.2)
    static let primaryGreen = UIColor(red: 0/255, green: 200/255, blue: 83/255, alpha: 1.0)
    static let brightGreen = accentGreen
    static let glassBorder = glassEffect
    static let iconTint = UIColor(red: 1, green: 1, blue: 1, alpha: 0.5)
    
    // Enhanced Premium Glassmorphism Colors
    static let premiumGlassStart = UIColor(red: 255/255, green: 255/255, blue: 255/255, alpha: 0.02)
    static let premiumGlassEnd = glassEffect
    static let glassOverlay = UIColor(red: 0/255, green: 200/255, blue: 83/255, alpha: 0.03)
    static let glassShadow = UIColor(red: 0/255, green: 0/255, blue: 0/255, alpha: 0.25)
    static let glassHighlight = UIColor(red: 255/255, green: 255/255, blue: 255/255, alpha: 0.15)
    static let premiumGreenGlow = UIColor(red: 0/255, green: 255/255, blue: 100/255, alpha: 0.4)
}

extension UIView{
    
    func inputContainerView(image: UIImage, textField: UITextField? = nil, segmentedControl: UISegmentedControl? = nil) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        
        // Icon - 18x18 as requested
        let imageView = UIImageView()
        imageView.image = image
        imageView.tintColor = UIColor.white.withAlphaComponent(0.7)
        imageView.contentMode = .scaleAspectFit
        view.addSubview(imageView)
        
        if let textField = textField {
            imageView.centerY(inView: view)
            imageView.anchor(left: view.leftAnchor, paddingLeft: 0, width: 18, height: 18)
            
            // Remove all styling from text field
            textField.backgroundColor = .clear
            textField.borderStyle = .none
            textField.layer.borderWidth = 0
            textField.layer.cornerRadius = 0
            
            view.addSubview(textField)
            textField.centerY(inView: view)
            textField.anchor(left: imageView.rightAnchor, bottom: view.bottomAnchor, right: view.rightAnchor, paddingLeft: 12, paddingBottom: 8)
        }
        
        if let sc = segmentedControl {
            imageView.anchor(top: view.topAnchor, left: view.leftAnchor, paddingTop: -8, paddingLeft: 0, width: 18, height: 18)
            
            view.addSubview(sc)
            sc.anchor(left: view.leftAnchor, right: view.rightAnchor, paddingLeft: 0, paddingRight: 0)
            sc.centerY(inView: view, constant: 8)
        }
        
        // Clean underline only
        let underlineView = UIView()
        underlineView.backgroundColor = UIColor.white.withAlphaComponent(0.3)
        view.addSubview(underlineView)
        underlineView.anchor(left: view.leftAnchor, bottom: view.bottomAnchor, right: view.rightAnchor, height: 1)
        
        return view
    }
    
    func inputContainerView(systemName: String, textField: UITextField? = nil, segmentedControl: UISegmentedControl? = nil) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        
        // Icon - 18x18 as requested
        let imageView = UIImageView()
        imageView.image = UIImage(systemName: systemName)
        imageView.tintColor = UIColor.white.withAlphaComponent(0.7)
        imageView.contentMode = .scaleAspectFit
        view.addSubview(imageView)
        
        if let textField = textField {
            imageView.centerY(inView: view)
            imageView.anchor(left: view.leftAnchor, paddingLeft: 0, width: 18, height: 18)
            
            // Remove all styling from text field
            textField.backgroundColor = .clear
            textField.borderStyle = .none
            textField.layer.borderWidth = 0
            textField.layer.cornerRadius = 0
            
            view.addSubview(textField)
            textField.centerY(inView: view)
            textField.anchor(left: imageView.rightAnchor, bottom: view.bottomAnchor, right: view.rightAnchor, paddingLeft: 12, paddingBottom: 8)
        }
        
        if let sc = segmentedControl {
            imageView.anchor(top: view.topAnchor, left: view.leftAnchor, paddingTop: -8, paddingLeft: 0, width: 18, height: 18)
            
            view.addSubview(sc)
            sc.anchor(left: view.leftAnchor, right: view.rightAnchor, paddingLeft: 0, paddingRight: 0)
            sc.centerY(inView: view, constant: 8)
        }
        
        // Clean underline only
        let underlineView = UIView()
        underlineView.backgroundColor = UIColor.white.withAlphaComponent(0.3)
        view.addSubview(underlineView)
        underlineView.anchor(left: view.leftAnchor, bottom: view.bottomAnchor, right: view.rightAnchor, height: 1)
        
        // Add focus animation for text fields
        if let textField = textField {
            underlineView.tag = 101
            textField.tag = view.tag + 1000  // Associate underline with textfield
            
            textField.addTarget(view, action: #selector(textFieldFocusDidBegin(_:)), for: .editingDidBegin)
            textField.addTarget(view, action: #selector(textFieldFocusDidEnd(_:)), for: .editingDidEnd)
        }
        
        return view
    }
    
    @objc private func textFieldFocusDidBegin(_ textField: UITextField) {
        guard let containerView = textField.superview,
              let underlineView = containerView.viewWithTag(101) else { return }
        
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            underlineView.backgroundColor = UIColor.primaryGreen
            underlineView.transform = CGAffineTransform(scaleX: 1.0, y: 2.0)
        })
    }
    
    @objc private func textFieldFocusDidEnd(_ textField: UITextField) {
        guard let containerView = textField.superview,
              let underlineView = containerView.viewWithTag(101) else { return }
        
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            underlineView.backgroundColor = UIColor.white.withAlphaComponent(0.3)
            underlineView.transform = .identity
        })
    }
    
    func anchor(top: NSLayoutYAxisAnchor? = nil,
                left: NSLayoutXAxisAnchor? = nil,
                bottom: NSLayoutYAxisAnchor? = nil,
                right: NSLayoutXAxisAnchor? = nil,
                paddingTop: CGFloat = 0,
                paddingLeft: CGFloat = 0,
                paddingBottom: CGFloat = 0,
                paddingRight: CGFloat = 0,
                width: CGFloat? = nil,
                height: CGFloat? = nil) {
        translatesAutoresizingMaskIntoConstraints = false
        
        if let top = top {
            topAnchor.constraint(equalTo: top, constant: paddingTop).isActive = true
        }
        
        if let left = left {
            leftAnchor.constraint(equalTo: left, constant: paddingLeft).isActive = true
        }
        
        if let bottom = bottom {
            bottomAnchor.constraint(equalTo: bottom, constant: paddingBottom).isActive = true
            // -
        }
        
        if let right = right {
            rightAnchor.constraint(equalTo: right, constant: paddingRight).isActive = true
            // -
        }
        
        if let width = width {
            widthAnchor.constraint(equalToConstant: width).isActive = true
        }
        
        if let height = height {
            heightAnchor.constraint(equalToConstant: height).isActive = true
        }
    }
    
    func centerX(inView view: UIView) {
        translatesAutoresizingMaskIntoConstraints = false
        centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
    }
    
    func centerY(inView view: UIView, leftAnchor: NSLayoutXAxisAnchor? = nil, paddingLeft: CGFloat = 0, constant: CGFloat = 0) {
        translatesAutoresizingMaskIntoConstraints = false
        centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: constant).isActive = true
        
        if let left = leftAnchor {
            anchor(left: left, paddingLeft: paddingLeft)
        }
    }
    
    func setDimensions(height: CGFloat, width: CGFloat) {
        translatesAutoresizingMaskIntoConstraints = false
        heightAnchor.constraint(equalToConstant: height).isActive = true
        widthAnchor.constraint(equalToConstant: height).isActive = true
    }
    
    func addShadow() {
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.55
        layer.shadowOffset = CGSize(width: 0.5, height: 0.5)
        layer.masksToBounds = false
    }
    
    func applyDarkGreenGradient() {
        let gradientLayer = CAGradientLayer()
        gradientLayer.frame = bounds
        gradientLayer.colors = [
            UIColor.gradientDark.cgColor,  // #0F2818
            UIColor.gradientMid.cgColor,   // #1A3A2A
            UIColor.gradientEnd.cgColor    // #0D2519
        ]
        gradientLayer.locations = [0.0, 0.5, 1.0]
        gradientLayer.startPoint = CGPoint(x: 0.0, y: 0.0)
        gradientLayer.endPoint = CGPoint(x: 1.0, y: 1.0)
        
        // Remove any existing gradient layers
        layer.sublayers?.removeAll(where: { $0 is CAGradientLayer })
        layer.insertSublayer(gradientLayer, at: 0)
    }
    
    func applyDarkGlass() {
        backgroundColor = UIColor.glassDark
        
        // Add blur effect
        let blurEffect = UIBlurEffect(style: .dark)
        let blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView.frame = bounds
        blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        blurEffectView.alpha = 0.8
        
        // Remove any existing blur views
        subviews.forEach { if $0 is UIVisualEffectView { $0.removeFromSuperview() } }
        insertSubview(blurEffectView, at: 0)
        
        // Add subtle glass border
        layer.borderColor = UIColor.glassBorder.cgColor
        layer.borderWidth = 1.0
        layer.cornerRadius = 16
        
        // Add subtle shadow
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 8)
        layer.shadowRadius = 32
        layer.shadowOpacity = 0.3
        
        // Add inner glow with CALayer
        addInnerGlow()
        
        clipsToBounds = false
    }
    
    func applyLightGlass() {
        backgroundColor = UIColor.glassLight
        
        // Add blur effect
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterial)
        let blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView.frame = bounds
        blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        blurEffectView.alpha = 0.3
        
        // Remove any existing blur views
        subviews.forEach { if $0 is UIVisualEffectView { $0.removeFromSuperview() } }
        insertSubview(blurEffectView, at: 0)
        
        // Add subtle glass border
        layer.borderColor = UIColor.glassBorder.cgColor
        layer.borderWidth = 1.0
        layer.cornerRadius = 16
        
        // Add subtle shadow
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 8)
        layer.shadowRadius = 32
        layer.shadowOpacity = 0.3
        
        // Add inner glow
        addInnerGlow()
        
        clipsToBounds = false
    }
    
    func addInnerGlow() {
        // Remove existing inner glow layer
        layer.sublayers?.removeAll(where: { $0.name == "innerGlow" })
        
        let innerGlowLayer = CALayer()
        innerGlowLayer.name = "innerGlow"
        innerGlowLayer.frame = bounds
        innerGlowLayer.cornerRadius = layer.cornerRadius
        innerGlowLayer.borderWidth = 1
        innerGlowLayer.borderColor = UIColor(white: 1.0, alpha: 0.05).cgColor
        innerGlowLayer.backgroundColor = UIColor.clear.cgColor
        layer.addSublayer(innerGlowLayer)
    }
    
    func addPulseAnimation() {
        let pulseAnimation = CABasicAnimation(keyPath: "transform.scale")
        pulseAnimation.duration = 2.0
        pulseAnimation.fromValue = 1.0
        pulseAnimation.toValue = 1.05
        pulseAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        pulseAnimation.autoreverses = true
        pulseAnimation.repeatCount = .infinity
        layer.add(pulseAnimation, forKey: "pulse")
    }
    
    func addSubtlePulse() {
        let pulseAnimation = CABasicAnimation(keyPath: "transform.scale")
        pulseAnimation.duration = 2.0
        pulseAnimation.fromValue = 1.0
        pulseAnimation.toValue = 1.05
        pulseAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        pulseAnimation.autoreverses = true
        pulseAnimation.repeatCount = .infinity
        layer.add(pulseAnimation, forKey: "subtlePulse")
    }
    
    func animateFadeIn(duration: TimeInterval = 0.3, delay: TimeInterval = 0) {
        alpha = 0
        UIView.animate(withDuration: duration, delay: delay, options: .curveEaseInOut, animations: {
            self.alpha = 1
        })
    }
    
    func animateFromBottom(duration: TimeInterval = 0.3, delay: TimeInterval = 0, distance: CGFloat = 20) {
        transform = CGAffineTransform(translationX: 0, y: distance)
        alpha = 0
        UIView.animate(withDuration: duration, delay: delay, usingSpringWithDamping: 0.8, initialSpringVelocity: 0, options: .curveEaseInOut, animations: {
            self.transform = .identity
            self.alpha = 1
        })
    }
    
    func addShimmerEffect() {
        let shimmerLayer = CAGradientLayer()
        shimmerLayer.name = "shimmer"
        shimmerLayer.frame = bounds
        shimmerLayer.cornerRadius = layer.cornerRadius
        
        let darkColor = UIColor(white: 1.0, alpha: 0.0).cgColor
        let lightColor = UIColor(white: 1.0, alpha: 0.1).cgColor
        
        shimmerLayer.colors = [darkColor, lightColor, darkColor]
        shimmerLayer.locations = [0.0, 0.5, 1.0]
        shimmerLayer.startPoint = CGPoint(x: 0.0, y: 0.5)
        shimmerLayer.endPoint = CGPoint(x: 1.0, y: 0.5)
        
        layer.addSublayer(shimmerLayer)
        
        let animation = CABasicAnimation(keyPath: "locations")
        animation.fromValue = [-1.0, -0.5, 0.0]
        animation.toValue = [1.0, 1.5, 2.0]
        animation.duration = 1.5
        animation.repeatCount = .infinity
        
        shimmerLayer.add(animation, forKey: "shimmer")
    }
    
    func removeShimmerEffect() {
        layer.sublayers?.removeAll(where: { $0.name == "shimmer" })
    }
    
    // Premium loading animations
    func animateContentFadeIn(duration: TimeInterval = 0.4, scale: CGFloat = 0.95) {
        alpha = 0
        transform = CGAffineTransform(scaleX: scale, y: scale)
        
        UIView.animate(withDuration: duration, delay: 0, usingSpringWithDamping: 0.9, initialSpringVelocity: 0.5, options: .curveEaseOut, animations: {
            self.alpha = 1
            self.transform = .identity
        })
    }
    
    // Screen appearance animation
    func animateScreenAppearance() {
        alpha = 0.8
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut, animations: {
            self.alpha = 1.0
        })
    }
    
    // Ripple effect for touch feedback
    func addRippleEffect(at point: CGPoint, color: UIColor = UIColor.primaryGreen) {
        let rippleLayer = CAShapeLayer()
        rippleLayer.name = "ripple"
        
        let size: CGFloat = 20
        rippleLayer.path = UIBezierPath(ovalIn: CGRect(x: point.x - size/2, y: point.y - size/2, width: size, height: size)).cgPath
        rippleLayer.fillColor = color.cgColor
        rippleLayer.opacity = 0.3
        
        layer.insertSublayer(rippleLayer, at: 0)
        
        // Animate ripple
        CATransaction.begin()
        CATransaction.setCompletionBlock {
            rippleLayer.removeFromSuperlayer()
        }
        
        let scaleAnimation = CABasicAnimation(keyPath: "transform.scale")
        scaleAnimation.fromValue = 1
        scaleAnimation.toValue = 10
        scaleAnimation.duration = 0.5
        
        let opacityAnimation = CABasicAnimation(keyPath: "opacity")
        opacityAnimation.fromValue = 0.3
        opacityAnimation.toValue = 0
        opacityAnimation.duration = 0.5
        
        let animationGroup = CAAnimationGroup()
        animationGroup.animations = [scaleAnimation, opacityAnimation]
        animationGroup.duration = 0.5
        animationGroup.timingFunction = CAMediaTimingFunction(name: .easeOut)
        
        rippleLayer.add(animationGroup, forKey: "rippleAnimation")
        CATransaction.commit()
    }
    
    // Gentle gradient animation
    func animateGradientShift() {
        guard let gradientLayer = layer.sublayers?.first(where: { $0 is CAGradientLayer }) as? CAGradientLayer else { return }
        
        let animation = CABasicAnimation(keyPath: "colors")
        animation.fromValue = gradientLayer.colors
        animation.toValue = [
            UIColor.darkGreenGradientEnd.cgColor,
            UIColor.darkGreenGradientStart.cgColor,
            UIColor.darkGreenGradientMid.cgColor
        ]
        animation.duration = 8.0
        animation.autoreverses = true
        animation.repeatCount = .infinity
        animation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        gradientLayer.add(animation, forKey: "gradientShift")
    }
    
    // Soft shadow pulse for FAB
    func addSoftShadowPulse() {
        let pulseAnimation = CABasicAnimation(keyPath: "shadowRadius")
        pulseAnimation.fromValue = 4
        pulseAnimation.toValue = 12
        pulseAnimation.duration = 2.0
        pulseAnimation.autoreverses = true
        pulseAnimation.repeatCount = .infinity
        pulseAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        let opacityAnimation = CABasicAnimation(keyPath: "shadowOpacity")
        opacityAnimation.fromValue = 0.3
        opacityAnimation.toValue = 0.5
        opacityAnimation.duration = 2.0
        opacityAnimation.autoreverses = true
        opacityAnimation.repeatCount = .infinity
        opacityAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        layer.add(pulseAnimation, forKey: "shadowPulse")
        layer.add(opacityAnimation, forKey: "shadowOpacityPulse")
    }
    
    // Premium Glassmorphism Effects
    func applyPremiumGlass(intensity: CGFloat = 0.8, cornerRadius: CGFloat = 20) {
        backgroundColor = UIColor.glassDark
        
        // Multi-layer blur for depth
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        let blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView.frame = bounds
        blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        blurEffectView.alpha = intensity
        blurEffectView.layer.cornerRadius = cornerRadius
        blurEffectView.clipsToBounds = true
        
        // Remove existing blur views
        subviews.forEach { if $0 is UIVisualEffectView { $0.removeFromSuperview() } }
        insertSubview(blurEffectView, at: 0)
        
        // Premium glass border with gradient
        layer.cornerRadius = cornerRadius
        layer.borderWidth = 1.5
        
        // Create gradient border
        let gradientBorder = CAGradientLayer()
        gradientBorder.frame = bounds
        gradientBorder.colors = [
            UIColor.glassHighlight.cgColor,
            UIColor.glassBorder.cgColor,
            UIColor.clear.cgColor
        ]
        gradientBorder.locations = [0.0, 0.5, 1.0]
        gradientBorder.startPoint = CGPoint(x: 0, y: 0)
        gradientBorder.endPoint = CGPoint(x: 1, y: 1)
        
        let shapeMask = CAShapeLayer()
        shapeMask.lineWidth = 1.5
        shapeMask.path = UIBezierPath(roundedRect: bounds, cornerRadius: cornerRadius).cgPath
        shapeMask.fillColor = UIColor.clear.cgColor
        shapeMask.strokeColor = UIColor.white.cgColor
        gradientBorder.mask = shapeMask
        
        layer.addSublayer(gradientBorder)
        
        // Premium shadow with glow
        layer.shadowColor = UIColor.glassShadow.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 10)
        layer.shadowRadius = 30
        layer.shadowOpacity = 0.5
        
        // Inner light reflection
        let innerGlow = CALayer()
        innerGlow.frame = CGRect(x: 0, y: 0, width: bounds.width, height: bounds.height/2)
        innerGlow.backgroundColor = UIColor.premiumGlassEnd.cgColor
        innerGlow.cornerRadius = cornerRadius
        innerGlow.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        layer.insertSublayer(innerGlow, at: 1)
        
        clipsToBounds = false
    }
    
    func addPremiumGlassMorphism() {
        // Enhanced glass with animated gradient overlay
        applyPremiumGlass()
        
        // Animated gradient overlay
        let gradientOverlay = CAGradientLayer()
        gradientOverlay.frame = bounds
        gradientOverlay.colors = [
            UIColor.glassOverlay.cgColor,
            UIColor.clear.cgColor,
            UIColor.glassOverlay.cgColor
        ]
        gradientOverlay.locations = [0, 0.5, 1]
        gradientOverlay.startPoint = CGPoint(x: 0, y: 0)
        gradientOverlay.endPoint = CGPoint(x: 1, y: 1)
        gradientOverlay.cornerRadius = layer.cornerRadius
        layer.addSublayer(gradientOverlay)
        
        // Animate gradient
        let animation = CABasicAnimation(keyPath: "locations")
        animation.fromValue = [0, 0.5, 1]
        animation.toValue = [0.3, 0.7, 1.3]
        animation.duration = 3.0
        animation.autoreverses = true
        animation.repeatCount = .infinity
        animation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        gradientOverlay.add(animation, forKey: "gradientShift")
    }
    
    func addFloatingAnimation(duration: TimeInterval = 4.0, distance: CGFloat = 10) {
        let animation = CABasicAnimation(keyPath: "transform.translation.y")
        animation.fromValue = 0
        animation.toValue = distance
        animation.duration = duration
        animation.autoreverses = true
        animation.repeatCount = .infinity
        animation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        layer.add(animation, forKey: "floating")
    }
    
    func addPremiumShadowGlow(color: UIColor = .primaryGreen) {
        // Multi-layer shadow for depth
        layer.shadowColor = color.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 5)
        layer.shadowRadius = 20
        layer.shadowOpacity = 0.3
        
        // Add pulsing glow
        let glowAnimation = CABasicAnimation(keyPath: "shadowOpacity")
        glowAnimation.fromValue = 0.3
        glowAnimation.toValue = 0.6
        glowAnimation.duration = 2.0
        glowAnimation.autoreverses = true
        glowAnimation.repeatCount = .infinity
        glowAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        let colorAnimation = CABasicAnimation(keyPath: "shadowColor")
        colorAnimation.fromValue = color.cgColor
        colorAnimation.toValue = UIColor.premiumGreenGlow.cgColor
        colorAnimation.duration = 2.0
        colorAnimation.autoreverses = true
        colorAnimation.repeatCount = .infinity
        colorAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        layer.add(glowAnimation, forKey: "glowPulse")
        layer.add(colorAnimation, forKey: "colorPulse")
    }
    
    // PHASE 1: Optimized Glass Panel Styling
    func applyGlassPanel(cornerRadius: CGFloat = 24) {
        // Clear any existing styling
        backgroundColor = .clear
        
        // Performance-optimized blur effect
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        let blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView.frame = bounds
        blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        blurEffectView.alpha = 0.6 // Set to 0.6 for performance as specified
        blurEffectView.layer.cornerRadius = cornerRadius
        blurEffectView.clipsToBounds = true
        
        // Remove any existing blur views
        subviews.forEach { if $0 is UIVisualEffectView { $0.removeFromSuperview() } }
        insertSubview(blurEffectView, at: 0)
        
        // Apply border
        layer.cornerRadius = cornerRadius
        layer.borderWidth = 1
        layer.borderColor = UIColor.glassBorderNew.cgColor // rgba(255,255,255,0.1)
        
        // Add subtle background for better glass effect
        let backgroundLayer = CALayer()
        backgroundLayer.frame = bounds
        backgroundLayer.backgroundColor = UIColor.glassEffect.cgColor // rgba(255,255,255,0.08)
        backgroundLayer.cornerRadius = cornerRadius
        layer.insertSublayer(backgroundLayer, at: 0)
        
        // Clip to bounds for clean corners
        clipsToBounds = true
    }
    
    // Glass blur transition overlay
    func addGlassTransitionOverlay(completion: @escaping () -> Void) {
        let overlayView = UIView(frame: UIScreen.main.bounds)
        overlayView.backgroundColor = UIColor(white: 0, alpha: 0)
        overlayView.tag = 999 // Tag for easy removal
        
        // Add blur effect
        let blurEffect = UIBlurEffect(style: .dark)
        let blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView.frame = overlayView.bounds
        blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        blurEffectView.alpha = 0
        overlayView.addSubview(blurEffectView)
        
        let window: UIWindow?
        if #available(iOS 13.0, *) {
            window = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }
        } else {
            window = UIApplication.shared.keyWindow
        }
        
        if let window = window {
            window.addSubview(overlayView)
            
            UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
                overlayView.backgroundColor = UIColor(white: 0, alpha: 0.4)
                blurEffectView.alpha = 1.0
            }, completion: { _ in
                completion()
                
                UIView.animate(withDuration: 0.3, delay: 0.1, options: .curveEaseInOut, animations: {
                    overlayView.backgroundColor = UIColor(white: 0, alpha: 0)
                    blurEffectView.alpha = 0
                }, completion: { _ in
                    overlayView.removeFromSuperview()
                })
            })
        }
    }
}

extension UITextField {
    
    func textField(withPlaceholder placeholder: String, isSecureTextEntry: Bool, keyboardtype: UIKeyboardType? = .default) -> UITextField {
        let tf = UITextField()
        
        tf.borderStyle = .none
        tf.font = UIFont.systemFont(ofSize: 16)
        tf.textColor = .white
        tf.keyboardAppearance = .dark
        tf.isSecureTextEntry = isSecureTextEntry
        tf.keyboardType = keyboardtype ?? .default
        tf.attributedPlaceholder = NSAttributedString(string: placeholder, attributes:
                                                        [NSAttributedString.Key.foregroundColor: UIColor.lightGray])
        if(isSecureTextEntry)
        {
            tf.passwordRules = UITextInputPasswordRules(descriptor: "required: upper; required: digit; max-consecutive: 2; minlength: 8;")

        }
            
        return tf
    }
    
    func styleAsGlassInput() {
        // Background and border
        backgroundColor = UIColor.glassLight
        layer.borderColor = UIColor.glassBorder.cgColor
        layer.borderWidth = 1.0
        layer.cornerRadius = 8
        
        // Text styling
        textColor = .white
        tintColor = UIColor.primaryGreen
        font = UIFont.systemFont(ofSize: 16)
        
        // Placeholder styling
        if let placeholder = self.placeholder {
            attributedPlaceholder = NSAttributedString(
                string: placeholder,
                attributes: [
                    NSAttributedString.Key.foregroundColor: UIColor(white: 1.0, alpha: 0.6),
                    NSAttributedString.Key.font: UIFont.systemFont(ofSize: 16)
                ]
            )
        }
        
        // Padding
        let paddingView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: frame.height))
        leftView = paddingView
        leftViewMode = .always
        rightView = paddingView
        rightViewMode = .always
        
        // Keyboard appearance
        keyboardAppearance = .dark
        
        // Add focus state handling
        addTarget(self, action: #selector(textFieldDidBeginEditing), for: .editingDidBegin)
        addTarget(self, action: #selector(textFieldDidEndEditing), for: .editingDidEnd)
    }
    
    @objc private func textFieldDidBeginEditing() {
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            self.layer.borderColor = UIColor.primaryGreen.cgColor
            self.layer.borderWidth = 2.0
            
            // Add green glow
            self.layer.shadowColor = UIColor.primaryGreen.cgColor
            self.layer.shadowOffset = CGSize(width: 0, height: 0)
            self.layer.shadowRadius = 8
            self.layer.shadowOpacity = 0.5
        })
    }
    
    @objc private func textFieldDidEndEditing() {
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            self.layer.borderColor = UIColor.glassBorder.cgColor
            self.layer.borderWidth = 1.0
            
            // Remove glow
            self.layer.shadowOpacity = 0
        })
    }
}

extension UIButton {
    
    func applyPrimaryGreenStyle() {
        // Background gradient
        let gradientLayer = CAGradientLayer()
        gradientLayer.frame = bounds
        gradientLayer.colors = [
            UIColor.primaryGreen.cgColor,
            UIColor.brightGreen.cgColor
        ]
        gradientLayer.locations = [0.0, 1.0]
        gradientLayer.startPoint = CGPoint(x: 0.0, y: 0.5)
        gradientLayer.endPoint = CGPoint(x: 1.0, y: 0.5)
        gradientLayer.cornerRadius = 8
        
        // Remove any existing gradient layers
        layer.sublayers?.removeAll(where: { $0 is CAGradientLayer })
        layer.insertSublayer(gradientLayer, at: 0)
        
        // Button styling
        setTitleColor(.white, for: .normal)
        setTitleColor(UIColor(white: 1.0, alpha: 0.8), for: .highlighted)
        titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
        
        // Green glow shadow
        layer.shadowColor = UIColor.primaryGreen.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 2)
        layer.shadowRadius = 10
        layer.shadowOpacity = 0.3
        
        // Corner radius
        layer.cornerRadius = 8
        clipsToBounds = false
        
        // Add touch feedback
        addTarget(self, action: #selector(buttonTouchDown), for: .touchDown)
        addTarget(self, action: #selector(buttonTouchUp), for: [.touchUpInside, .touchUpOutside, .touchCancel])
    }
    
    func applyPremiumGlassButton(style: GlassButtonStyle = .primary) {
        // Remove existing layers
        layer.sublayers?.removeAll(where: { $0 is CAGradientLayer || $0.name == "glassLayer" })
        
        // Glass background
        backgroundColor = UIColor.glassDark
        
        // Blur effect
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        let blurView = UIVisualEffectView(effect: blurEffect)
        blurView.frame = bounds
        blurView.alpha = 0.7
        blurView.layer.cornerRadius = 12
        blurView.clipsToBounds = true
        blurView.isUserInteractionEnabled = false
        
        // Remove existing blur views
        subviews.forEach { if $0 is UIVisualEffectView { $0.removeFromSuperview() } }
        insertSubview(blurView, at: 0)
        
        // Glass gradient overlay
        let glassLayer = CAGradientLayer()
        glassLayer.name = "glassLayer"
        glassLayer.frame = bounds
        glassLayer.cornerRadius = 12
        
        switch style {
        case .primary:
            glassLayer.colors = [
                UIColor.primaryGreen.withAlphaComponent(0.3).cgColor,
                UIColor.brightGreen.withAlphaComponent(0.1).cgColor,
                UIColor.clear.cgColor
            ]
        case .secondary:
            glassLayer.colors = [
                UIColor.white.withAlphaComponent(0.1).cgColor,
                UIColor.white.withAlphaComponent(0.05).cgColor,
                UIColor.clear.cgColor
            ]
        case .danger:
            glassLayer.colors = [
                UIColor.red.withAlphaComponent(0.3).cgColor,
                UIColor.red.withAlphaComponent(0.1).cgColor,
                UIColor.clear.cgColor
            ]
        }
        
        glassLayer.locations = [0.0, 0.7, 1.0]
        glassLayer.startPoint = CGPoint(x: 0, y: 0)
        glassLayer.endPoint = CGPoint(x: 1, y: 1)
        layer.insertSublayer(glassLayer, at: 1)
        
        // Glass border
        layer.cornerRadius = 12
        layer.borderWidth = 1
        layer.borderColor = UIColor.glassBorder.cgColor
        
        // Premium shadow
        layer.shadowColor = style == .primary ? UIColor.primaryGreen.cgColor : UIColor.black.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 4)
        layer.shadowRadius = 15
        layer.shadowOpacity = style == .primary ? 0.3 : 0.2
        
        // Text styling
        setTitleColor(.white, for: .normal)
        setTitleColor(UIColor.white.withAlphaComponent(0.7), for: .highlighted)
        titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        
        // Touch animations
        addTarget(self, action: #selector(glassButtonTouchDown), for: .touchDown)
        addTarget(self, action: #selector(glassButtonTouchUp), for: [.touchUpInside, .touchUpOutside, .touchCancel])
        
        clipsToBounds = false
    }
    
    enum GlassButtonStyle {
        case primary
        case secondary
        case danger
    }
    
    @objc private func buttonTouchDown() {
        UIView.animate(withDuration: 0.1, delay: 0, options: .curveEaseInOut, animations: {
            self.transform = CGAffineTransform(scaleX: 0.97, y: 0.97)
            self.alpha = 0.9
        })
    }
    
    @objc private func buttonTouchUp() {
        UIView.animate(withDuration: 0.2, delay: 0, usingSpringWithDamping: 0.7, initialSpringVelocity: 0.3, options: .curveEaseInOut, animations: {
            self.transform = .identity
            self.alpha = 1.0
        })
    }
    
    // Add gentle pulse for primary buttons
    func addGentleGlowPulse() {
        let pulseAnimation = CABasicAnimation(keyPath: "shadowOpacity")
        pulseAnimation.fromValue = 0.3
        pulseAnimation.toValue = 0.6
        pulseAnimation.duration = 2.0
        pulseAnimation.autoreverses = true
        pulseAnimation.repeatCount = .infinity
        pulseAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        layer.add(pulseAnimation, forKey: "glowPulse")
    }
    
    // Haptic feedback for premium feel
    func addHapticFeedback(style: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }
    
    override open func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        addHapticFeedback()
    }
    
    @objc private func glassButtonTouchDown() {
        UIView.animate(withDuration: 0.15, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: .curveEaseInOut, animations: {
            self.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
            self.layer.shadowOpacity = Float(self.layer.shadowOpacity) * 1.5
            self.layer.shadowRadius = self.layer.shadowRadius * 1.2
        })
        addHapticFeedback()
    }
    
    @objc private func glassButtonTouchUp() {
        UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.5, initialSpringVelocity: 0.8, options: .curveEaseInOut, animations: {
            self.transform = .identity
            self.layer.shadowOpacity = self.layer.shadowOpacity / 1.5
            self.layer.shadowRadius = self.layer.shadowRadius / 1.2
        })
    }
}

// Extension for spring animations on all interactions
extension UIControl {
    func addSpringAnimation() {
        addTarget(self, action: #selector(springTouchDown), for: .touchDown)
        addTarget(self, action: #selector(springTouchUp), for: [.touchUpInside, .touchUpOutside, .touchCancel])
    }
    
    @objc private func springTouchDown() {
        UIView.animate(withDuration: 0.15, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: .curveEaseInOut, animations: {
            self.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
        })
    }
    
    @objc private func springTouchUp() {
        UIView.animate(withDuration: 0.2, delay: 0, usingSpringWithDamping: 0.7, initialSpringVelocity: 0.3, options: .curveEaseInOut, animations: {
            self.transform = .identity
        })
    }
}
