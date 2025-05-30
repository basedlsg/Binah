//
//  ContainerController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/20/23.
//

import Foundation
import UIKit
import FirebaseAuth

class ContainerController: UIViewController {

    // MARK: - Properties
    
    // Flag to switch between old menu and new tab system
    private let useTabBarInterface = true // Set to true to use new tabs, false for old menu
    
    private let mainController = MainController()
    private var menuController: MenuController!
    private var customerTabController: CustomerTabController!
    private var addJobController: AddJobController?
    private var isExpanded = false
    private let blackView = UIView()
    private lazy var xOrigin = self.view.frame.width - 80
    
    let headerView = UIView()
    
    var user: User? {
        didSet {
            guard let user = user else { return }
            
            if useTabBarInterface {
                configureTabInterface(withUser: user)
            } else {
                // Original menu system
                mainController.user = user
                configureMenuController(withUser: user)
            }
        }
    }
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        configure()
    }
    
    override var prefersStatusBarHidden: Bool {
        return isExpanded
    }
    
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
        return .slide
    }
    
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    // MARK: - Selectors
    
    @objc func dismissMenu() {
        isExpanded = false
        animateMenu(shouldExpand: isExpanded)
    }
    
    // MARK: - API
    
    func fetchUserData() {
        guard let currentUid = Auth.auth().currentUser?.uid else { return }
        Service.shared.fetchUserData(uid: currentUid) { user in self.user = user
        }
    }
    
    func signOut() {
        do {
            try Auth.auth().signOut()
            DispatchQueue.main.async {
                let nav = UINavigationController(rootViewController: LoginController())
                self.present(nav, animated: true, completion: nil)
            }
        } catch {
            print("DEBUG: Error signing out")
        }
    }
    
    // MARK: - Helper Functions
    
    func configure() {
        view.backgroundColor = .clear
        
        if useTabBarInterface {
            // Tab interface will be configured when user is set
            fetchUserData()
        } else {
            // Original menu system
            configureMainController()
            fetchUserData()
        }
    }
    
    func configureMainController() {
        addChild(mainController)
        mainController.didMove(toParent: self)
        view.addSubview(mainController.view)
        mainController.delegate = self
    }
    
    func configureMenuController(withUser user: User) {
        print("Menu with user")
        menuController = MenuController(user: user)
        addChild(menuController)
        menuController.didMove(toParent: self)
        menuController.view.frame = CGRect(x: 0, y: 40, width: self.view.frame.width, height: self.view.frame.height - 40)
        menuController.view.isHidden = true
        view.insertSubview(menuController.view, at: 0)
        menuController.delegate = self
        configureBlackView()
    }
    
    func configureTabInterface(withUser user: User) {
        print("📱 Configuring tab interface for customer user")
        
        // Create and configure CustomerTabController
        customerTabController = CustomerTabController()
        customerTabController.user = user
        
        // Add as child view controller
        addChild(customerTabController)
        customerTabController.didMove(toParent: self)
        view.addSubview(customerTabController.view)
        
        // Make tab controller fill the entire view
        customerTabController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            customerTabController.view.topAnchor.constraint(equalTo: view.topAnchor),
            customerTabController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            customerTabController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            customerTabController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        print("✅ Tab interface configured successfully")
    }
    
    func configureBlackView() {
        self.blackView.frame = CGRect(x: xOrigin, y: 0, width: 80, height: self.view.frame.height)
        //blackView.frame = self.view.bounds
        blackView.backgroundColor = UIColor(white: 0, alpha: 0.5)
        blackView.alpha = 0
        view.addSubview(blackView)
        
        let tap = UITapGestureRecognizer(target: self, action: #selector(dismissMenu))
        blackView.addGestureRecognizer(tap)
    }
    
    func animateMenu(shouldExpand: Bool, completion: ((Bool) -> Void)? = nil) {
        if shouldExpand {
            UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut, animations: {
                self.mainController.view.frame.origin.x = self.xOrigin
                self.blackView.alpha = 1
            }, completion: nil)
            menuController.view.isHidden = false
        } else {
            self.blackView.alpha = 0
            UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut, animations: {
                self.mainController.view.frame.origin.x = 0
            }, completion: completion)
            menuController.view.isHidden = true
        }
        animateStatusBar()
    }
    
    func animateStatusBar() {
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut, animations: {
            self.setNeedsStatusBarAppearanceUpdate()
        }, completion: nil)
    }
}

// MARK: - SettingsControllerDelegate

extension ContainerController: SettingsControllerDelegate {
    func updateUser(_ controller: SettingsController) {
        self.user = controller.user
    }
}

// MARK: - MainControllerDelegate

extension ContainerController: MainControllerDelegate {
    func handleMenuToggle() {
        isExpanded.toggle()
        animateMenu(shouldExpand: isExpanded)
    }
}

// MARK: - MenuControllerDelegate

extension ContainerController: MenuControllerDelegate {
    func didSelect(option: MenuOptions) {
        isExpanded.toggle()
        animateMenu(shouldExpand: isExpanded) { [self] _ in
            switch option {
            case .profile:
                guard let user = self.user else { return }
                
                let controller = ProfilePageController(user: user)
                
                let nav = UINavigationController(rootViewController: controller)
                self.present(nav, animated: true, completion: nil)
            //case .payments:
                
              //  let url = "https://billing.stripe.com/p/login/9AQ03x3Ao4T82CQ8ww"
                //let payment = UINavigationController(rootViewController: ApiController(url: url))
                //payment.modalPresentationStyle = .fullScreen
                //self.present(payment, animated: true, completion: nil)
                
                // Find the top-most visible view controller
                /*if var topController = UIApplication.shared.keyWindow?.rootViewController {
                    while let presentedViewController = topController.presentedViewController {
                        topController = presentedViewController
                    }
                    // Present ApiController from the top-most visible view controller
                    topController.present(payment, animated: true, completion: nil)
                }*/
                
            /*case .addjob:
                var size = "not selected"
                addJobController?.delegate = self
                let actionSheet = UIAlertController(title: "How Big is your Property", message: nil, preferredStyle: .actionSheet)
                
                // Add actions to the action sheet
                let option1Action = UIAlertAction(title: "6k - 10 SQ FT", style: .default) { _ in
                    print("Option 1 selected")
                    size = "large"
                    let controller = AddJobController(user: self.user!, size: size)
                    
                    let nav = UINavigationController(rootViewController: controller)
                    self.present(nav, animated: true, completion: nil)
                }
                actionSheet.addAction(option1Action)

                let option2Action = UIAlertAction(title: "4k - 6k SQ FT", style: .default) { _ in
                    print("Option 2 selected")
                    size = "medium"
                    let controller = AddJobController(user: self.user!, size: size)
                    
                    let nav = UINavigationController(rootViewController: controller)
                    self.present(nav, animated: true, completion: nil)
                }
                actionSheet.addAction(option2Action)
                
                let option3Action = UIAlertAction(title: "0 - 4k SQ FT", style: .default) { _ in
                    print("Option 3 selected")
                    size = "standard"
                    let controller = AddJobController(user: self.user!, size: size)
                    
                    let nav = UINavigationController(rootViewController: controller)
                    self.present(nav, animated: true, completion: nil)
                }
                actionSheet.addAction(option3Action)

                let cancelAction = UIAlertAction(title: "Cancel", style: .cancel) { _ in
                    print("Cancel selected")
                    // Add your logic for cancel action if needed
                }
                actionSheet.addAction(cancelAction)

                // For iPad, specify the source view and rect for popover presentation
                if let popoverController = actionSheet.popoverPresentationController {
                    popoverController.sourceView = self.view
                    popoverController.sourceRect = CGRect(x: self.view.bounds.midX, y: self.view.bounds.midY, width: 0, height: 0)
                    popoverController.permittedArrowDirections = []
                }

                // Present the action sheet
                present(actionSheet, animated: true, completion: nil)*/
                
                
            case .promo:
                let alertController = UIAlertController(
                            title: "Promotions",
                            message: "There are no promotions at this time. Try again later.",
                            preferredStyle: .alert
                        )

                        let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
                        alertController.addAction(okAction)

                self.present(alertController, animated: true, completion: nil)
            case .helptab:
                let controller = HelpPageController()
                
                let nav = UINavigationController(rootViewController: controller)
                self.present(nav, animated: true, completion: nil)
            case .about:
                let controller = AboutUsController()
                
                let nav = UINavigationController(rootViewController: controller)
                self.present(nav, animated: true, completion: nil)
            /*case .settingstab:
                guard let user = self.user else { return }
                
                let controller = SettingsController(user: user)
                controller.delegate = self
                
                let nav = UINavigationController(rootViewController: controller)
                self.present(nav, animated: true, completion: nil)*/ 
            case .logout:
                let alert = UIAlertController(title: nil, message: "Are you sure you want to logout?", preferredStyle: .actionSheet)
                alert.addAction(UIAlertAction(title: "Log Out", style: .destructive, handler: { _ in self.signOut()
                    
                    let nav = UINavigationController(rootViewController: LoginController())
                    if #available(iOS 13.0, *) {
                        nav.isModalInPresentation = true
                    }
                    nav.modalPresentationStyle = .fullScreen
                    self.present(nav, animated: true, completion: nil)
                } ))
                alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
                
                self.present(alert, animated: true, completion: nil)
                
            }
        }
    }
}

extension ContainerController: AddJobDelegate {
    func didAddJob() {
        let main = MainController()
        main.modalPresentationStyle = .fullScreen
        present(main, animated: true, completion: nil)
        }
}
