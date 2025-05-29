//
//  HelpPageController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/29/23.
//

import UIKit
import MessageUI
import FirebaseAuth

class HelpPageController: UIViewController, UITableViewDelegate, UITableViewDataSource, MFMailComposeViewControllerDelegate {
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    let tableView = UITableView()
    let toolbar = UIToolbar()

    let faqs: [(question: String, answer: String)] = [
        ("How to get started and add properties?", "Select Menu button on top left corner. Select Add Job to add jobs"),
        ("What services does your lawn care app offer?", "Our lawn care app offers a variety of services, including mowing, and trash removal."),
        ("How do I pay for services?", "Payment is handled through the app and can be made with a credit or debit card..."),
        ("Still need help?", "Email us @ mowie2023@gmail.com Subject Line: Mowie Request"),
    ]

    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Apply dark green gradient background
        view.applyDarkGreenGradient()
        view.animateGradientShift()
        
        view.addSubview(tableView)
        view.addSubview(toolbar)

        configureTableView()
        configureToolbar()
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Reapply gradient after layout changes
        view.applyDarkGreenGradient()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        view.animateScreenAppearance()
    }
    
    func configureTableView() {
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.backgroundColor = .clear
        tableView.separatorStyle = .none

        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: toolbar.topAnchor)
        ])
    }

    func configureToolbar() {
        toolbar.translatesAutoresizingMaskIntoConstraints = false
        toolbar.barStyle = .black
        toolbar.isTranslucent = true
        toolbar.setBackgroundImage(UIImage(), forToolbarPosition: .any, barMetrics: .default)
        toolbar.setShadowImage(UIImage(), forToolbarPosition: .any)
        toolbar.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.6)
        
        let emailSupportItem = UIBarButtonItem(title: "Email Support", style: .plain, target: self, action: #selector(emailSupport))
        emailSupportItem.tintColor = UIColor.primaryGreen
        
        toolbar.setItems([
            UIBarButtonItem(barButtonSystemItem: .close, target: self, action: #selector(handleDismissal)),
            UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil),
            emailSupportItem
        ], animated: false)
        toolbar.tintColor = UIColor.primaryGreen

        NSLayoutConstraint.activate([
            toolbar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            toolbar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            toolbar.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    @objc private func emailSupport() {
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        if MFMailComposeViewController.canSendMail() {
            let mailComposer = MFMailComposeViewController()
            mailComposer.setToRecipients(["mowie2023@gmail.com"])
            mailComposer.setSubject("Support Request - \(uid)")
            mailComposer.setMessageBody("Please describe your support request here.", isHTML: false)
            mailComposer.mailComposeDelegate = self
            present(mailComposer, animated: true, completion: nil)
        } else {
            showAlertForEmailError()
        }
    }
    
    func showAlertForEmailError() {
        let alert = UIAlertController(title: "Email Not Configured",
                                      message: "You can manually email us at mowie2023@gmail.com",
                                      preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Copy Email", style: .default, handler: { _ in
            UIPasteboard.general.string = "mowie2023@gmail.com"
        }))
        alert.addAction(UIAlertAction(title: "OK", style: .cancel, handler: nil))
        present(alert, animated: true, completion: nil)
    }
    
    @objc func handleDismissal() {
        dismiss(animated: true, completion: nil)
    }

    // MARK: - UITableViewDataSource
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return faqs.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
        cell.textLabel?.text = faqs[indexPath.row].question
        cell.textLabel?.numberOfLines = 0
        cell.textLabel?.textColor = .white
        cell.textLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        cell.backgroundColor = UIColor.glassCard
        cell.layer.cornerRadius = 12
        cell.layer.borderColor = UIColor.glassBorder.cgColor
        cell.layer.borderWidth = 1
        cell.accessoryType = .disclosureIndicator
        cell.tintColor = UIColor.primaryGreen
        cell.selectionStyle = .none
        return cell
    }

    // MARK: - UITableViewDelegate
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let answer = faqs[indexPath.row].answer
        showAlert(message: answer)
        tableView.deselectRow(at: indexPath, animated: true)
    }

    func showAlert(message: String) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.view.tintColor = UIColor.primaryGreen
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return 70
    }
}
