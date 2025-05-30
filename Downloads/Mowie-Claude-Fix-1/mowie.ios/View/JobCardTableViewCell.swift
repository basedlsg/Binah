//
//  JobCardTableViewCell.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/30/23.
//

import UIKit

class JobCardTableViewCell: UITableViewCell {
    // Properties for your cell content
    let cardContainer = UIView()
    let streetAddressLabel = UILabel()
    let frequencyLabel = UILabel()
    let statusLabel = UILabel()
    let packageLabel = UILabel()
    let priceLabel = UILabel()
    let dayLabel = UILabel()
    let deleteButton = UIButton()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        print("Job Card")
        
        // Configure cell background
        backgroundColor = .clear
        selectionStyle = .none
        
        // Configure card container with Phase 1 glass panel
        cardContainer.applyGlassPanel(cornerRadius: 16)
        
        // Add shimmer effect on load
        cardContainer.addShimmerEffect()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
            self?.cardContainer.removeShimmerEffect()
        }
        
        // Add touch handling
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        cardContainer.addGestureRecognizer(tapGesture)
        cardContainer.isUserInteractionEnabled = true
        
        // Configure labels
        streetAddressLabel.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
        streetAddressLabel.textColor = .white
        
        frequencyLabel.font = UIFont.systemFont(ofSize: 14)
        frequencyLabel.textColor = UIColor(white: 1.0, alpha: 0.7)
        
        statusLabel.font = UIFont.systemFont(ofSize: 14)
        statusLabel.textColor = UIColor(white: 1.0, alpha: 0.7)
        
        packageLabel.font = UIFont.systemFont(ofSize: 14)
        packageLabel.textColor = UIColor(white: 1.0, alpha: 0.7)
        
        priceLabel.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        priceLabel.textColor = UIColor.brightGreen
        
        // Add subtle glow to price
        priceLabel.layer.shadowColor = UIColor.brightGreen.cgColor
        priceLabel.layer.shadowOffset = CGSize(width: 0, height: 0)
        priceLabel.layer.shadowRadius = 4
        priceLabel.layer.shadowOpacity = 0.5
        
        dayLabel.font = UIFont.systemFont(ofSize: 12)
        dayLabel.textColor = UIColor(white: 1.0, alpha: 0.7)
        
        // Add card container
        contentView.addSubview(cardContainer)
        cardContainer.translatesAutoresizingMaskIntoConstraints = false
        
        // Create info stack
        let infoStack = UIStackView(arrangedSubviews: [frequencyLabel, statusLabel, packageLabel])
        infoStack.axis = .vertical
        infoStack.spacing = 2
        infoStack.distribution = .fillEqually
        
        // Add labels to card container
        cardContainer.addSubview(streetAddressLabel)
        cardContainer.addSubview(infoStack)
        cardContainer.addSubview(priceLabel)
        
        streetAddressLabel.translatesAutoresizingMaskIntoConstraints = false
        infoStack.translatesAutoresizingMaskIntoConstraints = false
        priceLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Set up constraints
        NSLayoutConstraint.activate([
            // Card container
            cardContainer.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 8),
            cardContainer.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            cardContainer.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            cardContainer.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -8),
            
            // Street address
            streetAddressLabel.topAnchor.constraint(equalTo: cardContainer.topAnchor, constant: 16),
            streetAddressLabel.leadingAnchor.constraint(equalTo: cardContainer.leadingAnchor, constant: 16),
            streetAddressLabel.trailingAnchor.constraint(equalTo: priceLabel.leadingAnchor, constant: -8),
            
            // Info stack
            infoStack.topAnchor.constraint(equalTo: streetAddressLabel.bottomAnchor, constant: 8),
            infoStack.leadingAnchor.constraint(equalTo: cardContainer.leadingAnchor, constant: 16),
            infoStack.trailingAnchor.constraint(equalTo: priceLabel.leadingAnchor, constant: -8),
            infoStack.bottomAnchor.constraint(lessThanOrEqualTo: cardContainer.bottomAnchor, constant: -16),
            
            // Price label
            priceLabel.centerYAnchor.constraint(equalTo: cardContainer.centerYAnchor),
            priceLabel.trailingAnchor.constraint(equalTo: cardContainer.trailingAnchor, constant: -16)
        ])

    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Touch Handling
    
    @objc private func handleTap() {
        // Notify the table view to handle selection
        if let tableView = superview as? UITableView,
           let indexPath = tableView.indexPath(for: self) {
            tableView.selectRow(at: indexPath, animated: false, scrollPosition: .none)
            tableView.delegate?.tableView?(tableView, didSelectRowAt: indexPath)
        }
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        animatePress(isPressed: true)
        
        // Add ripple effect at touch point
        if let touch = touches.first {
            let location = touch.location(in: cardContainer)
            cardContainer.addRippleEffect(at: location)
        }
        
        // Add haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.prepare()
        generator.impactOccurred()
    }
    
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesEnded(touches, with: event)
        animatePress(isPressed: false)
    }
    
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        animatePress(isPressed: false)
    }
    
    private func animatePress(isPressed: Bool) {
        guard PerformanceManager.shared.shouldAnimate() else {
            // Apply visual changes instantly without animation on low-performance devices
            if isPressed {
                self.cardContainer.transform = CGAffineTransform(scaleX: 1.02, y: 1.02).translatedBy(x: 0, y: -2)
                self.cardContainer.layer.shadowOffset = CGSize(width: 0, height: 12)
                self.cardContainer.layer.shadowOpacity = 0.45
                self.cardContainer.layer.shadowRadius = 45
                self.priceLabel.layer.shadowOpacity = 0.8
                self.priceLabel.layer.shadowRadius = 8
            } else {
                self.cardContainer.transform = .identity
                self.cardContainer.layer.shadowOffset = CGSize(width: 0, height: 8)
                self.cardContainer.layer.shadowOpacity = 0.3
                self.cardContainer.layer.shadowRadius = 25
                self.priceLabel.layer.shadowOpacity = 0.5
                self.priceLabel.layer.shadowRadius = 5
            }
            print("🎬 Applied card hover state instantly (performance mode)")
            return
        }
        
        print("🎬 Animating card hover: \\(isPressed ? "pressed" : "released")")
        
        // Performance-aware card hover animation
        PerformanceManager.shared.animateSpring(
            duration: 0.3,
            delay: 0,
            damping: 0.8,
            velocity: 0.5,
            options: .curveEaseInOut,
            animations: {
                if isPressed {
                    // Slight scale and translate up
                    self.cardContainer.transform = CGAffineTransform(scaleX: 1.02, y: 1.02).translatedBy(x: 0, y: -2)
                    self.cardContainer.layer.shadowOffset = CGSize(width: 0, height: 12)
                    self.cardContainer.layer.shadowOpacity = 0.45
                    self.cardContainer.layer.shadowRadius = 45
                    
                    // Enhance price glow on hover
                    self.priceLabel.layer.shadowOpacity = 0.8
                    self.priceLabel.layer.shadowRadius = 8
                } else {
                    self.cardContainer.transform = .identity
                    self.cardContainer.layer.shadowOffset = CGSize(width: 0, height: 8)
                    self.cardContainer.layer.shadowOpacity = 0.3
                    self.cardContainer.layer.shadowRadius = 25
                    
                    // Reset price glow
                    self.priceLabel.layer.shadowOpacity = 0.5
                    self.priceLabel.layer.shadowRadius = 5
                }
            },
            completion: nil
        )
    }
}
