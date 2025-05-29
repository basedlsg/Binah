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
    let hasAcceptedTerms = UserDefaults.standard.bool(forKey: "HasAcceptedTerms")
    
    var pro: Pro?
    
    var user: User? {
        didSet {
            if user?.accountType == .customer {
                print("Customer")
                // Check if the user has accepted the terms
                let customerview = ContainerController()
                customerview.modalPresentationStyle = .fullScreen
                self.present(customerview, animated: true, completion: nil)
            }
            else if user?.accountType == .pro {
                print("Pro")
                guard let uid = Auth.auth().currentUser?.uid else { return }
                
                Service.shared.fetchPro(uid: uid) { pro in self.pro = pro
                    print("Pro: \(pro)")
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
        }
    }
    
    private let homeTableView = UITableView()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
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
        guard let currentUid = Auth.auth().currentUser?.uid else { return }
        
        Service.shared.fetchUserData(uid: currentUid) { user in
            self.user = user
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
}
