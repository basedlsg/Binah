//
//  DoNotPassController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 2/1/24.
//

import Foundation
import UIKit
import MessageUI
import Firebase
import FirebaseAuth

class DoNotPassController: UIViewController {

    let warningString: String

    init(warningString: String) {
        self.warningString = warningString
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupUI()
        configureNavigationBar()
    }

    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Logo ImageView
        let logoImageView = UIImageView()
        logoImageView.image = UIImage(named: "mowie1024") // Ensure image exists in Assets
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        
        // Round the corners
        logoImageView.layer.cornerRadius = 75  // Adjust the radius as needed
        logoImageView.layer.masksToBounds = true // Ensures the corner radius is applied

        // Warning Label
        let warningLabel = UILabel()
        warningLabel.text = warningString
        warningLabel.textAlignment = .center
        warningLabel.numberOfLines = 0
        warningLabel.font = UIFont.boldSystemFont(ofSize: 20)
        warningLabel.translatesAutoresizingMaskIntoConstraints = false

        // Email Support Button
        let emailSupportButton = UIButton(type: .system)
        emailSupportButton.setTitle("Email Support", for: .normal)
        // Set background color
        emailSupportButton.backgroundColor = UIColor.systemGreen
        emailSupportButton.setTitleColor(UIColor.white, for: .normal)
        emailSupportButton.addTarget(self, action: #selector(emailSupportButtonTapped), for: .touchUpInside)
        emailSupportButton.translatesAutoresizingMaskIntoConstraints = false
        
        emailSupportButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 20)
        emailSupportButton.layer.cornerRadius = 8.0

        // Log Out Button
        let logOutButton = UIButton(type: .system)
        logOutButton.setTitle("Log out", for: .normal)
        // Set background color
        logOutButton.backgroundColor = UIColor.mainBlueTint
        logOutButton.setTitleColor(UIColor.white, for: .normal)
        logOutButton.addTarget(self, action: #selector(logOutButtonTapped), for: .touchUpInside)
        logOutButton.translatesAutoresizingMaskIntoConstraints = false
        
        logOutButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 20)
        logOutButton.layer.cornerRadius = 8.0

        // Delete Account Button
        let deleteAccountButton = UIButton(type: .system)
        deleteAccountButton.setTitle("Delete Account", for: .normal)
        // Set background color
        deleteAccountButton.backgroundColor = UIColor.red
        deleteAccountButton.setTitleColor(UIColor.white, for: .normal)
        deleteAccountButton.addTarget(self, action: #selector(deleteAccountButtonTapped), for: .touchUpInside)
        deleteAccountButton.translatesAutoresizingMaskIntoConstraints = false
        
        deleteAccountButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 20)
        deleteAccountButton.layer.cornerRadius = 8.0

        // Stack View
        let stackView = UIStackView(arrangedSubviews: [warningLabel, emailSupportButton, logOutButton, deleteAccountButton])
            stackView.axis = .vertical
            stackView.spacing = 20
            stackView.alignment = .center
            stackView.translatesAutoresizingMaskIntoConstraints = false

        // Add views to the main view
        view.addSubview(logoImageView)
        view.addSubview(stackView)

        // Constraints
        NSLayoutConstraint.activate([
            // Logo ImageView at the top center
            logoImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            logoImageView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            logoImageView.widthAnchor.constraint(equalToConstant: 150), // Set explicit size
            logoImageView.heightAnchor.constraint(equalToConstant: 150),

            // Stack View below the logo
            stackView.topAnchor.constraint(equalTo: logoImageView.bottomAnchor, constant: 30),
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
        
        emailSupportButton.widthAnchor.constraint(equalTo: view.widthAnchor, constant: -50).isActive = true
        
        logOutButton.widthAnchor.constraint(equalTo: view.widthAnchor, constant: -50).isActive = true
        
        deleteAccountButton.widthAnchor.constraint(equalTo: view.widthAnchor, constant: -50).isActive = true
    }
    
    func configureNavigationBar() {
        navigationController?.navigationBar.prefersLargeTitles = true
        navigationController?.navigationBar.isTranslucent = false
        navigationController?.navigationBar.backgroundColor = .mowieColor
        navigationController?.navigationBar.barStyle = .black
        navigationItem.title = "Background Check"
        navigationController?.navigationBar.barTintColor = .red
    }
    
    func signOut() {
        do {
            try Auth.auth().signOut()
            DispatchQueue.main.async {
                let nav = UINavigationController(rootViewController: LoginController())
                nav.modalPresentationStyle = .fullScreen
                self.present(nav, animated: true, completion: nil)
            }
        } catch {
            print("DEBUG: Error signing out")
        }
    }
    
    // MARK: - Selectors
    
    @objc private func emailSupportButtonTapped() {
        // Handle Email Support button tap
        print("Email Support button tapped")
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        if MFMailComposeViewController.canSendMail() {
            let mailComposer = MFMailComposeViewController()
            mailComposer.setToRecipients(["mowie2023@gmail.com"])
            mailComposer.setSubject("Background Check Support Request - \(uid)")
            mailComposer.setMessageBody("Please describe your support request here.", isHTML: false)
            mailComposer.mailComposeDelegate = self // Make sure your view controller conforms to MFMailComposeViewControllerDelegate
            
            present(mailComposer, animated: true, completion: nil)
        } else {
            // Handle the case where the device is not configured to send emails
            print("Email cannot be sent from this device.")
        }
    }

    @objc private func logOutButtonTapped() {
        // Handle Log Out button tap
        print("Log Out button tapped")
        self.signOut()
    }

    @objc private func deleteAccountButtonTapped() {
        // Handle Delete Account button tap
        print("Delete Account button tapped")
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
}

extension DoNotPassController: MFMailComposeViewControllerDelegate {
    func mailComposeController(_ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?) {
        // Handle the result and dismiss the mail composer
        func mailComposeController(_ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?) {
                switch result {
                case .cancelled:
                    // Handle the cancellation
                    print("Email composition cancelled")
                case .saved:
                    // Handle the email being saved as a draft
                    print("Email saved as draft")
                case .sent:
                    // Handle the email being sent successfully
                    print("Email sent successfully")
                case .failed:
                    // Handle the failure to send the email
                    if let error = error {
                        print("Email sending failed with error: \(error.localizedDescription)")
                    } else {
                        print("Email sending failed")
                    }
                default:
                    break
                }

                // Dismiss the mail composer
                controller.dismiss(animated: true, completion: nil)
            }
        controller.dismiss(animated: true, completion: nil)
    }
}
