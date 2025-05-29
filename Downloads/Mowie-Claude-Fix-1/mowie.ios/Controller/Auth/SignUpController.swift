//
//  SignUpController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 11/14/23.
//

import UIKit
import Foundation
import Firebase
import FirebaseAuth

class SignUpController: UIViewController, UITextFieldDelegate {
    
    // MARK: - Properties
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    private var location = LocationHandler.shared.locationManager.location
    
    private var loadingIndicator: UIActivityIndicatorView!
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Mowie"
        label.font = UIFont(name: "Avenir-Light", size: 36)
        label.textColor = .white
        return label
    }()
    
    private lazy var emailContainerView: UIView = {
        let view = UIView().inputContainerView(systemName: "envelope", textField: emailTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private lazy var firstnameContainerView: UIView = {
        let view = UIView().inputContainerView(systemName: "person.fill", textField: firstnameTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private lazy var lastnameContainerView: UIView = {
        let view = UIView().inputContainerView(systemName: "person", textField: lastnameTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private lazy var phoneContainerView: UIView = {
        let view = UIView().inputContainerView(systemName: "phone", textField: phoneTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private lazy var passwordContainerView: UIView = {
        let view = UIView().inputContainerView(systemName: "lock", textField: passwordTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private lazy var confirmPasswordContainerView: UIView = {
        let view = UIView().inputContainerView(systemName: "lock.fill", textField: confirmPasswordTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private lazy var accountTypeContainerView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        
        // Clean segmented control without borders
        accountTypeSegmentedControl.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(accountTypeSegmentedControl)
        
        NSLayoutConstraint.activate([
            accountTypeSegmentedControl.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            accountTypeSegmentedControl.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            accountTypeSegmentedControl.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            accountTypeSegmentedControl.heightAnchor.constraint(equalToConstant: 40)
        ])
        
        return view
    }()
    
    private let emailTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Email",
                                       isSecureTextEntry: false)
    }()
    
    private let firstnameTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "First Name",
                                       isSecureTextEntry: false)
    }()
    
    private let lastnameTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Last Name",
                                       isSecureTextEntry: false)
    }()
    
    private let phoneTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Phone Number",
                                       isSecureTextEntry: false)
    }()
    
    private let passwordTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Password",
                                       isSecureTextEntry: true)
    }()
    
    private let confirmPasswordTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Confirm Password",
                                       isSecureTextEntry: true)
    }()
    
    private let accountTypeSegmentedControl: UISegmentedControl = {
        let sc = UISegmentedControl(items: ["Customer", "Professional"])
        sc.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.2)
        sc.layer.borderColor = UIColor.white.withAlphaComponent(0.1).cgColor
        sc.layer.borderWidth = 1
        sc.selectedSegmentTintColor = UIColor.primaryGreen.withAlphaComponent(0.9)
        sc.setTitleTextAttributes([
            .foregroundColor: UIColor.white.withAlphaComponent(0.6),
            .font: UIFont.systemFont(ofSize: 15)
        ], for: .normal)
        sc.setTitleTextAttributes([
            .foregroundColor: UIColor.white,
            .font: UIFont.systemFont(ofSize: 15, weight: .medium)
        ], for: .selected)
        sc.selectedSegmentIndex = 0
        return sc
    }()
    
    private let signUpButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Sign Up", for: .normal)
        button.titleLabel?.font = UIFont.boldSystemFont(ofSize: 18)
        button.addTarget(self, action: #selector(handleSignUp), for: .touchUpInside)
        button.applyPrimaryGreenStyle()
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return button
    }()
    
    let alreadyHaveAccountButton: UIButton = {
        let button = UIButton(type: .system)
        let attributedTitle = NSMutableAttributedString(string: "Already have an account?  ", attributes: [NSAttributedString.Key.font: UIFont.systemFont(ofSize: 16), NSAttributedString.Key.foregroundColor: UIColor.lightGray])
        
        attributedTitle.append(NSAttributedString(string: "Log In", attributes: [NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 16), NSAttributedString.Key.foregroundColor: UIColor.primaryGreen]))
        
        button.addTarget(self, action: #selector(handleShowLogin), for: .touchUpInside)
        
        button.setAttributedTitle(attributedTitle, for: .normal)
        return button
    }()
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Add a "Done" button to the keyboard
        addDoneButtonTo(emailTextField)
        addDoneButtonTo(firstnameTextField)
        addDoneButtonTo(lastnameTextField)
        addDoneButtonTo(phoneTextField)
        addDoneButtonTo(passwordTextField)
        addDoneButtonTo(confirmPasswordTextField)
        
        // Set the delegate for text fields
        emailTextField.delegate = self
        firstnameTextField.delegate = self
        lastnameTextField.delegate = self
        phoneTextField.delegate = self
        passwordTextField.delegate = self
        confirmPasswordTextField.delegate = self
        
        configureUI()
        setupLoadingIndicator()
        setupTextFieldAnimations()
        
        // Configure navigation bar
        navigationController?.navigationBar.isHidden = true
        
        // Set status bar to light content
        navigationController?.navigationBar.barStyle = .black
        setNeedsStatusBarAppearanceUpdate()
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
    
    func createStripeCustomer(customers: [String: Any], completion: @escaping (Result<String, Error>) -> Void) {
        // URL for the API endpoint
        let urlString = "https://mowie-service-server.onrender.com/v1/customers"
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        let email = customers["email"] ?? ""
        let first = customers["firstname"] ?? ""
        let last = customers["lastname"] ?? ""
        let name = "\(first) \(last)"
        let phoneNumber = customers["phonenumber"] ?? ""
        
        print("Email: \(email), Name: \(name), Phone: \(phoneNumber)")
        
        let stripeCustomer = ["Email": email,
                              "Phone": phoneNumber,
                              "Name": name]
        
        // Prepare the request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // Convert the array of dictionaries to JSON data
        let jsonData: Data
        do {
            jsonData = try JSONSerialization.data(withJSONObject: stripeCustomer)
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
    
    func checkBackground(pro: [String: Any], completion: @escaping (Result<String, Error>) -> Void) {
        // URL for the API endpoint
        let urlString = "https://mowie-pro-server.onrender.com/send-softcheck"
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        let email = pro["email"] ?? ""
        let phoneNumber = pro["phonenumber"] ?? ""
        
        print("Email: \(email), Phone: \(phoneNumber)")
        
        let stripePro = ["email": email,
                         "phone": phoneNumber,
                         "request_us_criminal_record_check_tier_1": "true"]
        
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
    
    // MARK: - Selectors
    
    @objc func handleSignUp() {
        guard let email = emailTextField.text else { return }
        guard let password = passwordTextField.text else { return }
        guard let confirmPassword = confirmPasswordTextField.text else { return }
        guard let firstname = firstnameTextField.text else { return }
        guard let lastname = lastnameTextField.text else { return }
        guard let phone = phoneTextField.text else { return }
        let accountTypeIndex = accountTypeSegmentedControl.selectedSegmentIndex
        
        if isValidEmail(email) {
            print("Email is valid.")
        } else {
            print("Email is not valid.")
            showAlert(message: "Please enter a valid Email")
            return
        }
        
        if isValidFirstName(firstname) {
            print("First name is valid.")
        } else {
            print("First name is not valid.")
            showAlert(message: "Please enter a valid First name")
            return
        }
        
        if isValidLastName(lastname) {
            print("Last name is valid.")
        } else {
            print("Last name is not valid.")
            showAlert(message: "Please enter a valid Last name")
            return
        }
        
        if isValidPhoneNumber(phone) {
            print("Phone number is valid.")
        } else {
            print("Phone number is not valid.")
            showAlert(message: "Please enter a valid phone number")
            return
        }
        
        if isValidPassword(password) {
            print("Password is valid.")
        } else {
            print("Password is not valid.")
            showAlert(message: "Password is not valid. Please follow the password criteria.")
            return
        }
        
        if (password != confirmPassword) {
            showAlert(message: "Confirm Password does NOT match password")
            return
        }
        
        Auth.auth().createUser(withEmail: email, password: password) { (result, error) in
            if let error = error {
                print("DEBUG: Failed to register user with error \(error.localizedDescription)")
                self.showAlert(message: "\(error.localizedDescription)")
                
                return
            }
            
            guard let uid = result?.user.uid else { return }
            
            var values = ["email": email,
                          "firstname": firstname,
                          "lastname": lastname,
                          "phonenumber": phone,
                          "accountType": accountTypeIndex] as [String : Any]
            
            if accountTypeIndex == 0 {
                print("Customer")
                self.createStripeCustomer(customers: values) { result in
                    switch result {
                    case .success(let customerId):
                        print("Customer ID: \(customerId)")
                        
                        values["customerid"] = customerId
                        values["id"] = uid
                        values["profilephotourl"] = "Not Set"
                        
                        let databaseRef = Database.database().reference().child("users")
                        
                        let userRef = databaseRef.child(uid)
                        userRef.setValue(values) { (error, ref) in
                            if let error = error {
                                print("Data could not be saved: \(error.localizedDescription)")
                                return
                            } else {
                                print("Initial data saved successfully!")
                                self.handleShowLogin()
                            }
                        }
                    case .failure(let error):
                        print("Error: \(error)")
                        return
                    }
                }
            } else {
                print("Pro")
                
                let alertController = UIAlertController(title: "Consent to a Background Check?", message: "In order to work on Mowie you must pass a background check", preferredStyle: .alert)
                
                let yesAction = UIAlertAction(title: "Yes", style: .default) { _ in
                    // Handle Yes button tap
                    // Register Pro
                    self.showLoadingIndicator()
                    
                    values["id"] = uid
                    values["profilephotourl"] = "Not Set"
                    values["carphotourl"] = "Not Set"
                    values["backgroundcheck"] = "false"
                    values["businessname"] = "Need to Set"
                    values["einnumber"] = "Need to Set"
                    values["needonboard"] = "true"
                    values["rating"] = "0"
                    
                    let databaseRef = Database.database().reference().child("users")
                    
                    let userRef = databaseRef.child(uid)
                    userRef.setValue(values) { (error, ref) in
                        if let error = error {
                            print("Data could not be saved: \(error.localizedDescription)")
                            return
                        } else {
                            print("Initial data saved successfully!")
                            // Request Background Check
                            
                            self.checkBackground(pro: values) { result in
                                switch result {
                                case .success(let check):
                                    //print("Background: \(check)")
                                    self.hideLoadingIndicator()
                                    
                                    DispatchQueue.main.async {
                                        // UI-related code here
                                        let signup = ProSignUpController(values: values)
                                        signup.modalPresentationStyle = .fullScreen
                                        self.present(signup, animated: true, completion: nil)
                                    }
                                    
                                case .failure(let error):
                                    print("Error: \(error)")
                                    return
                                }
                            }
                        }
                    }
                }
                    
                    let noAction = UIAlertAction(title: "No", style: .cancel) { _ in
                        // Handle No button tap
                    }
                    
                    alertController.addAction(yesAction)
                    alertController.addAction(noAction)
                    
                    self.present(alertController, animated: true, completion: nil)
                }
            }
        }
        
        @objc func handleShowLogin() {
            let login = LoginController()
            login.modalPresentationStyle = .fullScreen
            present(login, animated: true, completion: nil)
        }
        
        // MARK: - Helper Functions
        
        // Function to show an alert
        func showAlert(message: String) {
            let alertController = UIAlertController(title: "Alert", message: message, preferredStyle: .alert)
            let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
            alertController.addAction(okAction)
            present(alertController, animated: true, completion: nil)
        }
        
        func setupLoadingIndicator() {
            // Create a UIActivityIndicatorView
            loadingIndicator = UIActivityIndicatorView(style: .large)
            loadingIndicator.color = .gray
            loadingIndicator.center = view.center
            loadingIndicator.hidesWhenStopped = true
            
            // Add the loading indicator to the view
            view.addSubview(loadingIndicator)
        }
        
        func showLoadingIndicator() {
            // Start animating the loading indicator
            loadingIndicator.startAnimating()
        }
        
        func hideLoadingIndicator() {
            // Stop animating and hide the loading indicator
            loadingIndicator.stopAnimating()
        }
        
        func isValidEmail(_ email: String) -> Bool {
            let trimmedEmail = email.trimmingCharacters(in: .whitespaces)
            let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
            let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
            return emailPredicate.evaluate(with: email)
        }
        
        func isValidFirstName(_ firstName: String) -> Bool {
            let trimmedFirstName = firstName.trimmingCharacters(in: .whitespaces)
            let nameRegex = "^[a-zA-Z]{3,}$"
            let namePredicate = NSPredicate(format: "SELF MATCHES %@", nameRegex)
            return namePredicate.evaluate(with: firstName)
        }
        
        func isValidLastName(_ lastName: String) -> Bool {
            let trimmedLastName = lastName.trimmingCharacters(in: .whitespaces)
            let nameRegex = "^[a-zA-Z]{2,}$"
            let namePredicate = NSPredicate(format: "SELF MATCHES %@", nameRegex)
            return namePredicate.evaluate(with: lastName)
        }
        
        func isValidPhoneNumber(_ phoneNumber: String) -> Bool {
            let phoneRegex = #"^\d{10}$"#
            let phonePredicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
            return phonePredicate.evaluate(with: phoneNumber)
        }
        
        func isValidPassword(_ password: String) -> Bool {
            // Add your password validation criteria here
            // For example, requiring at least 8 characters, containing both letters and numbers
            let passwordRegex = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$"
            let passwordPredicate = NSPredicate(format: "SELF MATCHES %@", passwordRegex)
            return passwordPredicate.evaluate(with: password)
        }
        
        func uploadUserDataAndShowHomeController(uid: String, values: [String: Any]) {
            REF_USERS.child(uid).updateChildValues(values, withCompletionBlock: { (error, ref) in
                let tab = LoginController()
                tab.modalPresentationStyle = .fullScreen
                self.present(tab, animated: true, completion: nil)
                self.dismiss(animated: true, completion: nil)
            })
        }
        
        private func setupTextFieldAnimations() {
            // Add focus animations to all text fields
            [emailTextField, firstnameTextField, lastnameTextField, phoneTextField, passwordTextField, confirmPasswordTextField].forEach { textField in
                textField.addTarget(self, action: #selector(textFieldFocusChanged(_:)), for: .editingDidBegin)
                textField.addTarget(self, action: #selector(textFieldFocusChanged(_:)), for: .editingDidEnd)
            }
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
        
        func configureUI() {
            // Apply dark green gradient background
            view.applyDarkGreenGradient()
            
            view.addSubview(titleLabel)
            titleLabel.anchor(top: view.safeAreaLayoutGuide.topAnchor)
            titleLabel.centerX(inView: view)
            
            // Create glass form container
            let formContainer = UIView()
            formContainer.translatesAutoresizingMaskIntoConstraints = false
            formContainer.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.3)
            formContainer.layer.cornerRadius = 16
            formContainer.layer.borderColor = UIColor.glassBorder.cgColor
            formContainer.layer.borderWidth = 1
            
            // Add blur effect
            let blurEffect = UIBlurEffect(style: .dark)
            let blurEffectView = UIVisualEffectView(effect: blurEffect)
            blurEffectView.translatesAutoresizingMaskIntoConstraints = false
            blurEffectView.alpha = 0.8
            blurEffectView.layer.cornerRadius = 16
            blurEffectView.clipsToBounds = true
            formContainer.insertSubview(blurEffectView, at: 0)
            
            view.addSubview(formContainer)
            
            // Configure text fields with clean minimal style
            [emailTextField, firstnameTextField, lastnameTextField, phoneTextField, passwordTextField, confirmPasswordTextField].forEach { textField in
                // Remove all borders and backgrounds
                textField.borderStyle = .none
                textField.backgroundColor = .clear
                textField.layer.borderWidth = 0
                textField.layer.cornerRadius = 0
                
                // Text styling
                textField.textColor = .white
                textField.tintColor = UIColor.primaryGreen
                textField.font = UIFont.systemFont(ofSize: 16)
                textField.keyboardAppearance = .dark
                
                // Left padding only (icon space handled by container)
                textField.leftViewMode = .never
                textField.rightViewMode = .never
            }
            
            let stack = UIStackView(arrangedSubviews: [firstnameContainerView,
                                                       lastnameContainerView,
                                                       emailContainerView,
                                                       phoneContainerView,
                                                       passwordContainerView,
                                                       confirmPasswordContainerView,
                                                       accountTypeContainerView,
                                                       signUpButton])
            stack.axis = .vertical
            stack.distribution = .fillProportionally
            stack.spacing = 16
            
            stack.translatesAutoresizingMaskIntoConstraints = false
            
            formContainer.addSubview(stack)
            
            NSLayoutConstraint.activate([
                // Blur effect constraints
                blurEffectView.topAnchor.constraint(equalTo: formContainer.topAnchor),
                blurEffectView.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor),
                blurEffectView.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor),
                blurEffectView.bottomAnchor.constraint(equalTo: formContainer.bottomAnchor),
                
                // Form container
                formContainer.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 30),
                formContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
                formContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
                
                // Stack inside form with proper padding
                stack.topAnchor.constraint(equalTo: formContainer.topAnchor, constant: 24),
                stack.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor, constant: 24),
                stack.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor, constant: -24),
                stack.bottomAnchor.constraint(equalTo: formContainer.bottomAnchor, constant: -24)
            ])
            
            view.addSubview(alreadyHaveAccountButton)
            alreadyHaveAccountButton.centerX(inView: view)
            alreadyHaveAccountButton.anchor(bottom: view.safeAreaLayoutGuide.bottomAnchor, height: 32)
        }
        
        override func viewDidLayoutSubviews() {
            super.viewDidLayoutSubviews()
            
            // Reapply gradient after layout changes
            view.applyDarkGreenGradient()
            
            // Update button gradient frame
            if let gradientLayer = signUpButton.layer.sublayers?.first(where: { $0 is CAGradientLayer }) as? CAGradientLayer {
                gradientLayer.frame = signUpButton.bounds
            }
        }
    }
