//
//  OnboardController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 2/2/24.
//

import Foundation
import UIKit
import WebKit
import Alamofire
import FirebaseAuth

class OnboardController: UIViewController {
    
    private let pro: Pro
    private let connectid: String
    let headerView = UIView()
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "ONBOARD"
        label.font = UIFont(name: "Avenir-Light", size:36)
        label.textColor = UIColor(white: 1, alpha: 0.8)
        
        return label
    }()
    
    let launchButton: UIButton = {
        let button = UIButton()
        // Set up logout button text and action
        button.setTitle("Complete Onboard", for: .normal)
        button.addTarget(self, action: #selector(launchButtonTapped), for: .touchUpInside)
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
    
    let logOutButton: UIButton = {
        let button = UIButton()
        // Set up logout button text and action
        button.setTitle("Log Out", for: .normal)
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
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .systemBackground
        customizeHeader()
        configureUI()
        
        // Stack View
        let stackView = UIStackView(arrangedSubviews: [launchButton, logOutButton])
        stackView.axis = .vertical
        stackView.spacing = 20
        stackView.alignment = .center
        stackView.translatesAutoresizingMaskIntoConstraints = false

        // Add Stack View to the view
        view.addSubview(stackView)

        // Constraints
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
    }
    
    init(pro: Pro) {
        self.pro = pro
        self.connectid = self.pro.connectid
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func customizeHeader() {
        // Add your header view
        headerView.backgroundColor = .mowieColor
        headerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(headerView)
        
        // Add backButton to the header view
        let backButton = UIButton(type: .system)
        backButton.setImage(UIImage(systemName: "chevron.left"), for: .normal)
        backButton.addTarget(self, action: #selector(goBack), for: .touchUpInside)
        backButton.translatesAutoresizingMaskIntoConstraints = false
        headerView.addSubview(backButton)
        
        // Add constraints for the backButton
        NSLayoutConstraint.activate([
            backButton.leadingAnchor.constraint(equalTo: headerView.leadingAnchor, constant: 16),
            backButton.centerYAnchor.constraint(equalTo: headerView.centerYAnchor),
            backButton.widthAnchor.constraint(equalToConstant: 30),
            backButton.heightAnchor.constraint(equalToConstant: 30)
        ])
        
        // Add titleLabel to the header view
        headerView.addSubview(titleLabel)
        
        // Add constraints for the header view
        NSLayoutConstraint.activate([
            headerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            headerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        
        // Add constraints for the titleLabel within the header view
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: headerView.safeAreaLayoutGuide.topAnchor, constant: 0),
            titleLabel.centerXAnchor.constraint(equalTo: headerView.centerXAnchor),
            titleLabel.bottomAnchor.constraint(equalTo: headerView.bottomAnchor, constant: -5)
        ])
    }
    
    func configureUI() {
        print("Onboard Config UI")
        // Add a back button
        let backButton = UIBarButtonItem(image: UIImage(systemName: "chevron.left"), style: .plain, target: self, action: #selector(goBack))
        navigationItem.leftBarButtonItem = backButton
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
    
    func sendGetRequest() {
        // Replace the base URL with the actual endpoint you want to request
        var urlString = "https://mowie-pro-server.onrender.com/onboarding-link"
        print("URL: \(urlString)")
        print("Connect: \(self.pro.connectid)")
        print("String: \(self.connectid)")
        // Define your query parameters
        let parameters: [String: String] = [
            "account": "\(self.connectid)"
        ]
        
        // Append the query parameters to the URL
        urlString += "?" + parameters.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
        print("URL: \(urlString)")
        
        // Convert the URL string to a URL object
        if let url = URL(string: urlString) {
            // Create a URL request
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            
            // Perform the GET request
            let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
                if let error = error {
                    print("Error: \(error)")
                } else if let data = data {
                    // Handle the response data
                    if let responseString = String(data: data, encoding: .utf8) {
                        if let url = URL(string: urlString) {
                                // Successfully converted the string to a URL
                                print("URL: \(url)")
                            // Update the UI on the main thread
                            DispatchQueue.main.async {
                                UIApplication.shared.open(url, options: [:], completionHandler: nil)
                            }
                            } else {
                                // Failed to convert the string to a URL
                                print("Invalid URL string")
                            }
                    }
                }
            }
            task.resume()
        }
    }
    
    // MARK: - Selectors

    @objc private func logoutButtonTapped() {
        // Handle Log Out button tap
        print("Log Out button tapped")
        self.signOut()
    }
    
    @objc func launchButtonTapped() {
        print("Launch Button Selected!")
        sendGetRequest()
    }

    // Action for the back button
    @objc func goBack() {
        let tab = TabController()
        tab.modalPresentationStyle = .fullScreen
        self.present(tab, animated: true, completion: nil)
    }
}
