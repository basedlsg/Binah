//
//  AboutUsController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/29/23.
//

import UIKit

class AboutUsController: UIViewController {
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Apply dark green gradient background
        view.applyDarkGreenGradient()
        setupUI()
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Reapply gradient after layout changes
        view.applyDarkGreenGradient()
    }
    
    private func setupUI() {
        let scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.backgroundColor = .clear
        view.addSubview(scrollView)
        
        let contentView = UIView()
        contentView.translatesAutoresizingMaskIntoConstraints = false
        contentView.backgroundColor = .clear
        scrollView.addSubview(contentView)
        
        // Create glass card container
        let glassCard = UIView()
        glassCard.translatesAutoresizingMaskIntoConstraints = false
        glassCard.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.3)
        glassCard.layer.cornerRadius = 20
        glassCard.layer.borderColor = UIColor.glassBorder.cgColor
        glassCard.layer.borderWidth = 1
        
        // Add blur effect
        let blurEffect = UIBlurEffect(style: .dark)
        let blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView.translatesAutoresizingMaskIntoConstraints = false
        blurEffectView.alpha = 0.8
        blurEffectView.layer.cornerRadius = 20
        blurEffectView.clipsToBounds = true
        glassCard.insertSubview(blurEffectView, at: 0)
        
        contentView.addSubview(glassCard)
        
        let logoImageView = UIImageView(image: UIImage(named: "mowie1024"))
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.layer.cornerRadius = 20
        logoImageView.clipsToBounds = true
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        
        let aboutLabel = createLabel(text: "About Mowie", fontSize: 28, fontWeight: .bold, color: UIColor.primaryGreen)
        let aboutText = createLabel(text: "The Mowie Marketplace is a dynamic platform designed to connect local communities with trusted lawn care professionals, known as MowiePros. It's a place where homeowners, property managers, and anyone in need of lawn care services can easily find reliable, affordable help for maintaining their green spaces with just a few taps.", fontSize: 16, fontWeight: .regular, color: UIColor(white: 1.0, alpha: 0.7))
        
        let missionLabel = createLabel(text: "Our Mission", fontSize: 22, fontWeight: .bold, color: UIColor.primaryGreen)
        let missionText = createLabel(text: "At Mowie, we believe in the power of community. Our mission is to create sustainable employment opportunities while enhancing urban green spaces. We aim to partner with municipalities and local businesses to keep our neighborhoods looking their best.", fontSize: 16, fontWeight: .regular, color: UIColor(white: 1.0, alpha: 0.7))
        
        let toolbar = UIToolbar()
        toolbar.translatesAutoresizingMaskIntoConstraints = false
        toolbar.barStyle = .black
        toolbar.isTranslucent = true
        toolbar.setBackgroundImage(UIImage(), forToolbarPosition: .any, barMetrics: .default)
        toolbar.setShadowImage(UIImage(), forToolbarPosition: .any)
        toolbar.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.6)
        toolbar.setItems([
            UIBarButtonItem(barButtonSystemItem: .close, target: self, action: #selector(handleDismissal)),
            UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
        ], animated: false)
        toolbar.tintColor = UIColor.primaryGreen
        
        glassCard.addSubview(logoImageView)
        glassCard.addSubview(aboutLabel)
        glassCard.addSubview(aboutText)
        glassCard.addSubview(missionLabel)
        glassCard.addSubview(missionText)
        view.addSubview(toolbar)
        
        // Constraints for blur effect view
        NSLayoutConstraint.activate([
            blurEffectView.topAnchor.constraint(equalTo: glassCard.topAnchor),
            blurEffectView.leadingAnchor.constraint(equalTo: glassCard.leadingAnchor),
            blurEffectView.trailingAnchor.constraint(equalTo: glassCard.trailingAnchor),
            blurEffectView.bottomAnchor.constraint(equalTo: glassCard.bottomAnchor)
        ])
        
        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: toolbar.topAnchor),
            
            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
            
            glassCard.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 20),
            glassCard.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            glassCard.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            glassCard.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -20),
            
            logoImageView.topAnchor.constraint(equalTo: glassCard.topAnchor, constant: 30),
            logoImageView.centerXAnchor.constraint(equalTo: glassCard.centerXAnchor),
            logoImageView.widthAnchor.constraint(equalToConstant: 150),
            logoImageView.heightAnchor.constraint(equalToConstant: 150),
            
            aboutLabel.topAnchor.constraint(equalTo: logoImageView.bottomAnchor, constant: 30),
            aboutLabel.leadingAnchor.constraint(equalTo: glassCard.leadingAnchor, constant: 30),
            aboutLabel.trailingAnchor.constraint(equalTo: glassCard.trailingAnchor, constant: -30),
            
            aboutText.topAnchor.constraint(equalTo: aboutLabel.bottomAnchor, constant: 15),
            aboutText.leadingAnchor.constraint(equalTo: glassCard.leadingAnchor, constant: 30),
            aboutText.trailingAnchor.constraint(equalTo: glassCard.trailingAnchor, constant: -30),
            
            missionLabel.topAnchor.constraint(equalTo: aboutText.bottomAnchor, constant: 30),
            missionLabel.leadingAnchor.constraint(equalTo: glassCard.leadingAnchor, constant: 30),
            missionLabel.trailingAnchor.constraint(equalTo: glassCard.trailingAnchor, constant: -30),
            
            missionText.topAnchor.constraint(equalTo: missionLabel.bottomAnchor, constant: 15),
            missionText.leadingAnchor.constraint(equalTo: glassCard.leadingAnchor, constant: 30),
            missionText.trailingAnchor.constraint(equalTo: glassCard.trailingAnchor, constant: -30),
            missionText.bottomAnchor.constraint(equalTo: glassCard.bottomAnchor, constant: -30),
            
            toolbar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            toolbar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            toolbar.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
    private func createLabel(text: String, fontSize: CGFloat, fontWeight: UIFont.Weight, color: UIColor) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = UIFont.systemFont(ofSize: fontSize, weight: fontWeight)
        label.textColor = color
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }
    
    @objc private func handleDismissal() {
        dismiss(animated: true, completion: nil)
    }
}