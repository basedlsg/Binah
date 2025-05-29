//
//  ProSignUpController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 1/20/24.
//

import Foundation
import UIKit
import Firebase
import FirebaseAuth

class ProSignUpController: UIViewController, UITextFieldDelegate {
    
    // MARK: - Properties
    
    private var values: [String : Any] = [:]
    private var loadingIndicator: UIActivityIndicatorView!
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Mowie"
        label.font = UIFont(name: "Avenir-Light", size: 36)
        label.textColor = UIColor(white: 1, alpha: 0.8)
        return label
    }()
    
    private lazy var businessNameContainerView: UIView = {
        let view = UIView().inputContainerView(systemName: "case.fill", textField: businessNameTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private lazy var einNumberContainerView: UIView = {
        let view = UIView().inputContainerView(systemName: "case.fill", textField: einNumberTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let businessNameTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Business Name", isSecureTextEntry: false)
    }()
    
    private let einNumberTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "EIN Number", isSecureTextEntry: false)
    }()
    
    private let signUpButton: AuthButton = {
        let button = AuthButton(type: .system)
        button.setTitle("COMPLETE SIGN UP", for: .normal)
        button.titleLabel?.font = UIFont.boldSystemFont(ofSize: 20)
        button.addTarget(self, action: #selector(handleSignUp), for: .touchUpInside)
        return button
    }()
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        addDoneButtonTo(businessNameTextField)
        addDoneButtonTo(einNumberTextField)
        
        businessNameTextField.delegate = self
        einNumberTextField.delegate = self
        
        configureUI()
    }
    
    init(values: [String : Any]) {
        self.values = values
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func configureUI() {
        view.backgroundColor = .backgroundColor
        
        view.addSubview(titleLabel)
        titleLabel.anchor(top: view.safeAreaLayoutGuide.topAnchor)
        titleLabel.centerX(inView: view)
        
        let stack = UIStackView(arrangedSubviews: [businessNameContainerView,
                                                   einNumberContainerView,
                                                   signUpButton])
        stack.axis = .vertical
        stack.distribution = .fillProportionally
        stack.spacing = 24
        
        view.addSubview(stack)
        stack.translatesAutoresizingMaskIntoConstraints = false
        // Add constraints for userImageView
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
    }
    
    func createConnect(pro: [String: Any], completion: @escaping (Result<String, Error>) -> Void) {
        // URL for the API endpoint
        let urlString = "https://mowie-pro-server.onrender.com/v1/accounts"
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        let email = pro["email"] ?? ""
        let proid = pro["id"] ?? ""
        
        print("Email: \(email), Pro ID: \(proid)")
        
        let stripePro = ["email": email,
                         "proid": proid]
        
        // Prepare the request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // Convert the array of dictionaries to JSON data
        let jsonData: Data
        do {
            jsonData = try JSONSerialization.data(withJSONObject: stripePro)
            request.httpBody = jsonData
            print(jsonData)
        } catch {
            completion(.failure(error))
            return
        }
        
        // Set the content type
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Create a URLSession task for the request
        let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            // Check if data is present
            guard let data = data else {
                completion(.failure(NSError(domain: "No data received", code: 0, userInfo: nil)))
                return
            }
            
            // Convert the response data to a string (you may need to adjust this based on the actual response format)
            if let customerId = String(data: data, encoding: .utf8) {
                completion(.success(customerId))
            } else {
                completion(.failure(NSError(domain: "Unable to parse response", code: 0, userInfo: nil)))
            }
        }
        
        // Start the URLSession task
        task.resume()
    }
    
    // MARK: - Helper Functions
    
    // Function to show an alert
    func showAlert(message: String) {
        let alertController = UIAlertController(title: "Alert", message: message, preferredStyle: .alert)
        let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
        alertController.addAction(okAction)
        present(alertController, animated: true, completion: nil)
    }
    
    func addDoneButtonTo(_ textField: UITextField) {
        let toolbar = UIToolbar()
        toolbar.sizeToFit()
        
        let flexSpace = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
        let doneButton = UIBarButtonItem(barButtonSystemItem: .done, target: self, action: #selector(doneButtonTapped))
        
        toolbar.items = [flexSpace, doneButton]
        
        textField.inputAccessoryView = toolbar
    }
    
    @objc func doneButtonTapped() {
        // You can perform any action when the "Done" button is tapped
        view.endEditing(true)
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        return true
    }
    
    // MARK: - Selectors
    
    @objc func handleSignUp() {
        guard let businessName = businessNameTextField.text, !businessName.isEmpty else {
            showAlert(message: "Please enter your business name.")
            return
        }
        
        guard let einNumber = einNumberTextField.text, !einNumber.isEmpty else {
            showAlert(message: "Please enter your EIN number.")
            return
        }
        
        // Perform sign-up logic here
        self.createConnect(pro: self.values) { result in
            switch result {
            case .success(let onboard):
                print("On Board: \(onboard)")
                
                guard let uid = Auth.auth().currentUser?.uid else { return }
                
                self.values["businessname"] = businessName
                self.values["einnumber"] = einNumber
                self.values["connectid"] = onboard
                
                let databaseRef = Database.database().reference().child("users")
                
                let userRef = databaseRef.child(uid)
                userRef.setValue(self.values) { (error, ref) in
                    if let error = error {
                        print("Data could not be saved: \(error.localizedDescription)")
                        return
                    } else {
                        print("Initial data saved successfully!")
                        // Request Background Check
                        let login = LoginController()
                        login.modalPresentationStyle = .fullScreen
                        self.present(login, animated: true, completion: nil)
                    }
                    
                    // Example: Display entered data
                    print("Business Name: \(businessName)")
                    print("EIN Number: \(einNumber)")
                }
            case .failure(_):
                print("Error:")
                return
            }
        }
    }
}
