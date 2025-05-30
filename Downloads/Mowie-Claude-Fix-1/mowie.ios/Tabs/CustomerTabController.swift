//
//  CustomerTabController.swift
//  mowie.ios
//
//  Customer tab bar controller - preserves ALL MenuController functionality
//

import UIKit
import Firebase
import FirebaseAuth

class CustomerTabController: UITabBarController {
    
    // MARK: - Properties
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    var user: User? {
        didSet {
            guard let user = user else { return }
            setupTabsWithUser(user)
        }
    }
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Will setup tabs once user is set
        configureTabBarAppearance()
    }
    
    // MARK: - Setup Methods
    
    private func setupTabsWithUser(_ user: User) {
        print("📱 Setting up customer tabs for user: \(user.firstname)")
        
        // Tab 1: Home (existing MainController)
        let mainController = MainController()
        mainController.user = user
        // Remove menu delegate - no longer needed
        let homeVC = UINavigationController(rootViewController: mainController)
        homeVC.tabBarItem = UITabBarItem(title: "Home", image: UIImage(systemName: "house"), tag: 0)
        homeVC.navigationBar.backgroundColor = .clear
        homeVC.navigationBar.isTranslucent = true
        homeVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        // Tab 2: Profile (existing ProfilePageController)
        let profileController = ProfilePageController(user: user)
        let profileVC = UINavigationController(rootViewController: profileController)
        profileVC.tabBarItem = UITabBarItem(title: "Profile", image: UIImage(systemName: "person.circle"), tag: 1)
        profileVC.navigationBar.backgroundColor = .clear
        profileVC.navigationBar.isTranslucent = true
        profileVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        // Tab 3: Help (existing HelpPageController)
        let helpController = HelpPageController()
        let helpVC = UINavigationController(rootViewController: helpController)
        helpVC.tabBarItem = UITabBarItem(title: "Help", image: UIImage(systemName: "questionmark.circle"), tag: 2)
        helpVC.navigationBar.backgroundColor = .clear
        helpVC.navigationBar.isTranslucent = true
        helpVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        // Tab 4: More (new controller for About/Promo/Logout)
        let moreController = MoreController(user: user)
        moreController.delegate = self // For logout handling
        let moreVC = UINavigationController(rootViewController: moreController)
        moreVC.tabBarItem = UITabBarItem(title: "More", image: UIImage(systemName: "ellipsis.circle"), tag: 3)
        moreVC.navigationBar.backgroundColor = .clear
        moreVC.navigationBar.isTranslucent = true
        moreVC.navigationBar.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        // Set view controllers
        viewControllers = [homeVC, profileVC, helpVC, moreVC]
        
        print("✅ Customer tabs setup complete")
    }
    
    private func configureTabBarAppearance() {
        // Apply glass effect to tab bar (same as pro version)
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
            
            // Selected item color with glow (using existing color system)
            tabBar.tintColor = UIColor.accentGreen
            tabBar.unselectedItemTintColor = UIColor(white: 1.0, alpha: 0.5)
            
            // Add shadow
            tabBar.layer.shadowColor = UIColor.black.cgColor
            tabBar.layer.shadowOpacity = 0.3
            tabBar.layer.shadowOffset = CGSize(width: 0, height: -2)
            tabBar.layer.shadowRadius = 4
            
            // Configure item appearance
            let tabBarItemAttributes = [NSAttributedString.Key.font: UIFont.systemFont(ofSize: 11, weight: .medium)]
            UITabBarItem.appearance().setTitleTextAttributes(tabBarItemAttributes, for: .normal)
        }
    }
}

// MARK: - MoreControllerDelegate

extension CustomerTabController: MoreControllerDelegate {
    func didSelectLogout() {
        // Preserve EXACT same logout behavior as original menu
        let alert = UIAlertController(title: nil, message: "Are you sure you want to logout?", preferredStyle: .actionSheet)
        
        alert.addAction(UIAlertAction(title: "Log Out", style: .destructive, handler: { _ in
            self.signOut()
        }))
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        
        present(alert, animated: true, completion: nil)
    }
    
    private func signOut() {
        do {
            try Auth.auth().signOut()
            DispatchQueue.main.async {
                let nav = UINavigationController(rootViewController: LoginController())
                if #available(iOS 13.0, *) {
                    nav.isModalInPresentation = true
                }
                nav.modalPresentationStyle = .fullScreen
                self.present(nav, animated: true, completion: nil)
            }
        } catch {
            print("DEBUG: Error signing out")
        }
    }
}