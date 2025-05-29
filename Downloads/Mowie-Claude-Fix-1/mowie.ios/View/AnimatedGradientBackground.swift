//
//  AnimatedGradientBackground.swift
//  mowie.ios
//
//  Animated gradient background with glassmorphism effects
//

import UIKit

class AnimatedGradientBackground: UIView {
    
    private var gradientLayer: CAGradientLayer!
    private var particleEmitter: CAEmitterLayer!
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupGradient()
        setupParticles()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupGradient()
        setupParticles()
    }
    
    private func setupGradient() {
        gradientLayer = CAGradientLayer()
        gradientLayer.frame = bounds
        gradientLayer.colors = [
            UIColor.gradientDark.cgColor,  // #0F2818
            UIColor.gradientMid.cgColor,   // #1A3A2A
            UIColor.gradientEnd.cgColor,   // #0D2519
            UIColor.gradientMid.cgColor    // #1A3A2A
        ]
        gradientLayer.locations = [0.0, 0.3, 0.7, 1.0]
        gradientLayer.startPoint = CGPoint(x: 0, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 1)
        
        layer.insertSublayer(gradientLayer, at: 0)
        
        // Animate gradient
        animateGradient()
    }
    
    private func animateGradient() {
        // Color shift animation
        let colorAnimation = CABasicAnimation(keyPath: "colors")
        colorAnimation.fromValue = gradientLayer.colors
        colorAnimation.toValue = [
            UIColor.gradientEnd.cgColor,    // #0D2519
            UIColor.gradientDark.cgColor,   // #0F2818
            UIColor.gradientMid.cgColor,    // #1A3A2A
            UIColor.gradientDark.cgColor    // #0F2818
        ]
        colorAnimation.duration = 10.0
        colorAnimation.autoreverses = true
        colorAnimation.repeatCount = .infinity
        colorAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        // Position animation
        let positionAnimation = CABasicAnimation(keyPath: "locations")
        positionAnimation.fromValue = [0.0, 0.3, 0.7, 1.0]
        positionAnimation.toValue = [0.0, 0.4, 0.6, 1.0]
        positionAnimation.duration = 8.0
        positionAnimation.autoreverses = true
        positionAnimation.repeatCount = .infinity
        positionAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        gradientLayer.add(colorAnimation, forKey: "colorShift")
        gradientLayer.add(positionAnimation, forKey: "positionShift")
    }
    
    private func setupParticles() {
        particleEmitter = CAEmitterLayer()
        particleEmitter.emitterPosition = CGPoint(x: bounds.width / 2, y: -50)
        particleEmitter.emitterShape = .line
        particleEmitter.emitterSize = CGSize(width: bounds.width, height: 1)
        
        let cell = CAEmitterCell()
        cell.birthRate = 0.5
        cell.lifetime = 20.0
        cell.velocity = 30
        cell.velocityRange = 10
        cell.emissionLongitude = .pi
        cell.spinRange = 0.5
        cell.scale = 0.5
        cell.scaleRange = 0.3
        cell.color = UIColor.accentGreen.withAlphaComponent(0.1).cgColor
        cell.alphaSpeed = -0.05
        cell.contents = createGlowParticle().cgImage
        
        particleEmitter.emitterCells = [cell]
        layer.addSublayer(particleEmitter)
    }
    
    private func createGlowParticle() -> UIImage {
        let size = CGSize(width: 20, height: 20)
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        
        let context = UIGraphicsGetCurrentContext()!
        let gradient = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: [
                UIColor.accentGreen.withAlphaComponent(0.8).cgColor,
                UIColor.accentGreen.withAlphaComponent(0).cgColor
            ] as CFArray,
            locations: [0, 1]
        )!
        
        let center = CGPoint(x: size.width / 2, y: size.height / 2)
        context.drawRadialGradient(
            gradient,
            startCenter: center,
            startRadius: 0,
            endCenter: center,
            endRadius: size.width / 2,
            options: []
        )
        
        let image = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        return image
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        gradientLayer.frame = bounds
        particleEmitter.emitterPosition = CGPoint(x: bounds.width / 2, y: -50)
        particleEmitter.emitterSize = CGSize(width: bounds.width, height: 1)
    }
}