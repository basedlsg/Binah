//
//  PremiumGlassCard.swift
//  mowie.ios
//
//  Premium glassmorphism card component
//

import UIKit

class PremiumGlassCard: UIView {
    
    internal let contentView = UIView()
    private var glowColor: UIColor = .primaryGreen
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        // Apply premium glass effect
        applyPremiumGlass(intensity: 0.8, cornerRadius: 20)
        
        // Add floating animation
        addFloatingAnimation(duration: 4.0, distance: 5)
        
        // Add premium shadow glow
        addPremiumShadowGlow(color: glowColor)
        
        // Setup content view
        contentView.translatesAutoresizingMaskIntoConstraints = false
        contentView.backgroundColor = .clear
        addSubview(contentView)
        
        NSLayoutConstraint.activate([
            contentView.topAnchor.constraint(equalTo: topAnchor, constant: 16),
            contentView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            contentView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
            contentView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -16)
        ])
        
        // Add touch handling
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        addGestureRecognizer(tapGesture)
    }
    
    @objc private func handleTap() {
        // Ripple effect at center
        let center = CGPoint(x: bounds.width / 2, y: bounds.height / 2)
        addRippleEffect(at: center)
        
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.prepare()
        generator.impactOccurred()
        
        // Bounce animation
        UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.5, initialSpringVelocity: 0.8, options: .curveEaseInOut, animations: {
            self.transform = CGAffineTransform(scaleX: 1.02, y: 1.02)
        }) { _ in
            UIView.animate(withDuration: 0.2, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.3, options: .curveEaseInOut, animations: {
                self.transform = .identity
            })
        }
    }
    
    func setGlowColor(_ color: UIColor) {
        self.glowColor = color
        addPremiumShadowGlow(color: color)
    }
    
    func addContent(_ view: UIView) {
        contentView.addSubview(view)
    }
}

// Premium Glass Info Card for displaying stats
class PremiumInfoCard: PremiumGlassCard {
    
    private let iconImageView = UIImageView()
    private let titleLabel = UILabel()
    private let valueLabel = UILabel()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupInfoCard()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupInfoCard()
    }
    
    private func setupInfoCard() {
        // Icon setup
        iconImageView.translatesAutoresizingMaskIntoConstraints = false
        iconImageView.contentMode = .scaleAspectFit
        iconImageView.tintColor = .primaryGreen
        
        // Title label
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        titleLabel.textColor = UIColor.white.withAlphaComponent(0.7)
        
        // Value label
        valueLabel.translatesAutoresizingMaskIntoConstraints = false
        valueLabel.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        valueLabel.textColor = .white
        
        // Add green glow to value
        valueLabel.layer.shadowColor = UIColor.primaryGreen.cgColor
        valueLabel.layer.shadowOffset = CGSize(width: 0, height: 0)
        valueLabel.layer.shadowRadius = 5
        valueLabel.layer.shadowOpacity = 0.5
        
        // Add subviews
        addContent(iconImageView)
        addContent(titleLabel)
        addContent(valueLabel)
        
        NSLayoutConstraint.activate([
            iconImageView.topAnchor.constraint(equalTo: contentView.topAnchor),
            iconImageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            iconImageView.widthAnchor.constraint(equalToConstant: 30),
            iconImageView.heightAnchor.constraint(equalToConstant: 30),
            
            titleLabel.topAnchor.constraint(equalTo: iconImageView.bottomAnchor, constant: 12),
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            
            valueLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 4),
            valueLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            valueLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor)
        ])
    }
    
    func configure(icon: UIImage?, title: String, value: String) {
        iconImageView.image = icon
        titleLabel.text = title
        valueLabel.text = value
    }
}