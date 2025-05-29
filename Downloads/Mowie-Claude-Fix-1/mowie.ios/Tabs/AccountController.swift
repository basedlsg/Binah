//
//  AccountController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/14/23.
//

import UIKit
import FirebaseAuth
import FirebaseStorage
import MessageUI

class AccountController: UITabBarController, MFMailComposeViewControllerDelegate {
    
    private let pro: Pro
    let headerView = UIView()
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "ACCOUNT"
        label.font = UIFont(name: "Avenir-Light", size:36)
        label.textColor = UIColor(white: 1, alpha: 0.8)
        
        return label
    }()

    let userImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.image = UIImage(systemName: "person.circle.fill")
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.tintColor = UIColor.white
        imageView.layer.cornerRadius = 50
        imageView.layer.masksToBounds = true
        
        // Add tap gesture recognizer
            imageView.isUserInteractionEnabled = true
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(userImageViewTapped))
            imageView.addGestureRecognizer(tapGesture)
        
        tapGesture.delegate = nil
        
        if let uid = Auth.auth().currentUser?.uid {
            // Use the unwrapped value of 'uid' here
            print("User ID: \(uid)")
            let storageRef = Storage.storage().reference().child("users/\(uid)/profilephoto/photo")

            storageRef.getData(maxSize: 1 * 1024 * 1024) { data, error in
                if let error = error {
                    print("Error downloading profile photo: \(error.localizedDescription)")
                } else {
                    // Successfully downloaded profile photo data
                    if let imageData = data, let profileImage = UIImage(data: imageData) {
                        // Use 'profileImage' as the downloaded profile photo
                        DispatchQueue.main.async {
                            imageView.image = profileImage
                        }
                    } else {
                        // Error decoding image data or empty image data
                        print("Error decoding profile photo data or empty data")
                    }
                }
            }
        } else {
            // Handle the case where 'uid' is nil
            print("User ID is nil")
        }
        
        return imageView
    }()

    let vehicleImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.image = UIImage(systemName: "car.fill")
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.tintColor = UIColor.white
        imageView.layer.cornerRadius = 50
        imageView.layer.masksToBounds = true
        
        // Add tap gesture recognizer
            imageView.isUserInteractionEnabled = true
            let tapGesture = UITapGestureRecognizer(target: self, action: #selector(vehicleImageViewTapped))
            imageView.addGestureRecognizer(tapGesture)
        
        tapGesture.delegate = nil
        
        if let uid = Auth.auth().currentUser?.uid {
            // Use the unwrapped value of 'uid' here
            print("User ID: \(uid)")
            let storageRef = Storage.storage().reference().child("users/\(uid)/vehiclephoto/car")

            storageRef.getData(maxSize: 1 * 1024 * 1024) { data, error in
                if let error = error {
                    print("Error downloading profile photo: \(error.localizedDescription)")
                } else {
                    // Successfully downloaded profile photo data
                    if let imageData = data, let profileImage = UIImage(data: imageData) {
                        // Use 'profileImage' as the downloaded profile photo
                        DispatchQueue.main.async {
                            imageView.image = profileImage
                        }
                    } else {
                        // Error decoding image data or empty image data
                        print("Error decoding profile photo data or empty data")
                    }
                }
            }
        } else {
            // Handle the case where 'uid' is nil
            print("User ID is nil")
        }

        return imageView
    }()
    
    let welcomeLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = UIFont(name: "Avenir-Light", size:30)
        label.textColor = .white
        return label
    }()
    
    let editAccountButton: UIButton = {
        let button = UIButton()
        // Set up edit account button text and action
        button.setTitle("Edit Account", for: .normal)
        button.addTarget(self, action: #selector(editAccountButtonTapped), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = UIColor.systemBlue // Set a background color
        button.setTitleColor(UIColor.white, for: .normal) // Set text color
        button.layer.cornerRadius = 8 // Apply corner radius for a rounded appearance
        button.layer.masksToBounds = true
        
        // Increase font size
        button.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .bold) // Adjust the size as needed
        
        // Increase button size
        button.widthAnchor.constraint(equalToConstant: 300).isActive = true
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        
        return button
    }()
    
    let callSupportButton: UIButton = {
        let button = UIButton()
        // Set up call support button text and action
        button.setTitle("Email Support", for: .normal)
        button.addTarget(self, action: #selector(emailSupport), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = UIColor.systemGreen // Set a background color
        button.setTitleColor(UIColor.white, for: .normal) // Set text color
        button.layer.cornerRadius = 8 // Apply corner radius for a rounded appearance
        button.layer.masksToBounds = true
        
        // Increase font size
        button.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .bold) // Adjust the size as needed
        
        // Increase button size
        button.widthAnchor.constraint(equalToConstant: 300).isActive = true
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return button
    }()
    
    let logoutButton: UIButton = {
        let button = UIButton()
        // Set up logout button text and action
        button.setTitle("Logout", for: .normal)
        button.addTarget(self, action: #selector(logoutButtonTapped), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = UIColor.systemRed // Set a background color
        button.setTitleColor(UIColor.white, for: .normal) // Set text color
        button.layer.cornerRadius = 8 // Apply corner radius for a rounded appearance
        button.layer.masksToBounds = true
        
        // Increase font size
        button.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .bold) // Adjust the size as needed
        
        // Increase button size
        button.widthAnchor.constraint(equalToConstant: 300).isActive = true
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return button
    }()
    
    let deleteAccountButton: UIButton = {
        let button = UIButton()
        // Set up logout button text and action
        button.setTitle("Delete Account", for: .normal)
        button.addTarget(self, action: #selector(deleteButtonTapped), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = UIColor.systemRed // Set a background color
        button.setTitleColor(UIColor.white, for: .normal) // Set text color
        button.layer.cornerRadius = 8 // Apply corner radius for a rounded appearance
        button.layer.masksToBounds = true
        
        // Increase font size
        button.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .bold) // Adjust the size as needed
        
        // Increase button size
        button.widthAnchor.constraint(equalToConstant: 300).isActive = true
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return button
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .black
        edgesForExtendedLayout = [] // Ensures safe area layout

        // Create and configure the background image view
        let backgroundImageView = UIImageView()
        backgroundImageView.image = UIImage(named: "mowie1024")
        backgroundImageView.contentMode = .scaleAspectFit
        backgroundImageView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(backgroundImageView)
        view.sendSubviewToBack(backgroundImageView)

        // Pin the background image view to the edges with optional padding
        NSLayoutConstraint.activate([
            backgroundImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            backgroundImageView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            backgroundImageView.widthAnchor.constraint(lessThanOrEqualTo: view.widthAnchor, multiplier: 1.0),
            backgroundImageView.heightAnchor.constraint(lessThanOrEqualTo: view.heightAnchor, multiplier: 1.0)
        ])

        // Add a semi-transparent overlay
        let overlayView = UIView()
        overlayView.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        overlayView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(overlayView)
        view.bringSubviewToFront(overlayView)

        NSLayoutConstraint.activate([
            overlayView.topAnchor.constraint(equalTo: view.topAnchor),
            overlayView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            overlayView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            overlayView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

        setupNavigationBar()

        welcomeLabel.text = "Welcome \(pro.firstname),"
        view.addSubview(welcomeLabel)

        view.addSubview(userImageView)
        view.addSubview(vehicleImageView)
        view.addSubview(editAccountButton)
        view.addSubview(callSupportButton)
        view.addSubview(logoutButton)
        view.addSubview(deleteAccountButton)

        setupConstraints()
    }

    
    init(pro: Pro) {
        self.pro = pro
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func setupNavigationBar() {
        // Logo in the middle
        let logoImageView = UIImageView(image: UIImage(named: "mowietranssplash"))
        logoImageView.contentMode = .scaleAspectFill
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        logoImageView.widthAnchor.constraint(equalToConstant: 130).isActive = true
        logoImageView.heightAnchor.constraint(equalToConstant: 200).isActive = true

        navigationItem.titleView = logoImageView
    }
    
    func setupConstraints() {
        // Add constraints for welcomeLabel
        NSLayoutConstraint.activate([
            welcomeLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 10),
            welcomeLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 10)
        ])
        
        // Add constraints for userImageView
        NSLayoutConstraint.activate([
            userImageView.topAnchor.constraint(equalTo: welcomeLabel.bottomAnchor, constant: 20),
            userImageView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 50), // Adjust as needed
            userImageView.widthAnchor.constraint(equalToConstant: 100),
            userImageView.heightAnchor.constraint(equalToConstant: 100)
        ])
        
        // Add constraints for vehicleImageView
        NSLayoutConstraint.activate([
            vehicleImageView.topAnchor.constraint(equalTo: welcomeLabel.bottomAnchor, constant: 20), // Align with welcomeLabel
            vehicleImageView.leadingAnchor.constraint(equalTo: userImageView.trailingAnchor, constant: 50), // To the right of userImageView
            vehicleImageView.widthAnchor.constraint(equalToConstant: 100),
            vehicleImageView.heightAnchor.constraint(equalToConstant: 100)
        ])
        
        // Add constraints for editAccountButton
        NSLayoutConstraint.activate([
            editAccountButton.topAnchor.constraint(equalTo: userImageView.bottomAnchor, constant: 20),
            editAccountButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
        
        // Add constraints for callSupportButton
        NSLayoutConstraint.activate([
            callSupportButton.topAnchor.constraint(equalTo: editAccountButton.bottomAnchor, constant: 50),
            callSupportButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
        
        // Add constraints for logoutButton
        NSLayoutConstraint.activate([
            deleteAccountButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -100),
            deleteAccountButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
        
        // Add constraints for logoutButton
        NSLayoutConstraint.activate([
            logoutButton.bottomAnchor.constraint(equalTo: deleteAccountButton.topAnchor, constant: -20),
            logoutButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
    }
    
    func signOut() {
        do {
            try Auth.auth().signOut()
            DispatchQueue.main.async {
                let nav = UINavigationController(rootViewController: LoginController())
                self.present(nav, animated: true, completion: nil)
            }
        } catch {
            print("DEBUG: Error signing out")
        }
    }
    
    private func showPasswordChangeConfirmation() {
        let confirmationAlert = UIAlertController(title: "Password Change Requested",
                                                   message: "Your password change request has been submitted. Check your email",
                                                   preferredStyle: .alert)
        
        let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
        confirmationAlert.addAction(okAction)
        
        present(confirmationAlert, animated: true, completion: nil)
    }
    
    // MARK: - Selectors
    
    @objc private func userImageViewTapped() {
        print("User profile image tapped")
        // Call CameraManager or perform any other actions
        let cameraManager = CameraManager(photoType: "profilephoto")
        // Assuming you are in a UIViewController
        cameraManager.modalPresentationStyle = .fullScreen
        self.present(cameraManager, animated: true, completion: nil)
    }
    
    @objc private func vehicleImageViewTapped() {
        print("Vehicle image tapped")
        // Call CameraManager or perform any other actions
        let cameraManager = CameraManager(photoType: "carphoto")
        // Assuming you are in a UIViewController
        cameraManager.modalPresentationStyle = .fullScreen
        self.present(cameraManager, animated: true, completion: nil)
    }
    
    @objc func editAccountButtonTapped() {
        // Show action sheet for editing phone number or password
        let actionSheet = UIAlertController(title: "Edit Account", message: "What would you like to edit?", preferredStyle: .actionSheet)
        
        actionSheet.addAction(UIAlertAction(title: "Edit Phone Number", style: .default, handler: { _ in
            // Handle editing phone number
        }))
        
        actionSheet.addAction(UIAlertAction(title: "Change Password", style: .default, handler: { _ in
            // Handle changing password
            // Handle change password button tap
            let alertController = UIAlertController(title: "Change Password Request",
                                                    message: "Are you sure you want to request a password change?",
                                                    preferredStyle: .alert)
            
            let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
            let confirmAction = UIAlertAction(title: "Confirm", style: .default) { [weak self] _ in
                
                let email = self!.pro.email
                
                Auth.auth().sendPasswordReset(withEmail: email) { error in
                    if let error = error {
                        // Handle error
                        print("Password reset failed: \(error.localizedDescription)")
                    } else {
                        // Password reset email sent successfully
                        print("Password reset email sent successfully")
                        self?.showPasswordChangeConfirmation()
                    }
                }
            }
            
            alertController.addAction(cancelAction)
            alertController.addAction(confirmAction)
            
            self.present(alertController, animated: true, completion: nil)
        }))
        
        actionSheet.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        
        self.present(actionSheet, animated: true, completion: nil)
    }
    
    @objc func callSupportButtonTapped() {
        // Implement calling support functionality
        let phoneNumber = "tel://2482599713"

                // Create a URL with the phone number
                if let phoneURL = URL(string: phoneNumber), UIApplication.shared.canOpenURL(phoneURL) {
                    // Open the phone app
                    UIApplication.shared.open(phoneURL, options: [:], completionHandler: nil)
                } else {
                    // Handle the case where the phone app can't be opened
                    print("Unable to make a phone call.")
                }
    }
    
    // Target-action method for the Email Support Button
    @objc private func emailSupport() {
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        if MFMailComposeViewController.canSendMail() {
            let mailComposer = MFMailComposeViewController()
            mailComposer.setToRecipients(["mowie2023@gmail.com"])
            mailComposer.setSubject("Support Request - \(uid)")
            mailComposer.setMessageBody("Please describe your support request here.", isHTML: false)
            mailComposer.mailComposeDelegate = self // Make sure your view controller conforms to MFMailComposeViewControllerDelegate
            
            present(mailComposer, animated: true, completion: nil)
        } else {
            // Handle the case where the device is not configured to send emails
            print("Email cannot be sent from this device.")
        }
    }
    
    @objc private func deleteButtonTapped() {
        // Handle change password button tap
        let alertController = UIAlertController(title: "Delete Account",
                                                message: "Are you sure you want to delete your account?",
                                                preferredStyle: .alert)
        
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
        let confirmAction = UIAlertAction(title: "Confirm", style: .default) { [weak self] _ in
            
            Service.shared.deleteProAccount() { (result: Result<Void, Error>) -> Void in
                    switch result {
                    case .success:
                        print("Account deleted successfully.")
                        // Perform any additional actions on successful deletion
                        
                        // Assuming `ref` is not declared within this closure, you might want to handle it accordingly.
                        
                        self?.signOut()
                        
                    case .failure(let error):
                        print("Error deleting account: \(error.localizedDescription)")
                        // Handle the error, e.g., display an alert to the user
                    }
                }
            }

        alertController.addAction(cancelAction)
        alertController.addAction(confirmAction)
        
        present(alertController, animated: true, completion: nil)
    }
    
    @objc func logoutButtonTapped() {
        // Implement logout functionality
        let alert = UIAlertController(title: nil, message: "Are you sure you want to logout?", preferredStyle: .actionSheet)
        alert.addAction(UIAlertAction(title: "Log Out", style: .destructive, handler: { _ in self.signOut()
            
            let nav = UINavigationController(rootViewController: LoginController())
            if #available(iOS 13.0, *) {
                nav.isModalInPresentation = true
            }
            nav.modalPresentationStyle = .fullScreen
            self.present(nav, animated: true, completion: nil)
        } ))
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        
        self.present(alert, animated: true, completion: nil)
    }
}
