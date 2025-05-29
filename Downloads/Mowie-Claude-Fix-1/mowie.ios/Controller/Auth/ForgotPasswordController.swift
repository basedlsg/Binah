//
//  ForgotPasswordController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 2/8/24.
//

import Foundation
import UIKit
import FirebaseAuth

class ForgotPasswordController: UIViewController {

    // MARK: - Properties
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    // MARK: - UI Components
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Reset Password"
        label.font = UIFont(name: "Avenir-Light", size: 32)
        label.textColor = .white
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private let subtitleLabel: UILabel = {
        let label = UILabel()
        label.text = "Enter your email to receive reset instructions"
        label.font = UIFont.systemFont(ofSize: 14)
        label.textColor = UIColor(white: 1.0, alpha: 0.7)
        label.numberOfLines = 0
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private let emailTextField: UITextField = {
        let textField = UITextField()
        textField.placeholder = "Email"
        textField.borderStyle = .none
        textField.translatesAutoresizingMaskIntoConstraints = false
        textField.styleAsGlassInput()
        textField.keyboardType = .emailAddress
        textField.autocapitalizationType = .none
        return textField
    }()
    
    private let resetPasswordButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Send Reset Email", for: .normal)
        button.addTarget(self, action: #selector(resetPasswordButtonTapped), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.applyPrimaryGreenStyle()
        button.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        return button
    }()
    
    private let backButton: UIButton = {
        let button = UIButton(type: .system)
        let attributedTitle = NSMutableAttributedString(string: "Back to ", attributes: [NSAttributedString.Key.font: UIFont.systemFont(ofSize: 16), NSAttributedString.Key.foregroundColor: UIColor.lightGray])
        attributedTitle.append(NSAttributedString(string: "Login", attributes: [NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 16), NSAttributedString.Key.foregroundColor: UIColor.primaryGreen]))
        button.setAttributedTitle(attributedTitle, for: .normal)
        button.addTarget(self, action: #selector(handleShowLogin), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    // MARK: - View Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupTextFieldAnimations()
        
        // Configure navigation bar
        navigationController?.navigationBar.isHidden = true
        
        // Set status bar to light content
        navigationController?.navigationBar.barStyle = .black
        setNeedsStatusBarAppearanceUpdate()
    }

    // MARK: - UI Setup
    private func setupUI() {
        // Apply dark green gradient background
        view.applyDarkGreenGradient()
        
        // Create glass form container
        let formContainer = UIView()
        formContainer.translatesAutoresizingMaskIntoConstraints = false
        formContainer.applyDarkGlass()
        
        view.addSubview(titleLabel)
        view.addSubview(formContainer)
        formContainer.addSubview(subtitleLabel)
        formContainer.addSubview(emailTextField)
        formContainer.addSubview(resetPasswordButton)
        view.addSubview(backButton)

        NSLayoutConstraint.activate([
            // Title
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 60),
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            // Form container
            formContainer.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 40),
            formContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            formContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            // Subtitle inside container
            subtitleLabel.topAnchor.constraint(equalTo: formContainer.topAnchor, constant: 30),
            subtitleLabel.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor, constant: 30),
            subtitleLabel.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor, constant: -30),
            
            // Email field
            emailTextField.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 30),
            emailTextField.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor, constant: 30),
            emailTextField.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor, constant: -30),
            emailTextField.heightAnchor.constraint(equalToConstant: 50),

            // Reset button
            resetPasswordButton.topAnchor.constraint(equalTo: emailTextField.bottomAnchor, constant: 30),
            resetPasswordButton.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor, constant: 30),
            resetPasswordButton.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor, constant: -30),
            resetPasswordButton.heightAnchor.constraint(equalToConstant: 50),
            resetPasswordButton.bottomAnchor.constraint(equalTo: formContainer.bottomAnchor, constant: -30),
            
            // Back button
            backButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -30),
            backButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
    }
    
    private func setupTextFieldAnimations() {
        emailTextField.addTarget(self, action: #selector(textFieldFocusChanged(_:)), for: .editingDidBegin)
        emailTextField.addTarget(self, action: #selector(textFieldFocusChanged(_:)), for: .editingDidEnd)
    }
    
    @objc private func textFieldFocusChanged(_ textField: UITextField) {
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            if textField.isFirstResponder {
                textField.layer.shadowColor = UIColor.primaryGreen.cgColor
                textField.layer.shadowOpacity = 0.6
                textField.layer.shadowRadius = 8
                textField.layer.shadowOffset = CGSize(width: 0, height: 0)
                textField.transform = CGAffineTransform(scaleX: 1.02, y: 1.02)
            } else {
                textField.layer.shadowOpacity = 0
                textField.transform = .identity
            }
        }, completion: nil)
    }

    // MARK: - Button Actions
    @objc private func resetPasswordButtonTapped() {
        guard let email = emailTextField.text, !email.isEmpty else {
            showAlert(message: "Please enter your email.")
            return
        }

        // Handle change password button tap
        let alertController = UIAlertController(title: "Reset Password",
                                                message: "Send password reset email to \(email)?",
                                                preferredStyle: .alert)
        
        // Style the alert for dark theme
        alertController.view.tintColor = UIColor.primaryGreen
        
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
        let confirmAction = UIAlertAction(title: "Send", style: .default) { [weak self] _ in
            
            // Show loading
            self?.resetPasswordButton.isEnabled = false
            self?.resetPasswordButton.alpha = 0.7
            
            Auth.auth().sendPasswordReset(withEmail: email) { error in
                // Re-enable button
                self?.resetPasswordButton.isEnabled = true
                self?.resetPasswordButton.alpha = 1.0
                
                if let error = error {
                    // Handle error
                    print("Password reset failed: \(error.localizedDescription)")
                    self?.showAlert(message: error.localizedDescription)
                } else {
                    // Password reset email sent successfully
                    print("Password reset email sent successfully")
                    self?.showPasswordChangeConfirmation()
                }
            }
        }
        
        alertController.addAction(cancelAction)
        alertController.addAction(confirmAction)
        
        present(alertController, animated: true, completion: nil)
    }
    
    @objc private func handleShowLogin() {
        dismiss(animated: true, completion: nil)
    }
    
    private func showPasswordChangeConfirmation() {
        let confirmationAlert = UIAlertController(title: "Email Sent",
                                                   message: "Password reset instructions have been sent to your email.",
                                                   preferredStyle: .alert)
        
        confirmationAlert.view.tintColor = UIColor.primaryGreen
        
        let okAction = UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.handleShowLogin()
        }
        confirmationAlert.addAction(okAction)
        
        present(confirmationAlert, animated: true, completion: nil)
    }

    private func showAlert(message: String) {
        let alert = UIAlertController(title: "Alert", message: message, preferredStyle: .alert)
        alert.view.tintColor = UIColor.primaryGreen
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        
        // Reapply gradient after layout changes
        view.applyDarkGreenGradient()
        
        // Update button gradient frame
        if let gradientLayer = resetPasswordButton.layer.sublayers?.first(where: { $0 is CAGradientLayer }) as? CAGradientLayer {
            gradientLayer.frame = resetPasswordButton.bounds
        }
    }
}