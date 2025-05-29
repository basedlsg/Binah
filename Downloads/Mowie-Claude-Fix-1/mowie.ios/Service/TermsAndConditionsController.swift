//
//  TermsAndConditionsController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 1/18/24.
//

import Foundation
import UIKit

class TermsAndConditionsController: UIViewController {

    private let textView: UITextView = {
            let textView = UITextView()
            textView.isEditable = false
            textView.backgroundColor = .clear
            textView.font = UIFont.systemFont(ofSize: 12)
            textView.text = "Terms and Conditions \r\n• Acceptance of Terms. By using our App, you agree to these terms and conditions, which\r\nmay be updated by us from time to time without notice. Your continued use of the App\r\nconstitutes your acceptance of any updates or changes.\r\n\r\n• Use of Application. Our application is provided for a quicker and easier lawn service.\r\nYou agree to use our app at your own risk and that we will not be liable for any damages\r\nor losses that may result from your use of the application.\r\n\r\n• User Conduct. You agree to use the app in a lawful and responsible manner and not to\r\nengage in any conduct that may be harmful to us or our users.\r\n\r\n• Intellectual Property. The platform and all content on the app are owned by us or our\r\nlicensors and are protected by copyright, trademark, and other intellectual property laws.\r\nYou agree not to reproduce, modify, distribute, or create derivative works based on the\r\napp or its content without our express written permission.\r\n\r\n• Privacy. We respect your privacy and are committed to protecting your personal\r\ninformation. Our privacy policy explains how we collect, use, and protect your\r\ninformation.\r\n\r\n• Indemnification. You agree to indemnify and hold us harmless from any claims,\r\ndamages, or losses arising from your use of the application or any breach of these terms\r\nand conditions.\r\n\r\n• Disclaimers. The application is provided on an \"as is\" and \"as available\" basis without\r\nany warranties, express or implied. We do not warrant that the app will be uninterrupted\r\nor error-free.\r\n\r\n• Governing Law. These terms and conditions shall be governed by and construed in\r\naccordance with the laws of the jurisdiction in which we operate, without giving effect to\r\nany principles of conflicts of law in the State of Michigan.\r\n\r\n• Entire Agreement. These terms and conditions constitute the entire agreement between\r\nyou and us and supersede any prior agreements or understandings, whether written or\r\noral, relating to the platform.\r\n\r\n Third-Party Payments\n\n Mowie does not store any payment information on our servers, and all\r\npayment data is encrypted to protect your personal and financial information. The third-party\r\npayment gateway we use is fully compliant and adheres to industry-leading security standards to\r\nensure the safety and security of all transactions. By using a third-party payment gateway, we\r\ncan ensure that your payments are processed quickly and securely, giving you peace of mind\r\nwhen making transactions through our app.\r\n\r\nAll contractors working with Mowie, Inc. are subject to a thorough background check. We\r\nbelieve in hiring only the best and most trustworthy contractors to work with our clients. Our\r\nbackground checks include a review of criminal history, driving records, and employment\r\nhistory. We also check for any outstanding liens, judgments, or legal issues. By conducting\r\nthorough background checks, we can ensure that our clients are receiving the highest level of\r\nservice from Pros who have a clean record and a proven track record of reliability and\r\nprofessionalism.\r\n\r\n"
            return textView
        }()
    
    let acceptButton: UIButton = {
        let button = UIButton()
        button.setTitle("Accept", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .mainBlueTint
        button.addTarget(self, action: #selector(acceptButtonTapped), for: .touchUpInside)
        return button
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .lightGray
        setupTextView()
        setupAcceptButton()
    }

    private func setupTextView() {
            view.addSubview(textView)
            textView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                textView.topAnchor.constraint(equalTo: view.topAnchor),
                textView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                textView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                textView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -32)
            ])

            // Customize the text view as needed
        }

        private func setupAcceptButton() {
            view.addSubview(acceptButton)
            acceptButton.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                acceptButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
                acceptButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
                acceptButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
                acceptButton.heightAnchor.constraint(equalToConstant: 44)
            ])

            // Customize the accept button as needed
        }

        @objc func acceptButtonTapped() {
            // Handle user acceptance
            UserDefaults.standard.set(true, forKey: "HasAcceptedTerms")
            print("Terms Accepted")

            let tab = TabController()
            tab.modalPresentationStyle = .fullScreen
            present(tab, animated: true, completion: nil)
        }
}

