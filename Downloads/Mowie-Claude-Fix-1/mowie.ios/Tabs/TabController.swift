//
//  TabController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/13/23.
//

import UIKit
import Firebase
import FirebaseAuth

class TabController: UITabBarController, UITabBarControllerDelegate {
    // MARK: - Properties
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    private var loadingIndicator: UIActivityIndicatorView!
    private var loadingView: UIView!
    private var errorView: UIView!
    private var loadingLabel: UILabel!
    private var errorLabel: UILabel!
    private var retryButton: UIButton!
    
    let hasAcceptedTerms = UserDefaults.standard.bool(forKey: "HasAcceptedTerms")
    
    var pro: Pro?
    
    var user: User? {
        didSet {
            // Hide loading UI when user data is received
            DispatchQueue.main.async {
                self.hideLoadingState()
            }
            
            guard let user = user else {
                // Handle nil user gracefully
                print("⚠️ User is nil - showing error state")
                DispatchQueue.main.async {
                    self.showErrorState(message: "Unable to load user data. Please check your connection.")
                }
                return
            }
            
            if user.accountType == .customer {
                print("Customer user type")
                DispatchQueue.main.async {
                    // Check if the user has accepted the terms
                    let customerview = ContainerController()
                    customerview.modalPresentationStyle = .fullScreen
                    self.present(customerview, animated: true, completion: nil)
                }
            }
            else if user.accountType == .pro {
                print("Pro user type")
                guard let uid = Auth.auth().currentUser?.uid else { 
                    DispatchQueue.main.async {
                        self.showErrorState(message: "Authentication error. Please try logging in again.")
                    }
                    return 
                }
                
                Service.shared.fetchPro(uid: uid) { [weak self] pro in
                    guard let self = self else { return }
                    self.pro = pro
                    print("Pro: \(pro)")
                    
                    DispatchQueue.main.async {
                        if pro.businessName == "Need to Set" || pro.einNumber == "Need to Set" {
                            print("Business Info")
                            self.showPopUp()
                        }
                        if pro.backgroundCheck != "true" {
                            print("Background")
                            let warningString = "Need to pass criminal backgroung check to be a pro on Mowie. Check your email to submit your test!"
                            let warningViewController = DoNotPassController(warningString: warningString)
                            let navigationController = UINavigationController(rootViewController: warningViewController)
                            navigationController.modalPresentationStyle = .fullScreen
                            self.present(navigationController, animated: true, completion: nil)
                        }
                        if pro.needOnboard != "false" {
                            print("Onboard")
                            let onBoardController = OnboardController(pro: pro)
                            onBoardController.modalPresentationStyle = .fullScreen
                            self.present(onBoardController, animated: true, completion: nil)
                        }
                        self.setupTabs()
                    }
                }
            } else {
                // Unknown account type - default to customer
                print("⚠️ Unknown account type, defaulting to customer")
                DispatchQueue.main.async {
                    let customerview = ContainerController()
                    customerview.modalPresentationStyle = .fullScreen
                    self.present(customerview, animated: true, completion: nil)
                }
            }
        }
    }
    
    private let homeTableView = UITableView()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Setup UI states
        setupLoadingState()
        setupErrorState()
        
        if UserDefaults.standard.object(forKey: "HasAcceptedTerms") == nil {
            // The key "HasAcceptedTerms" does not exist in UserDefaults
            UserDefaults.standard.set(false, forKey: "HasAcceptedTerms")
        }

        if hasAcceptedTerms == false {
            // User has not accepted the Terms, show the Terms and Conditions screen
            showTermsAndConditions()
        }
        // User has already accepted the Terms, proceed to the main content
        checkIfUserIsLoggedIn()
        
        //signOut()
    }
    
    func fetchUserData() {
        guard let currentUid = Auth.auth().currentUser?.uid else { 
            showErrorState(message: "No authenticated user found. Please log in again.")
            return 
        }
        
        // Show loading state
        showLoadingState()
        
        Service.shared.fetchUserData(uid: currentUid) { [weak self] user in
            DispatchQueue.main.async {
                self?.user = user
            }
        }
    }
    
    func checkIfUserIsLoggedIn() {
        if Auth.auth().currentUser?.uid == nil {
            DispatchQueue.main.async {
                let nav = UINavigationController(rootViewController: LoginController())
                if #available(iOS 13.0, *) {
                    nav.isModalInPresentation = true
                }
                nav.modalPresentationStyle = .fullScreen
                self.present(nav, animated: true, completion: nil)
            }
        } else {
            fetchUserData()
        }
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
    
    // MARK: - Tab Setup
    func setupTabs() {
        let proOb: Pro? = pro
        
        // Configure tab bar appearance
        configureTabBarAppearance()
                    
        // Tab Bar Controller        
        let proHomeVC = ProHomeController()
                let homeVC = UINavigationController(rootViewController: proHomeVC)
            homeVC.tabBarItem = UITabBarItem(title: "HOME", image: UIImage(systemName: "house"), tag: 0)
            homeVC.navigationBar.backgroundColor = .clear
            homeVC.navigationBar.isTranslucent = true
            homeVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        let proEarningVC = EarningsController(pro: proOb!)
            let earningVC = UINavigationController(rootViewController: proEarningVC)
        earningVC.view.backgroundColor = .white
        earningVC.tabBarItem = UITabBarItem(title: "EARNINGS", image: UIImage(systemName: "chart.bar.fill"), tag: 1)
        earningVC.navigationBar.backgroundColor = .clear
        earningVC.navigationBar.isTranslucent = true
        earningVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        let proJobListVC = JobListController()
            let jobListVC = UINavigationController(rootViewController: proJobListVC)
        jobListVC.view.backgroundColor = .white
        jobListVC.tabBarItem = UITabBarItem(title: "JOB LIST", image: UIImage(systemName: "list.bullet"), tag: 2)
        jobListVC.navigationBar.backgroundColor = .clear
        jobListVC.navigationBar.isTranslucent = true
        jobListVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]

        let proRatingVC = RatingController()
            let ratingVC = UINavigationController(rootViewController: proRatingVC)
        ratingVC.view.backgroundColor = .white
        ratingVC.tabBarItem = UITabBarItem(title: "RATING", image: UIImage(systemName: "star.fill"), tag: 3)
        ratingVC.navigationBar.backgroundColor = .clear
        ratingVC.navigationBar.isTranslucent = true
        ratingVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        let proAccountVC = AccountController(pro: proOb!)
            let accountVC = UINavigationController(rootViewController: proAccountVC)
        accountVC.view.backgroundColor = .white
        accountVC.tabBarItem = UITabBarItem(title: "ACCOUNT", image: UIImage(systemName: "person.fill"), tag: 4)
        accountVC.navigationBar.backgroundColor = .clear
        accountVC.navigationBar.isTranslucent = true
        accountVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]

        viewControllers = [homeVC, earningVC, jobListVC, ratingVC, accountVC]

        // Set the delegate to self
        self.delegate = self
    }
    
    // MARK: - Selectors
    
    // MARK: - Helper func
    
    func showTermsAndConditions() {
            // Present your Terms and Conditions screen (e.g., push a new TermsViewController)
        DispatchQueue.main.async {
            let customerview = TermsAndConditionsController()
            customerview.modalPresentationStyle = .fullScreen
            self.present(customerview, animated: true, completion: nil)
        }
    }
    
    func showPopUp() {
            let popUp = UIAlertController(title: "Enter Business Information", message: nil, preferredStyle: .alert)

            popUp.addTextField { (textField) in
                textField.placeholder = "Business Name"
            }

            popUp.addTextField { (textField) in
                textField.placeholder = "EIN Number"
                textField.keyboardType = .numberPad
            }

            let submitAction = UIAlertAction(title: "Submit", style: .default) { (action) in
                guard let businessName = popUp.textFields?[0].text, let einNumber = popUp.textFields?[1].text else {
                    return
                }
                //self.showLoadingIndicator()
                // Call function to update Firebase node
                self.updateNodeWithBusinessInfo(businessName: businessName, einNumber: einNumber)
                
                
                // Perform sign-up logic here
                self.createConnect(pro: self.pro!) { result in
                    switch result {
                        case .success(let onboard):
                            print("On Board: \(onboard)")
                        
                            guard let connectid = onboard as? String else {
                                print("Could not extract connectid from onboard.")
                                return
                            }
                            
                            guard let uid = Auth.auth().currentUser?.uid else { return }
                        
                            let databaseRef = Database.database().reference().child("users")
                        
                            let userRef = databaseRef.child(uid).child("connectid")
                        
                            userRef.setValue(connectid) { (error, ref) in
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
                            }
                        
                            //self.hideLoadingIndicator()
                            DispatchQueue.main.async {
                                let login = LoginController()
                                login.modalPresentationStyle = .fullScreen
                                self.present(login, animated: true, completion: nil)
                            }

                        case .failure(_):
                            print("Error:")
                            //self.hideLoadingIndicator()
                            return
                        }
                }
            }

            popUp.addAction(submitAction)
            popUp.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))

            present(popUp, animated: true, completion: nil)
        }

        func updateNodeWithBusinessInfo(businessName: String, einNumber: String) {
            // Reference to the Firebase Realtime Database
            let databaseRef = Database.database().reference()
            
            guard let currentUid = Auth.auth().currentUser?.uid else { return }
            
            print("Business Name: \(businessName)")
            print("EIN Number: \(einNumber)")
            
            // Update the node with businessName and einNumber
            let updateData: [String: Any] = ["businessname": businessName, "einnumber": einNumber]
            databaseRef.child("users").child(currentUid).updateChildValues(updateData) { (error, _) in
                if let error = error {
                    print("Error updating node: \(error.localizedDescription)")
                } else {
                    print("Node updated successfully")
                    
                }
            }
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
    
    func createConnect(pro: Pro, completion: @escaping (Result<String, Error>) -> Void) {
        // URL for the API endpoint
        let urlString = "https://mowie-service-server.onrender.com/v1/accounts"
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        let email = pro.email
        let proid = pro.id
        
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
    
    func configureTabBarAppearance() {
        // Apply glass effect to tab bar
        if let tabBar = self.tabBar as? UITabBar {
            // Make tab bar transparent
            tabBar.isTranslucent = true
            tabBar.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.6)
            tabBar.backgroundImage = UIImage()
            tabBar.shadowImage = UIImage()
            
            // Add blur effect
            let blurEffect = UIBlurEffect(style: .dark)
            let blurEffectView = UIVisualEffectView(effect: blurEffect)
            blurEffectView.frame = tabBar.bounds
            blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            blurEffectView.alpha = 0.9
            
            // Insert blur view
            tabBar.insertSubview(blurEffectView, at: 0)
            
            // Selected item color with glow
            tabBar.tintColor = UIColor.primaryGreen
            tabBar.unselectedItemTintColor = UIColor(white: 1.0, alpha: 0.5)
            
            // Add shadow
            tabBar.layer.shadowColor = UIColor.black.cgColor
            tabBar.layer.shadowOpacity = 0.3
            tabBar.layer.shadowOffset = CGSize(width: 0, height: -2)
            tabBar.layer.shadowRadius = 4
            
            // Configure item appearance
            let tabBarItemAttributes = [NSAttributedString.Key.font: UIFont.systemFont(ofSize: 11, weight: .medium)]
            UITabBarItem.appearance().setTitleTextAttributes(tabBarItemAttributes, for: .normal)
            
            // Add selection indicator animation
            addSelectionIndicator()
        }
    }
    
    private func addSelectionIndicator() {
        // Create a green glow layer for selected items
        let selectionIndicator = CALayer()
        selectionIndicator.backgroundColor = UIColor.primaryGreen.cgColor
        selectionIndicator.frame = CGRect(x: 0, y: 0, width: 60, height: 2)
        selectionIndicator.cornerRadius = 1
        
        // Add glow effect
        selectionIndicator.shadowColor = UIColor.primaryGreen.cgColor
        selectionIndicator.shadowOffset = CGSize(width: 0, height: 0)
        selectionIndicator.shadowRadius = 4
        selectionIndicator.shadowOpacity = 0.8
        
        tabBar.layer.addSublayer(selectionIndicator)
    }

    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        if let selectedTabIndex = tabBarController.viewControllers?.firstIndex(of: viewController) {
            if selectedTabIndex == 0 {
                print("HOME tab was selected!")
            }
            else if selectedTabIndex == 1 {
                print("EARNINGS tab was selected!")
            }
            else if selectedTabIndex == 2 {
                print("JOB LIST tab was selected!")
            }
            else if selectedTabIndex == 3 {
                print("RATING tab was selected!")
                let alertController = UIAlertController(
                            title: "Rating",
                            message: "Feature Coming Soon!",
                            preferredStyle: .alert
                        )

                        let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
                        alertController.addAction(okAction)

                self.present(alertController, animated: true, completion: nil)
            }
            else if selectedTabIndex == 4 {
                print("ACCOUNT tab was selected!")
            }
        }
    }
    
    // MARK: - Loading and Error State Management
    
    private func setupLoadingState() {
        // Create loading view
        loadingView = UIView()
        loadingView.backgroundColor = UIColor.primaryDark
        loadingView.translatesAutoresizingMaskIntoConstraints = false
        loadingView.isHidden = true
        view.addSubview(loadingView)
        
        // Create loading indicator
        loadingIndicator = UIActivityIndicatorView(style: .large)
        loadingIndicator.color = UIColor.accentGreen
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        loadingView.addSubview(loadingIndicator)
        
        // Create loading label
        loadingLabel = UILabel()
        loadingLabel.text = "Loading your data..."
        loadingLabel.textColor = .white
        loadingLabel.font = .systemFont(ofSize: 16)
        loadingLabel.textAlignment = .center
        loadingLabel.translatesAutoresizingMaskIntoConstraints = false
        loadingView.addSubview(loadingLabel)
        
        NSLayoutConstraint.activate([
            loadingView.topAnchor.constraint(equalTo: view.topAnchor),
            loadingView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            loadingView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            loadingView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            loadingIndicator.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: loadingView.centerYAnchor, constant: -20),
            
            loadingLabel.topAnchor.constraint(equalTo: loadingIndicator.bottomAnchor, constant: 16),
            loadingLabel.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor)
        ])
    }
    
    private func setupErrorState() {
        // Create error view
        errorView = UIView()
        errorView.backgroundColor = UIColor.primaryDark
        errorView.translatesAutoresizingMaskIntoConstraints = false
        errorView.isHidden = true
        view.addSubview(errorView)
        
        // Create error label
        errorLabel = UILabel()
        errorLabel.text = "Something went wrong"
        errorLabel.textColor = .white
        errorLabel.font = .systemFont(ofSize: 18, weight: .medium)
        errorLabel.textAlignment = .center
        errorLabel.numberOfLines = 0
        errorLabel.translatesAutoresizingMaskIntoConstraints = false
        errorView.addSubview(errorLabel)
        
        // Create retry button
        retryButton = UIButton(type: .system)
        retryButton.setTitle("Retry", for: .normal)
        retryButton.setTitleColor(.white, for: .normal)
        retryButton.backgroundColor = UIColor.accentGreen
        retryButton.layer.cornerRadius = 8
        retryButton.titleLabel?.font = .boldSystemFont(ofSize: 16)
        retryButton.translatesAutoresizingMaskIntoConstraints = false
        retryButton.addTarget(self, action: #selector(retryButtonTapped), for: .touchUpInside)
        
        // Add performance-aware press animation
        retryButton.addPerformanceAwarePressAnimation()
        
        errorView.addSubview(retryButton)
        
        NSLayoutConstraint.activate([
            errorView.topAnchor.constraint(equalTo: view.topAnchor),
            errorView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            errorView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            errorView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            errorLabel.centerXAnchor.constraint(equalTo: errorView.centerXAnchor),
            errorLabel.centerYAnchor.constraint(equalTo: errorView.centerYAnchor, constant: -30),
            errorLabel.leadingAnchor.constraint(equalTo: errorView.leadingAnchor, constant: 20),
            errorLabel.trailingAnchor.constraint(equalTo: errorView.trailingAnchor, constant: -20),
            
            retryButton.topAnchor.constraint(equalTo: errorLabel.bottomAnchor, constant: 24),
            retryButton.centerXAnchor.constraint(equalTo: errorView.centerXAnchor),
            retryButton.widthAnchor.constraint(equalToConstant: 120),
            retryButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    private func showLoadingState() {
        loadingView.isHidden = false
        errorView.isHidden = true
        loadingIndicator.startAnimating()
        loadingLabel.text = "Loading your data..."
        print("📱 Showing loading state")
    }
    
    private func hideLoadingState() {
        loadingView.isHidden = true
        loadingIndicator.stopAnimating()
        print("📱 Hiding loading state")
    }
    
    private func showErrorState(message: String) {
        errorView.isHidden = false
        loadingView.isHidden = true
        loadingIndicator.stopAnimating()
        errorLabel.text = message
        print("📱 Showing error state: \(message)")
    }
    
    @objc private func retryButtonTapped() {
        print("📱 Retry button tapped")
        hideErrorState()
        fetchUserData()
    }
    
    private func hideErrorState() {
        errorView.isHidden = true
        print("📱 Hiding error state")
    }
}
