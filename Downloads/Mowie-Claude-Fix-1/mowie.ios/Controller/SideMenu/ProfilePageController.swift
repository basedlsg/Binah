//
//  ProfilePageController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/29/23.
//

import UIKit
import FirebaseAuth

class ProfilePageController: UIViewController {
    private let user: User
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    init(user: User) {
        self.user = user
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
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
        
        // User info glass panel
        let userInfoPanel = UIView()
        userInfoPanel.translatesAutoresizingMaskIntoConstraints = false
        userInfoPanel.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.3)
        userInfoPanel.layer.cornerRadius = 20
        userInfoPanel.layer.borderColor = UIColor.glassBorder.cgColor
        userInfoPanel.layer.borderWidth = 1
        
        // Add blur effect to user info panel
        let userBlurEffect = UIBlurEffect(style: .dark)
        let userBlurEffectView = UIVisualEffectView(effect: userBlurEffect)
        userBlurEffectView.translatesAutoresizingMaskIntoConstraints = false
        userBlurEffectView.alpha = 0.8
        userBlurEffectView.layer.cornerRadius = 20
        userBlurEffectView.clipsToBounds = true
        userInfoPanel.insertSubview(userBlurEffectView, at: 0)
        
        contentView.addSubview(userInfoPanel)
        
        let welcomeLabel = createLabel(text: "Welcome, \(user.firstname)", fontSize: 28, fontWeight: .bold, color: .white)
        
        let profileImageView = UIImageView(image: UIImage(systemName: "person.circle.fill"))
        profileImageView.contentMode = .scaleAspectFit
        profileImageView.tintColor = UIColor.primaryGreen
        profileImageView.layer.cornerRadius = 50
        profileImageView.clipsToBounds = true
        profileImageView.translatesAutoresizingMaskIntoConstraints = false
        
        // Email label
        let emailLabel = createLabel(text: user.email, fontSize: 16, fontWeight: .regular, color: UIColor(white: 1.0, alpha: 0.7))
        
        // Menu items as individual glass cards
        let changePasswordCard = createGlassCard()
        let changePasswordButton = createGlassButton(title: "Change Password", icon: "lock.rotation", action: #selector(handleChangePassword))
        changePasswordCard.addSubview(changePasswordButton)
        
        let deleteAccountCard = createGlassCard()
        let deleteAccountButton = createGlassButton(title: "Delete Account", icon: "trash", action: #selector(handleDeleteAccount), color: .systemRed)
        deleteAccountCard.addSubview(deleteAccountButton)
        
        let signOutCard = createGlassCard()
        let signOutButton = createGlassButton(title: "Sign Out", icon: "arrow.right.square", action: #selector(signOut))
        signOutCard.addSubview(signOutButton)
        
        // Toolbar with glass effect
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
        
        userInfoPanel.addSubview(profileImageView)
        userInfoPanel.addSubview(welcomeLabel)
        userInfoPanel.addSubview(emailLabel)
        contentView.addSubview(changePasswordCard)
        contentView.addSubview(deleteAccountCard)
        contentView.addSubview(signOutCard)
        view.addSubview(toolbar)
        
        // Constraints
        NSLayoutConstraint.activate([
            // Blur effect view constraints
            userBlurEffectView.topAnchor.constraint(equalTo: userInfoPanel.topAnchor),
            userBlurEffectView.leadingAnchor.constraint(equalTo: userInfoPanel.leadingAnchor),
            userBlurEffectView.trailingAnchor.constraint(equalTo: userInfoPanel.trailingAnchor),
            userBlurEffectView.bottomAnchor.constraint(equalTo: userInfoPanel.bottomAnchor),
            
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: toolbar.topAnchor),
            
            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
            
            // User info panel
            userInfoPanel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 20),
            userInfoPanel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            userInfoPanel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            
            profileImageView.topAnchor.constraint(equalTo: userInfoPanel.topAnchor, constant: 30),
            profileImageView.centerXAnchor.constraint(equalTo: userInfoPanel.centerXAnchor),
            profileImageView.widthAnchor.constraint(equalToConstant: 100),
            profileImageView.heightAnchor.constraint(equalToConstant: 100),
            
            welcomeLabel.topAnchor.constraint(equalTo: profileImageView.bottomAnchor, constant: 20),
            welcomeLabel.centerXAnchor.constraint(equalTo: userInfoPanel.centerXAnchor),
            
            emailLabel.topAnchor.constraint(equalTo: welcomeLabel.bottomAnchor, constant: 8),
            emailLabel.centerXAnchor.constraint(equalTo: userInfoPanel.centerXAnchor),
            emailLabel.bottomAnchor.constraint(equalTo: userInfoPanel.bottomAnchor, constant: -30),
            
            // Menu cards
            changePasswordCard.topAnchor.constraint(equalTo: userInfoPanel.bottomAnchor, constant: 30),
            changePasswordCard.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            changePasswordCard.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            changePasswordCard.heightAnchor.constraint(equalToConstant: 60),
            
            changePasswordButton.topAnchor.constraint(equalTo: changePasswordCard.topAnchor),
            changePasswordButton.leadingAnchor.constraint(equalTo: changePasswordCard.leadingAnchor),
            changePasswordButton.trailingAnchor.constraint(equalTo: changePasswordCard.trailingAnchor),
            changePasswordButton.bottomAnchor.constraint(equalTo: changePasswordCard.bottomAnchor),
            
            deleteAccountCard.topAnchor.constraint(equalTo: changePasswordCard.bottomAnchor, constant: 15),
            deleteAccountCard.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            deleteAccountCard.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            deleteAccountCard.heightAnchor.constraint(equalToConstant: 60),
            
            deleteAccountButton.topAnchor.constraint(equalTo: deleteAccountCard.topAnchor),
            deleteAccountButton.leadingAnchor.constraint(equalTo: deleteAccountCard.leadingAnchor),
            deleteAccountButton.trailingAnchor.constraint(equalTo: deleteAccountCard.trailingAnchor),
            deleteAccountButton.bottomAnchor.constraint(equalTo: deleteAccountCard.bottomAnchor),
            
            signOutCard.topAnchor.constraint(equalTo: deleteAccountCard.bottomAnchor, constant: 15),
            signOutCard.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            signOutCard.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            signOutCard.heightAnchor.constraint(equalToConstant: 60),
            signOutCard.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -20),
            
            signOutButton.topAnchor.constraint(equalTo: signOutCard.topAnchor),
            signOutButton.leadingAnchor.constraint(equalTo: signOutCard.leadingAnchor),
            signOutButton.trailingAnchor.constraint(equalTo: signOutCard.trailingAnchor),
            signOutButton.bottomAnchor.constraint(equalTo: signOutCard.bottomAnchor),
            
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
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }
    
    private func createGlassCard() -> UIView {
        let card = UIView()
        card.translatesAutoresizingMaskIntoConstraints = false
        card.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.2)
        card.layer.cornerRadius = 12
        card.layer.borderColor = UIColor.glassBorder.cgColor
        card.layer.borderWidth = 1
        
        // Add hover effect
        card.isUserInteractionEnabled = true
        
        return card
    }
    
    private func createGlassButton(title: String, icon: String, action: Selector, color: UIColor = UIColor.primaryGreen) -> UIButton {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        
        // Configure button with icon and title
        var config = UIButton.Configuration.plain()
        config.image = UIImage(systemName: icon)
        config.title = title
        config.imagePlacement = .leading
        config.imagePadding = 12
        config.contentInsets = NSDirectionalEdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 20)
        
        button.configuration = config
        button.tintColor = color
        button.addTarget(self, action: action, for: .touchUpInside)
        
        // Add hover effect
        button.addTarget(self, action: #selector(buttonTouchDown(_:)), for: .touchDown)
        button.addTarget(self, action: #selector(buttonTouchUp(_:)), for: [.touchUpInside, .touchUpOutside, .touchCancel])
        
        return button
    }
    
    @objc private func buttonTouchDown(_ sender: UIButton) {
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            sender.superview?.transform = CGAffineTransform(translationX: 0, y: -2)
            sender.superview?.layer.shadowOffset = CGSize(width: 0, height: 4)
            sender.superview?.layer.shadowOpacity = 0.3
            sender.superview?.layer.shadowRadius = 8
            sender.superview?.layer.shadowColor = UIColor.black.cgColor
        })
    }
    
    @objc private func buttonTouchUp(_ sender: UIButton) {
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            sender.superview?.transform = .identity
            sender.superview?.layer.shadowOffset = CGSize(width: 0, height: 2)
            sender.superview?.layer.shadowOpacity = 0.1
            sender.superview?.layer.shadowRadius = 4
        })
    }
    
    @objc private func handleChangePassword() {
        let alertController = UIAlertController(
            title: "Change Password Request",
            message: "Are you sure you want to request a password change?",
            preferredStyle: .alert
        )
        
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
        let confirmAction = UIAlertAction(title: "Confirm", style: .default) { [weak self] _ in
            guard let email = self?.user.email else { return }
            
            Auth.auth().sendPasswordReset(withEmail: email) { error in
                if let error = error {
                    print("Password reset failed: \(error.localizedDescription)")
                } else {
                    print("Password reset email sent successfully")
                    self?.showPasswordChangeConfirmation()
                }
            }
        }
        
        alertController.addAction(cancelAction)
        alertController.addAction(confirmAction)
        
        present(alertController, animated: true)
    }
    
    private func showPasswordChangeConfirmation() {
        let confirmationAlert = UIAlertController(
            title: "Password Change Requested",
            message: "Your password change request has been submitted. Check your email.",
            preferredStyle: .alert
        )
        
        let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
        confirmationAlert.addAction(okAction)
        
        present(confirmationAlert, animated: true)
    }
    
    @objc private func handleDeleteAccount() {
        let alertController = UIAlertController(title: "Delete Account",
                                                message: "Are you sure you want to delete your account?",
                                                preferredStyle: .alert)
        
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
        let confirmAction = UIAlertAction(title: "Confirm", style: .default) { [weak self] _ in
            guard let customerid = self?.user.customerid else {
                print("Error: Unable to retrieve customerid.")
                return
            }

            Service.shared.deleteAccount(customerid: customerid) { (result: Result<Void, Error>) -> Void in
                switch result {
                case .success:
                    print("Account deleted successfully.")
                    self?.signOut()
                case .failure(let error):
                    print("Error deleting account: \(error.localizedDescription)")
                }
            }
        }

        alertController.addAction(cancelAction)
        alertController.addAction(confirmAction)
        
        present(alertController, animated: true, completion: nil)
    }
    
    @objc private func signOut() {
        do {
            try Auth.auth().signOut()
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                
                let loginController = LoginController()
                let nav = UINavigationController(rootViewController: loginController)
                nav.modalPresentationStyle = .fullScreen
                self.present(nav, animated: true)
            }
        } catch let signOutError {
            print("DEBUG: Error signing out - \(signOutError.localizedDescription)")
        }
    }
    
    @objc private func handleDismissal() {
        dismiss(animated: true)
    }
}