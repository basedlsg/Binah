//
//  EarningsController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/14/23.
//

import UIKit

class EarningsController: UITabBarController {
    private let pro: Pro
    let headerView = UIView()
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "EARNINGS"
        label.font = UIFont(name: "Avenir-Light", size:36)
        label.textColor = UIColor(white: 1, alpha: 0.8)
        
        return label
    }()
    
    let launchButton: UIButton = {
        let button = UIButton()
        // Set up logout button text and action
        button.setTitle("Launch", for: .normal)
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
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .systemBackground
        edgesForExtendedLayout = []
        
        print("Earnings")
        
        setupNavigationBar()
        configureUI()
        
        view.addSubview(launchButton)
        
        // Add constraints for callSupportButton
        NSLayoutConstraint.activate([
            launchButton.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            launchButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
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
    
    func configureUI() {
        print("Earnings Config UI")
        // Add a back button
        let backButton = UIBarButtonItem(image: UIImage(systemName: "chevron.left"), style: .plain, target: self, action: #selector(goBack))
        navigationItem.leftBarButtonItem = backButton
    }
    
    func sendPostRequest(completion: @escaping (Result<String, Error>) -> Void) {
        // Properly encode the URL
        let connectID = self.pro.connectid
        
        guard let urlString = "https://mowie-pro-server.onrender.com/v1/accounts/\(connectID)/login_links".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: urlString) else {
            print("Invalid URL")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // Add any required headers or body parameters
        // For example, setting the content type to JSON
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add any additional data to the request body if needed
        // For example, a JSON payload
        
        let jsonPayload: [String: Any] = [
            "account": "\(connectID)"
        ]
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: jsonPayload)
            request.httpBody = jsonData
        } catch {
            print("Error encoding JSON: \(error)")
            completion(.failure(error))
            return
        }

        let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
            if let error = error {
                print("Error: \(error)")
                completion(.failure(error))
            } else if let data = data,
                      let responseString = String(data: data, encoding: .utf8) {
                 // Successfully received response data
                 print("Response String: \(responseString)")

                 // Assuming the responseString is a valid URL string
                 if let link = URL(string: responseString) {
                     // Update the UI on the main thread
                     DispatchQueue.main.async {
                         UIApplication.shared.open(link, options: [:], completionHandler: nil)
                     }
                     completion(.success(responseString))
                 } else {
                     // Failed to convert the string to a URL
                     print("Invalid URL string")
                     let error = NSError(domain: "InvalidURL", code: 0, userInfo: nil)
                     completion(.failure(error))
                 }
             }

        }

        task.resume()
    }

    // MARK: - Selectors
    
    @objc func launchButtonTapped() {
        print("Launch Button Selected!")
        sendPostRequest { result in
            switch result {
            case .success(let responseString):
                // Handle success
                print("Request succeeded with response: \(responseString)")

            case .failure(let error):
                // Handle failure
                print("Request failed with error: \(error)")
            }
        }
    }
    
    // Action for the back button
    @objc func goBack() {
        let tab = TabController()
        tab.modalPresentationStyle = .fullScreen
        self.present(tab, animated: true, completion: nil)
    }
}
