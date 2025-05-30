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
        // Apply premium glass effect to tab bar
        if let tabBar = self.tabBar as? UITabBar {
            // Make tab bar transparent for glass effect
            tabBar.isTranslucent = true
            tabBar.backgroundColor = .clear
            tabBar.backgroundImage = UIImage()
            tabBar.shadowImage = UIImage()
            
            // Create glass container view
            let glassContainer = UIView()
            glassContainer.frame = tabBar.bounds
            glassContainer.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            
            // Add premium blur effect
            let blurEffect = UIBlurEffect(style: .dark)
            let blurEffectView = UIVisualEffectView(effect: blurEffect)
            blurEffectView.frame = glassContainer.bounds
            blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            blurEffectView.alpha = 0.95
            
            // Add subtle gradient overlay
            let gradientLayer = CAGradientLayer()
            gradientLayer.colors = [
                UIColor.primaryDark.withAlphaComponent(0.3).cgColor,
                UIColor.gradientMid.withAlphaComponent(0.2).cgColor
            ]
            gradientLayer.locations = [0.0, 1.0]
            gradientLayer.startPoint = CGPoint(x: 0.5, y: 0)
            gradientLayer.endPoint = CGPoint(x: 0.5, y: 1)
            gradientLayer.frame = glassContainer.bounds
            
            // Add glass border
            let borderLayer = CALayer()
            borderLayer.frame = CGRect(x: 0, y: 0, width: glassContainer.bounds.width, height: 0.5)
            borderLayer.backgroundColor = UIColor.glassBorder.cgColor
            
            // Assemble glass layers
            glassContainer.layer.addSublayer(gradientLayer)
            glassContainer.addSubview(blurEffectView)
            glassContainer.layer.addSublayer(borderLayer)
            
            // Insert glass container
            tabBar.insertSubview(glassContainer, at: 0)
            
            // Enhanced selected item styling
            tabBar.tintColor = UIColor.accentGreen
            tabBar.unselectedItemTintColor = UIColor(white: 1.0, alpha: 0.6)
            
            // Premium shadow with green glow
            tabBar.layer.shadowColor = UIColor.accentGreen.cgColor
            tabBar.layer.shadowOpacity = 0.15
            tabBar.layer.shadowOffset = CGSize(width: 0, height: -2)
            tabBar.layer.shadowRadius = 8
            
            // Configure item appearance with custom fonts
            let normalAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 11, weight: .medium),
                .foregroundColor: UIColor(white: 1.0, alpha: 0.6)
            ]
            let selectedAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 11, weight: .semibold),
                .foregroundColor: UIColor.accentGreen
            ]
            
            UITabBarItem.appearance().setTitleTextAttributes(normalAttributes, for: .normal)
            UITabBarItem.appearance().setTitleTextAttributes(selectedAttributes, for: .selected)
            
            // Add selection indicator animation
            addSelectionIndicator()
        }
    }
    
    private var selectionIndicatorLayer: CALayer?
    
    private func addSelectionIndicator() {
        // Create animated selection indicator
        let indicator = CALayer()
        indicator.backgroundColor = UIColor.accentGreen.cgColor
        indicator.frame = CGRect(x: 0, y: 0, width: 50, height: 2)
        indicator.cornerRadius = 1
        
        // Add glow effect
        indicator.shadowColor = UIColor.accentGreen.cgColor
        indicator.shadowOffset = CGSize(width: 0, height: 0)
        indicator.shadowRadius = 6
        indicator.shadowOpacity = 0.8
        
        tabBar.layer.addSublayer(indicator)
        selectionIndicatorLayer = indicator
        
        // Position indicator under first tab
        updateSelectionIndicator(selectedIndex: 0)
    }
    
    private func updateSelectionIndicator(selectedIndex: Int) {
        guard let indicator = selectionIndicatorLayer else { return }
        
        let tabWidth = tabBar.frame.width / CGFloat(tabBar.items?.count ?? 1)
        let newX = (tabWidth * CGFloat(selectedIndex)) + (tabWidth / 2) - 25
        
        // Animate indicator movement
        CATransaction.begin()
        CATransaction.setAnimationDuration(0.3)
        CATransaction.setAnimationTimingFunction(CAMediaTimingFunction(name: .easeInEaseOut))
        indicator.frame.origin.x = newX
        CATransaction.commit()
    }
    
    override func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        // Update selection indicator position
        if let index = tabBar.items?.firstIndex(of: item) {
            updateSelectionIndicator(selectedIndex: index)
            
            // Add haptic feedback
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.prepare()
            generator.impactOccurred()
            
            // Add subtle scale animation to selected icon
            animateTabSelection(at: index)
        }
    }
    
    private func animateTabSelection(at index: Int) {
        guard let tabBarItems = tabBar.items else { return }
        
        // Get the view for the selected tab
        let tabBarButtons = tabBar.subviews.filter { String(describing: type(of: $0)).contains("Button") }
        guard index < tabBarButtons.count else { return }
        
        let selectedButton = tabBarButtons[index]
        
        // Perform scale animation
        UIView.animate(withDuration: 0.15, delay: 0, options: [.curveEaseOut, .allowUserInteraction], animations: {
            selectedButton.transform = CGAffineTransform(scaleX: 1.1, y: 1.1)
        }) { _ in
            UIView.animate(withDuration: 0.15, delay: 0, options: [.curveEaseIn, .allowUserInteraction], animations: {
                selectedButton.transform = .identity
            })
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