//
//  MainController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 11/24/23.
//

import Foundation
import UIKit
import Firebase
import CoreLocation

import UIKit
import Firebase
import FirebaseAuth

// FOR TABLE
private let reuseIdentifier = "JobCardCell"

protocol MainControllerDelegate: class {
    func handleMenuToggle()
}

class MainController: UIViewController {
    
    
    // MARK: - Properties
    
    var data: [Job] = []
    
    var addJobController: AddJobController?
    
    private let searchContainer = UIView()
    private let newJobButton = UIButton(type: .system)
    
    //private let locationManager = CLLocationManager()
    
    //private let inputActivationView = LocationInputActivationView()
    //private let locationInputView = LocationInputView()
    
    //private let newJobView = NewJobView()
    
    let eligibleCities: [String] = ["detroit", "eastpointe", "harper woods", "roseville", "warren", "hazel park", "oak park", "ferndale", "southfield", "ecorse", "river rouge", "redford", "inkster", "dearborn", "hamtramick", "highland park", "sterling heights", "madison heights", "clinton township", "troy"]
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    private lazy var newJobView: NewJobView = {
        let view = NewJobView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()
    
    var user: User? {
        didSet {
            //locationInputView.user = user
        }
    }
    
    private let titleView: UILabel = {
        let label = UILabel()
        label.text = "Mowie"
        label.textAlignment = .center
        label.font = UIFont(name: "Avenir-Light", size:36)
        label.textColor = UIColor(white: 1, alpha: 0.8)
        
        return label
    }()
    
    // Nav Bar
    let navigationBar = UINavigationBar()
    
    // For Table
    private let tableView = UITableView()
    private final let locationInputViewHeight: CGFloat = 200
    
    weak var delegate: MainControllerDelegate?
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("In Main")
        configure()
        
        // Apply animated gradient background
        let animatedBackground = AnimatedGradientBackground(frame: view.bounds)
        animatedBackground.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.insertSubview(animatedBackground, at: 0)
        
        fetchFirebaseData()
        
        //enableLocationServices()
        
        //signOut()
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        
        // Reapply gradient after layout changes
        view.applyDarkGreenGradient()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        // Animate view elements with spring
        UIView.animate(withDuration: 0.5, delay: 0.1, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: .curveEaseOut, animations: {
            self.searchContainer.alpha = 1
            self.searchContainer.transform = .identity
        })
        
        UIView.animate(withDuration: 0.5, delay: 0.2, usingSpringWithDamping: 0.7, initialSpringVelocity: 0.5, options: .curveEaseOut, animations: {
            self.newJobButton.alpha = 1
            self.newJobButton.transform = .identity
        })
        
        // Add soft shadow pulse to FAB
        newJobButton.addSoftShadowPulse()
    }
    
    // MARK: - API
    
    func fetchUserData() {
        guard let currentUid = Auth.auth().currentUser?.uid else { return }
        
        Service.shared.fetchUserData(uid: currentUid) { user in
            self.user = user
        }
    }
    
    // MARK: - Helper Functions
    
    func configure() {
        print("Main config")
        setupCustomNavBar()
        //fetchUserData()
    }
    
    func configureSavedUserLocations() {
        guard let user = user else { return }
        
        if let homeLocation = user.homeLocation {
            // Uber uses Geocode!!!
            // Break up so we can save as job
            
        }
        
        if let workLocation = user.workLocation {
            
        }
    }
    
    func fetchFirebaseData() {
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        Service().getJobs { jobs in
            // Do something with the fetched jobs
            for job in jobs {
                self.data.append(job)
            }
            DispatchQueue.main.async {
                // Update UI or perform other tasks with the fetched data
                self.configureUI()
                
                // Animate table view in
                UIView.animate(withDuration: 0.4, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: .curveEaseOut, animations: {
                    self.tableView.alpha = 1
                    self.tableView.transform = .identity
                })
                
                // Reload table to trigger cell animations
                self.tableView.reloadData()
                
                print(self.data.count)
            }
        }
    }
    
    // FOR TABLE
    func configureUI() {
        print("Config UI")
        setTableViewDelegates()
        view.addSubview(tableView)
        
        view.bringSubviewToFront(navigationBar)
        view.bringSubviewToFront(searchContainer)
        view.bringSubviewToFront(newJobButton)
        
        
        tableView.backgroundColor = .clear
        tableView.separatorStyle = .none
        tableView.isScrollEnabled = true
        tableView.rowHeight = 120
        tableView.contentInset = UIEdgeInsets(top: 10, left: 0, bottom: 80, right: 0)
        tableView.alpha = 0
        tableView.transform = CGAffineTransform(scaleX: 0.98, y: 0.98)
        
        // Add Auto Layout constraints (adjust as needed)
        tableView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: searchContainer.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 0),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: 0),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    func setTableViewDelegates() {
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(JobCardTableViewCell.self, forCellReuseIdentifier: reuseIdentifier)
    }
    
    func showJobActionSheet() {
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
        present(actionSheet, animated: true, completion: nil)
    }
    
    func showServiceActionSheet() {
        addJobController?.delegate = self
        let actionSheet = UIAlertController(title: "What Service do you need?", message: nil, preferredStyle: .actionSheet)
        
        // Add actions to the action sheet
        let option1Action = UIAlertAction(title: "Dumpster Rental", style: .default) { _ in
            print("Dumpster Rental selected")
            let controller = DumpsterRequestController(user: self.user!)
            
            let nav = UINavigationController(rootViewController: controller)
            self.present(nav, animated: true, completion: nil)
        }
        actionSheet.addAction(option1Action)
        
        let option2Action = UIAlertAction(title: "Lawn Care", style: .default) { _ in
            print("Lawn Care selected")
            self.showJobActionSheet()
        }
        actionSheet.addAction(option2Action)
        
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
        present(actionSheet, animated: true, completion: nil)
    }
    
    func setupCustomNavBar() {
        print("Custom Nav bar")
        
        // Create the navigation bar with transparent blur effect
        navigationBar.translatesAutoresizingMaskIntoConstraints = false
        navigationBar.isTranslucent = true
        navigationBar.setBackgroundImage(UIImage(), for: .default)
        navigationBar.shadowImage = UIImage()
        navigationBar.backgroundColor = .clear
        
        // Add blur effect to navigation bar
        let blurEffect = UIBlurEffect(style: .dark)
        let blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView.translatesAutoresizingMaskIntoConstraints = false
        blurEffectView.isUserInteractionEnabled = false
        blurEffectView.alpha = 0.95
        
        // Add subtle gradient overlay
        let gradientLayer = CAGradientLayer()
        gradientLayer.colors = [
            UIColor(white: 0, alpha: 0.3).cgColor,
            UIColor(white: 0, alpha: 0.1).cgColor
        ]
        gradientLayer.locations = [0.0, 1.0]
        gradientLayer.frame = CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width, height: 100)
        blurEffectView.contentView.layer.addSublayer(gradientLayer)
        
        view.addSubview(blurEffectView)
        view.addSubview(navigationBar)
        
        // Constraint blur effect to navigation bar area
        NSLayoutConstraint.activate([
            blurEffectView.topAnchor.constraint(equalTo: view.topAnchor),
            blurEffectView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            blurEffectView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            blurEffectView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 50)
        ])
        
        // Create a navigation item
        let navigationItem = UINavigationItem()
        
        // Hamburger menu button (left side)
        let hamburgerButton = UIBarButtonItem(
            image: UIImage(systemName: "line.horizontal.3"),
            style: .plain,
            target: self,
            action: #selector(hamburgerTapped)
        )
        hamburgerButton.tintColor = UIColor(white: 1, alpha: 0.8)
        navigationItem.leftBarButtonItem = hamburgerButton
        
        // Centered Mowie logo
        let logoImageView = UIImageView(image: UIImage(named: "mowietranssplash"))
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        
        let titleView = UIView()
        titleView.addSubview(logoImageView)
        NSLayoutConstraint.activate([
            logoImageView.centerXAnchor.constraint(equalTo: titleView.centerXAnchor),
            logoImageView.centerYAnchor.constraint(equalTo: titleView.centerYAnchor),
            logoImageView.widthAnchor.constraint(equalToConstant: 250), // a bit smaller
            logoImageView.heightAnchor.constraint(equalToConstant: 100)
        ])
        navigationItem.titleView = titleView
        
        navigationBar.items = [navigationItem]
        
        NSLayoutConstraint.activate([
            navigationBar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            navigationBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            navigationBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            navigationBar.heightAnchor.constraint(equalToConstant: 50) // ← Increased for clean space
        ])
        
        // ---- SEARCH BAR BELOW NAV BAR ----
        searchContainer.translatesAutoresizingMaskIntoConstraints = false
        searchContainer.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.3)
        searchContainer.layer.cornerRadius = 12
        searchContainer.layer.borderColor = UIColor.glassBorder.cgColor
        searchContainer.layer.borderWidth = 1
        
        // Add premium glass effect to search container
        searchContainer.applyPremiumGlass(intensity: 0.9, cornerRadius: 16)
        searchContainer.addPremiumShadowGlow(color: .primaryGreen)
        
        // Initial state for animation
        searchContainer.alpha = 0
        searchContainer.transform = CGAffineTransform(scaleX: 0.9, y: 0.9)
        
        let searchIcon = UIImageView(image: UIImage(systemName: "magnifyingglass"))
        searchIcon.tintColor = UIColor(white: 1.0, alpha: 0.5)
        searchIcon.translatesAutoresizingMaskIntoConstraints = false
        
        let searchTextField = UITextField()
        searchTextField.translatesAutoresizingMaskIntoConstraints = false
        searchTextField.placeholder = "Search jobs..."
        searchTextField.borderStyle = .none
        searchTextField.textColor = .white
        searchTextField.tintColor = UIColor.primaryGreen
        searchTextField.keyboardAppearance = .dark
        searchTextField.attributedPlaceholder = NSAttributedString(
            string: "Search jobs...",
            attributes: [NSAttributedString.Key.foregroundColor: UIColor(white: 1.0, alpha: 0.4)]
        )
        
        searchContainer.addSubview(searchIcon)
        searchContainer.addSubview(searchTextField)
        view.addSubview(searchContainer)
        
        // Add focus animations to search field
        searchTextField.addTarget(self, action: #selector(searchFieldFocusChanged(_:)), for: .editingDidBegin)
        searchTextField.addTarget(self, action: #selector(searchFieldFocusChanged(_:)), for: .editingDidEnd)
        
        NSLayoutConstraint.activate([
            // Blur effect constraints
            searchBlurEffectView.topAnchor.constraint(equalTo: searchContainer.topAnchor),
            searchBlurEffectView.leadingAnchor.constraint(equalTo: searchContainer.leadingAnchor),
            searchBlurEffectView.trailingAnchor.constraint(equalTo: searchContainer.trailingAnchor),
            searchBlurEffectView.bottomAnchor.constraint(equalTo: searchContainer.bottomAnchor),
            
            searchContainer.topAnchor.constraint(equalTo: navigationBar.bottomAnchor, constant: 16), // small margin
            searchContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            searchContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            searchContainer.heightAnchor.constraint(equalToConstant: 50),
            
            searchIcon.leadingAnchor.constraint(equalTo: searchContainer.leadingAnchor, constant: 16),
            searchIcon.centerYAnchor.constraint(equalTo: searchContainer.centerYAnchor),
            searchIcon.widthAnchor.constraint(equalToConstant: 20),
            searchIcon.heightAnchor.constraint(equalToConstant: 20),
            
            searchTextField.leadingAnchor.constraint(equalTo: searchIcon.trailingAnchor, constant: 12),
            searchTextField.trailingAnchor.constraint(equalTo: searchContainer.trailingAnchor, constant: -16),
            searchTextField.centerYAnchor.constraint(equalTo: searchContainer.centerYAnchor),
            searchTextField.heightAnchor.constraint(equalTo: searchContainer.heightAnchor)
        ])
        
        // ---- NEW JOB BUTTON FLOATING ----
        newJobButton.translatesAutoresizingMaskIntoConstraints = false
        newJobButton.setTitle("", for: .normal)
        newJobButton.applyPremiumGlassButton(style: .primary)
        newJobButton.layer.cornerRadius = 28
        newJobButton.addPremiumShadowGlow(color: .primaryGreen)
        newJobButton.addFloatingAnimation(duration: 3.0, distance: 6)
        
        let plusIcon = UIImage(systemName: "plus")?.withRenderingMode(.alwaysTemplate)
        newJobButton.setImage(plusIcon, for: .normal)
        newJobButton.tintColor = .white
        newJobButton.imageView?.contentMode = .scaleAspectFit
        
        view.addSubview(newJobButton)
        
        NSLayoutConstraint.activate([
            newJobButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            newJobButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
            newJobButton.heightAnchor.constraint(equalToConstant: 56),
            newJobButton.widthAnchor.constraint(equalToConstant: 56)
        ])
        
        newJobButton.addTarget(self, action: #selector(addTapped), for: .touchUpInside)
        
        // Configure FAB animations
        newJobButton.addGentleGlowPulse()
        newJobButton.alpha = 0
        newJobButton.transform = CGAffineTransform(translationX: 0, y: 100)
    }
    
    // MARK: - Selectors
    
    @objc func hamburgerTapped() {
        // Handle hamburger button tap
        delegate?.handleMenuToggle()
    }
    
    @objc func searchTapped() {
        // Handle search button tap
        print("Search")
    }
    
    @objc func iconTapped() {
        // Handle add button tap
        //showActionSheet()
    }
    
    @objc func addTapped() {
        // Add haptic feedback
        newJobButton.addHapticFeedback(style: .medium)
        
        // Handle add button tap
        showServiceActionSheet()
    }
    
    @objc func searchFieldFocusChanged(_ textField: UITextField) {
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            if textField.isFirstResponder {
                self.searchContainer.layer.borderColor = UIColor.primaryGreen.cgColor
                self.searchContainer.layer.borderWidth = 2.0
                
                // Add green glow
                self.searchContainer.layer.shadowColor = UIColor.primaryGreen.cgColor
                self.searchContainer.layer.shadowOffset = CGSize(width: 0, height: 0)
                self.searchContainer.layer.shadowRadius = 12
                self.searchContainer.layer.shadowOpacity = 0.6
            } else {
                self.searchContainer.layer.borderColor = UIColor.glassBorder.cgColor
                self.searchContainer.layer.borderWidth = 1.0
                
                // Remove glow
                self.searchContainer.layer.shadowOpacity = 0
            }
        })
    }
    
    func isValidStreetNumber(_ streetNumber: String) -> Bool {
        let numberRegex = "^[0-9]+$"
        let numberPredicate = NSPredicate(format: "SELF MATCHES %@", numberRegex)
        return numberPredicate.evaluate(with: streetNumber)
    }
    
    func isValidStreetName(_ streetName: String) -> Bool {
        let nameRegex = "^[a-zA-Z.]+$"
        let namePredicate = NSPredicate(format: "SELF MATCHES %@", nameRegex)
        return namePredicate.evaluate(with: streetName)
    }
    
    func isValidCity(_ city: String) -> Bool {
        let cityRegex = "^[a-zA-Z]+$"
        let cityPredicate = NSPredicate(format: "SELF MATCHES %@", cityRegex)
        return cityPredicate.evaluate(with: city)
    }
    
    func isValidState(_ state: String) -> Bool {
        let stateRegex = "^[a-zA-Z]{2}$"
        let statePredicate = NSPredicate(format: "SELF MATCHES %@", stateRegex)
        return statePredicate.evaluate(with: state)
    }
    
    func isValidZipCode(_ zipCode: String) -> Bool {
        let zipRegex = "^[0-9]{5}$"
        let zipPredicate = NSPredicate(format: "SELF MATCHES %@", zipRegex)
        return zipPredicate.evaluate(with: zipCode)
    }
    
    func isCityNotEligible(enteredCity: String) -> Bool {
        return !eligibleCities.contains(enteredCity.lowercased())
    }
    
    func getServerValues(package: String, frequency: String) -> (String, String, String, String) {
        print(package)
        
        var amount = ""
        var name = ""
        var des = ""
        var price = ""
        
        let originalString = package
        let separator: Character = "-"
        let priceSign: Character = "$"
        
        let priceStrings = originalString.components(separatedBy: String(priceSign))
        
        let remainingString = priceStrings[0]
        amount = priceStrings[1]
        
        print("Cut Portion: \(remainingString)")
        
        if package.contains(separator) {
            let separatedStrings = remainingString.components(separatedBy: String(separator))
            name = separatedStrings[0].trimmingCharacters(in: .whitespaces)
            des = separatedStrings[1].trimmingCharacters(in: .whitespaces)
        } else {
            name = remainingString
            des = remainingString
        }
        
        print("Amount: \(amount)")
        print("Name: \(name)")
        print("Description: \(des)")
        
        switch package {
        case "Mowie's Best - Mow, Edge, Trim & Bag $55":
            if(frequency == "One Time")
            {
                price = "000000";
            }
            else if (frequency == "Weekly")
            {
                price = "000001";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000002";
            }
            else if (frequency == "Monthly")
            {
                price = "000003";
            }
            break;
        case "Clean Cut - Mow, Edging, Trim $45":
            if (frequency == "One Time")
            {
                price = "000004";
            }
            else if (frequency == "Weekly")
            {
                price = "000005";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000006";
            }
            else if (frequency == "Monthly")
            {
                price = "000007";
            }
            break;
        case "Quick Cut - Mow $40":
            if (frequency == "One Time")
            {
                price = "000008";
            }
            else if (frequency == "Weekly")
            {
                price = "000009";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000010";
            }
            else if (frequency == "Monthly")
            {
                price = "000011";
            }
            break;
        case "Garbage Pickup $375":
            if (frequency == "One Time")
            {
                price = "000012";
            }
            else if (frequency == "Weekly")
            {
                price = "000013";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000014";
            }
            else if (frequency == "Monthly")
            {
                price = "000015";
            }
            break;
        case "Yard Cleanup $155":
            if (frequency == "One Time")
            {
                price = "000016";
            }
            else if (frequency == "Weekly")
            {
                price = "000017";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000018";
            }
            else if (frequency == "Monthly")
            {
                price = "000019";
            }
            break;
        case "Leaf Cleanup $150":
            if (frequency == "One Time")
            {
                price = "000020";
            }
            else if (frequency == "Weekly")
            {
                price = "000021";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000022";
            }
            else if (frequency == "Monthly")
            {
                price = "000023";
            }
            break;
        case "Edging $45":
            if (frequency == "One Time")
            {
                price = "000024";
            }
            else if (frequency == "Weekly")
            {
                price = "000025";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000026";
            }
            else if (frequency == "Monthly")
            {
                price = "000027";
            }
            break;
        case "Bagging Fee $25":
            if (frequency == "One Time")
            {
                price = "000028";
            }
            else if (frequency == "Weekly")
            {
                price = "000029";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000030";
            }
            else if (frequency == "Monthly")
            {
                price = "000031";
            }
            break;
        case "Bush Trimming Starting at $45":
            if (frequency == "One Time")
            {
                price = "000032";
            }
            else if (frequency == "Weekly")
            {
                price = "000033";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000034";
            }
            else if (frequency == "Monthly")
            {
                price = "000035";
            }
            break;
        case "Mowie's Best - Mow, Edge, Trim & Bag $65":
            if (frequency == "One Time")
            {
                price = "001000";
            }
            else if (frequency == "Weekly")
            {
                price = "001001";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "001002";
            }
            else if (frequency == "Monthly")
            {
                price = "001003";
            }
            break;
        case "Clean Cut - Mow, Edging, Trim $55":
            if (frequency == "One Time")
            {
                price = "001004";
            }
            else if (frequency == "Weekly")
            {
                price = "001005";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "001006";
            }
            else if (frequency == "Monthly")
            {
                price = "001007";
            }
            break;
        case "Quick Cut - Mow $50":
            if (frequency == "One Time")
            {
                price = "001008";
            }
            else if (frequency == "Weekly")
            {
                price = "001009";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "001010";
            }
            else if (frequency == "Monthly")
            {
                price = "001011";
            }
            break;
        case "Yard Cleanup $255":
            if (frequency == "One Time")
            {
                price = "001012";
            }
            else if (frequency == "Weekly")
            {
                price = "001013";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "001014";
            }
            else if (frequency == "Monthly")
            {
                price = "001015";
            }
            break;
        case "Leaf Cleanup $200":
            if (frequency == "One Time")
            {
                price = "001016";
            }
            else if (frequency == "Weekly")
            {
                price = "001017";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "001018";
            }
            else if (frequency == "Monthly")
            {
                price = "001019";
            }
            break;
        case "Mowie's Best - Mow, Edge, Trim & Bag $85":
            if (frequency == "One Time")
            {
                price = "010000";
            }
            else if (frequency == "Weekly")
            {
                price = "010001";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "010002";
            }
            else if (frequency == "Monthly")
            {
                price = "010003";
            }
            break;
        case "Clean Cut - Mow, Edging, Trim $65":
            if (frequency == "One Time")
            {
                price = "010004";
            }
            else if (frequency == "Weekly")
            {
                price = "010005";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "010006";
            }
            else if (frequency == "Monthly")
            {
                price = "010007";
            }
            break;
        case "Quick Cut - Mow $60":
            if (frequency == "One Time")
            {
                price = "010008";
            }
            else if (frequency == "Weekly")
            {
                price = "010009";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "010010";
            }
            else if (frequency == "Monthly")
            {
                price = "010011";
            }
            break;
        case "Yard Cleanup $355":
            if (frequency == "One Time")
            {
                price = "010012";
            }
            else if (frequency == "Weekly")
            {
                price = "010013";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "010014";
            }
            else if (frequency == "Monthly")
            {
                price = "010015";
            }
            break;
        case "Leaf Cleanup $300":
            if (frequency == "One Time")
            {
                price = "010016";
            }
            else if (frequency == "Weekly")
            {
                price = "010017";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "010018";
            }
            else if (frequency == "Monthly")
            {
                price = "010019";
            }
            break;
        default:
            price = "";
            break;
        }
        
        return (price, amount, name, des)
    }
    
    func getQueryString(_ getData: [String: String]) -> String {
        var queryParameters: [String] = []
        
        for (key, value) in getData {
            if let escapedKey = key.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
               let escapedValue = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
                queryParameters.append("\(escapedKey)=\(escapedValue)")
            }
        }
        
        return queryParameters.joined(separator: "&")
    }
    
    func editJob(job: Job) {
        /*guard let index = jobs.firstIndex(where: { $0 === job }) else {
         return
         }*/
        
        let alertController = UIAlertController(title: "Edit Job", message: nil, preferredStyle: .alert)
        
        // Add text fields for editing
        alertController.addTextField { textField in
            textField.text = job.streetnumber
            textField.placeholder = "Street Number"
        }
        
        alertController.addTextField { textField in
            textField.text = job.streetname
            textField.placeholder = "Street Name"
        }
        
        alertController.addTextField { textField in
            textField.text = job.stateaddress
            textField.placeholder = "State Address"
        }
        
        alertController.addTextField { textField in
            textField.text = job.cityaddress
            textField.placeholder = "City Address"
        }
        
        alertController.addTextField { textField in
            textField.text = job.zipcode
            textField.placeholder = "Zipcode"
        }
        
        alertController.addTextField { textField in
            textField.text = job.note
            textField.placeholder = job.note
        }
        
        // Add a "Make Payment" button
        if job.status == "Waiting on Payment" {
            let makePaymentAction = UIAlertAction(title: "Make Payment", style: .default) { _ in
                // Perform payment logic
                // Update job status or take other actions
                print("Payment")
                let serverValues = self.getServerValues(package: job.package, frequency: job.frequency)
                
                let price = serverValues.0
                let amount = serverValues.1
                let name = serverValues.2
                let des = serverValues.3
                let cusid = self.user!.customerid
                
                // Print the values
                print("Price: \(price)")
                print("Amount: \(amount)")
                print("Name: \(name)")
                print("Description: \(des)")
                print("Freq: \(job.frequency)")
                print("Customer: \(cusid)")
                print("Job: \(job.jobid)")
                
                var feePercentage = 0.25
                var fees = ""
                
                if let amountNum = Double(amount) {
                    var result = amountNum * feePercentage
                    
                    print("Parse Value: \(amountNum)")
                    print("Result: \(result)")
                    
                    result = Double(Int(100 * result)) / 100 // Truncate the result to 2 decimal places without rounding
                    
                    print("Truncate Result: \(result)")
                    
                    fees = String(format: "%.2f", result)
                    print("Fees: \(fees)")
                } else {
                    print("Invalid amount")
                }
                
                let url = "https://mowie-service-server.onrender.com/product"
                let enCusId = String(cusid.dropFirst(4))
                
                let postData = [
                    "pee": price,
                    "ant": amount,
                    "dex": des,
                    "nom": name,
                    "feq": job.frequency,
                    "cve": enCusId,
                    "jzd": job.jobid,
                    "fxe": fees
                ]
                
                let queryString = self.getQueryString(postData)
                let htmlContent = "\(url)?\(queryString)"
                
                print("Url: \(htmlContent)")
                
                /*let payment = PaymentViewController()
                 let navigationController = UINavigationController(rootViewController: payment)
                 payment.navigationController?.navigationBar.barTintColor = .white
                 payment.modalPresentationStyle = .fullScreen
                 self.present(navigationController, animated: true, completion: nil)
                 }
                 alertController.addAction(makePaymentAction)*/
                
                DispatchQueue.main.async {
                    let payment = ApiController(job: job, url: htmlContent)
                    let navigationController = UINavigationController(rootViewController: payment)
                    navigationController.navigationBar.barTintColor = .white
                    navigationController.modalPresentationStyle = .fullScreen
                    
                    // Present from the top-most view controller
                    if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                       let topWindow = windowScene.windows.first(where: { $0.isKeyWindow }),
                       var topController = topWindow.rootViewController {
                        
                        // Climb to the top-most presented view controller
                        while let presentedVC = topController.presentedViewController {
                            topController = presentedVC
                        }
                        
                        topController.present(navigationController, animated: true, completion: nil)
                    } else {
                        print("Failed to find a top controller to present from.")
                    }
                    
                }
                
            }
            
            // Add an "Edit" action
            var editAction = UIAlertAction(title: "Update", style: .default) { _ in
                print("Edit")
                guard let streetNumberField = alertController.textFields?[0],
                      let streetNameField = alertController.textFields?[1],
                      let stateAddressField = alertController.textFields?[2],
                      let cityAddressField = alertController.textFields?[3],
                      let zipcodeField = alertController.textFields?[4],
                      let noteField = alertController.textFields?[5],
                      let newStreetNumber = streetNumberField.text, !newStreetNumber.isEmpty,
                      let newStreetName = streetNameField.text, !newStreetName.isEmpty,
                      let newStateAddress = stateAddressField.text, !newStateAddress.isEmpty,
                      let newCityAddress = cityAddressField.text, !newCityAddress.isEmpty,
                      let newZipcode = zipcodeField.text, !newZipcode.isEmpty,
                      let newNote = noteField.text
                else {
                    // Handle invalid input (e.g., show an alert)
                    return
                }
                
                guard let uid = Auth.auth().currentUser?.uid else { return }
                
                // Initializing an empty dictionary
                var jobDictionary = [String: Any]()
                
                // Setting values in the dictionary
                jobDictionary["streetname"] = newStreetName.isEmpty ? job.streetname : newStreetName
                jobDictionary["streetnumber"] = newStreetNumber.isEmpty ? job.streetnumber : newStreetNumber
                jobDictionary["stateaddress"] = newStateAddress.isEmpty ? job.stateaddress : newStateAddress
                jobDictionary["cityaddress"] = newCityAddress.isEmpty ? job.cityaddress : newCityAddress
                jobDictionary["zipcode"] = newZipcode.isEmpty ? job.zipcode : newZipcode
                jobDictionary["yardsize"] = job.yardsize
                jobDictionary["userid"] = job.userid
                jobDictionary["subid"] = job.subid
                jobDictionary["proid"] = job.proid
                jobDictionary["rating"] = job.rating
                jobDictionary["profilephotourl"] = job.profilephotourl
                jobDictionary["package"] = job.package
                jobDictionary["note"] = newNote.isEmpty ? job.note : newNote
                jobDictionary["jobid"] = job.jobid
                jobDictionary["frequency"] = job.frequency
                jobDictionary["day"] = job.day
                jobDictionary["carphotourl"] = job.carphotourl
                jobDictionary["status"] = job.status
                jobDictionary["jobstate"] = job.jobstate
                jobDictionary["customerid"] = job.customerid
                
                let job = Job(uid: uid, dictionary: jobDictionary)
                
                Service.shared.editJob(job) { (error, ref) in
                    if let error = error {
                        print("Error adding job: \(error.localizedDescription)")
                    } else {
                        print("Job added successfully. Reference: \(ref)")
                    }
                }
                // Reload the tableView to reflect the changes
                let reload = MainController()
                reload.modalPresentationStyle = .fullScreen
                self.present(reload, animated: true, completion: nil)
            }
            
            let deleteAction = UIAlertAction(title: "Delete", style: .default) { _ in
                Service.shared.deleteJob(job) { (error, ref) in
                    if let error = error {
                        print("Error adding job: \(error.localizedDescription)")
                    } else {
                        print("Job deleted successfully. Reference: \(ref)")
                        self.data.removeAll()
                        self.fetchFirebaseData()
                        DispatchQueue.main.async {
                            self.tableView.reloadData()
                        }
                    }
                }
            }
            alertController.addAction(deleteAction)
            
            // Add a "Cancel" action
            let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
            
            alertController.addAction(editAction)
            alertController.addAction(cancelAction)
            
            // Present the alert controller
            present(alertController, animated: true, completion: nil)
            
            // Add dismissal image anchored to the top-left
            let dismissalImage = UIImageView(image: UIImage(named: "dismissalImage"))
            dismissalImage.frame = CGRect(x: 10, y: 30, width: 30, height: 30)
            view.addSubview(dismissalImage)
            DispatchQueue.main.async {
                self.tableView.reloadData()
            }
        }
    }
        
        @objc func submitButtonTapped() {
         // Handle submit button action
         }
        
        // Helper method to show/hide a message when the table is empty
        func setEmptyMessage(_ message: String) {
            let containerView = UIView(frame: CGRect(x: 0, y: 0, width: self.view.bounds.size.width, height: self.view.bounds.size.height))
            
            let messageLabel = UILabel()
            messageLabel.text = message
            messageLabel.textColor = UIColor(white: 1.0, alpha: 0.6)
            messageLabel.numberOfLines = 0
            messageLabel.textAlignment = .center
            messageLabel.font = UIFont.systemFont(ofSize: 18, weight: .medium)
            messageLabel.translatesAutoresizingMaskIntoConstraints = false
            
            // Add arrow pointing to FAB
            let arrowImageView = UIImageView(image: UIImage(systemName: "arrow.down.right"))
            arrowImageView.tintColor = UIColor(white: 1.0, alpha: 0.4)
            arrowImageView.translatesAutoresizingMaskIntoConstraints = false
            
            containerView.addSubview(messageLabel)
            containerView.addSubview(arrowImageView)
            
            NSLayoutConstraint.activate([
                messageLabel.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
                messageLabel.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
                
                arrowImageView.topAnchor.constraint(equalTo: messageLabel.bottomAnchor, constant: 20),
                arrowImageView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -40),
                arrowImageView.widthAnchor.constraint(equalToConstant: 40),
                arrowImageView.heightAnchor.constraint(equalToConstant: 40)
            ])
            
            // Animate arrow with subtle bounce
            UIView.animate(withDuration: 1.5, delay: 0, options: [.repeat, .autoreverse], animations: {
                arrowImageView.transform = CGAffineTransform(translationX: 10, y: 10)
            })
            
            self.tableView.backgroundView = containerView
            self.tableView.separatorStyle = .none
        }
        
        // Helper method to remove the empty message when the table is not empty
        func restore() {
            self.tableView.backgroundView = nil
            self.tableView.separatorStyle = .none
        }
    }
    
    // MARK: - Location Services
    
    /*extension HomeController: CLLocationManagerDelegate {
     func enableLocationServices() {
     locationManager.delegate = self
     
     switch CLLocationManager.authorizationStatus() {
     case .notDetermined:
     print("DEBUG: Not determined..")
     locationManager.requestWhenInUseAuthorization()
     case .restricted, .denied:
     break
     case .authorizedAlways:
     print("DEBUG: Auth Always..")
     locationManager.startUpdatingLocation()
     locationManager.desiredAccuracy = kCLLocationAccuracyBest
     case .authorizedWhenInUse:
     print("DEBUG: Auth when in use..")
     locationManager.requestAlwaysAuthorization()
     @unknown default:
     break
     }
     }
     
     func locationManager(_ manager: CLLocationManager, didChangeAuthorization status:
     CLAuthorizationStatus) {
     if status == .authorizedWhenInUse {
     locationManager.requestAlwaysAuthorization()
     }
     }*/


// MARK: - TableView Delegates

extension MainController: UITableViewDelegate, UITableViewDataSource {
        func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
            let rowCount = self.data.count
            
            // Display a message when the table is empty
            if rowCount == 0 {
                setEmptyMessage("To get started:\nSelect Add Job button!")
            } else {
                restore()
            }
            
            return rowCount
        }
        
        func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
            let cell = tableView.dequeueReusableCell(withIdentifier: reuseIdentifier, for: indexPath) as! JobCardTableViewCell
            
            let job = data[indexPath.row] // Replace with your actual data source
            
            // Configure the cell with job data
            cell.streetAddressLabel.text = "\(job.streetnumber ?? "") \(job.streetname ?? "")"
            cell.frequencyLabel.text = "Frequency: \(job.frequency)"
            cell.statusLabel.text = "Status: \(job.status)"
            cell.packageLabel.text = job.package
            
            // Extract price from package string
            if let priceRange = job.package.range(of: "$") {
                let priceString = String(job.package[priceRange.lowerBound...])
                cell.priceLabel.text = priceString
            } else {
                cell.priceLabel.text = ""
            }
            
            return cell
        }
        
        func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
            // Animate cell appearance with stagger
            let delay = 0.05 * Double(indexPath.row)
            cell.alpha = 0
            cell.transform = CGAffineTransform(translationX: 0, y: 20)
            
            UIView.animate(withDuration: 0.4, delay: delay, usingSpringWithDamping: 0.8, initialSpringVelocity: 0, options: .curveEaseInOut, animations: {
                cell.alpha = 1
                cell.transform = .identity
            })
        }
        
        func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
            // Calculate and return the height for the cell
            return 120
        }
        
        func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
            // Get the selected job
            let selectedJob = data[indexPath.row]
            
            editJob(job: selectedJob)
        }
    }

    
    extension MainController: AddJobDelegate {
        func didAddJob() {
            tableView.reloadData()
        }
    }
