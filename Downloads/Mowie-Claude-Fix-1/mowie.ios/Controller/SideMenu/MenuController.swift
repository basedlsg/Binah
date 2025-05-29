//
//  MenuController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/20/23.
//

import Foundation
import UIKit

private let reuseIdentifier = "MenuCell"

enum MenuOptions: Int, CaseIterable, CustomStringConvertible {
    case profile
    //case payments
    //case addjob
    case promo
    case helptab
    case about
    case logout
    
    var description: String {
        switch self {
        case .profile: return "Profile"
        //case .payments: return "Payments"
        //case .addjob: return "Add Job"
        case .promo: return "Promo"
        case .helptab: return "Help"
        case .about: return "About Us"
        case .logout: return "Logout"
        }
    }
}

protocol MenuControllerDelegate: class {
    func didSelect(option: MenuOptions)
}

class MenuController: UITableViewController {
    // MARK: - Properties
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    private let user: User
    
    //let headerView = UIView()
    
    weak var delegate: MenuControllerDelegate?
    
    private lazy var menuHeader: MenuHeader = {
        let frame = CGRect(x: 0, y: 0, width: self.view.frame.width - 80, height: 140)
        let view = MenuHeader(user: user, frame: frame)
        view.delegate = self // ✅ Correct: set delegate on the local variable
        return view
    }()

    
    // MARK: - Lifecycle
    
    init(user: User) {
        self.user = user
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Force dark background on the VIEW itself
        view.backgroundColor = UIColor(red: 0.05, green: 0.05, blue: 0.05, alpha: 1.0)
        
        // Force table view to be transparent
        tableView.backgroundColor = .clear
        tableView.separatorColor = UIColor(white: 1.0, alpha: 0.1)
        tableView.separatorStyle = .singleLine
        
        // Remove any default backgrounds
        tableView.backgroundView = nil
        
        configureTableView()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        view.backgroundColor = UIColor(red: 0.05, green: 0.05, blue: 0.05, alpha: 1.0)
        tableView.reloadData()
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        
        // Ensure table view fills the entire view
        tableView.frame = view.bounds
        
        // Force styling again after layout
        view.backgroundColor = UIColor(red: 0.05, green: 0.05, blue: 0.05, alpha: 1.0)
        tableView.backgroundColor = .clear
    }
    
    // MARK: - Selectors
    
    // MARK: - Helper Functions
    
    func configureTableView() {
        tableView.isScrollEnabled = false
        tableView.rowHeight = 50
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: reuseIdentifier)
        
        // Ensure MenuHeader is properly set with correct height
        tableView.tableHeaderView = menuHeader
    }
    
//    func customizeHeader() {
//        // Add your header view
//        headerView.backgroundColor = .mowieColor
//        headerView.translatesAutoresizingMaskIntoConstraints = false
//        view.addSubview(headerView)
//
//        // Add constraints for the header view
//        NSLayoutConstraint.activate([
//            headerView.topAnchor.constraint(equalTo: view.topAnchor),
//            headerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
//            headerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
//            headerView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8)
//        ])
//    }
    
    /*func customizeHeader() {
        // Configure header
        headerView.backgroundColor = .mowieColor
        headerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(headerView)

        // Add Mowie Logo
        let logoImageView = UIImageView(image: UIImage(named: "mowietranssplash"))
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        headerView.addSubview(logoImageView)

        // Header Constraints
        NSLayoutConstraint.activate([
            headerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            headerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 80) // Adjust as needed
        ])

        // Logo Constraints (Centered)
        NSLayoutConstraint.activate([
            logoImageView.centerXAnchor.constraint(equalTo: headerView.centerXAnchor),
            logoImageView.centerYAnchor.constraint(equalTo: headerView.centerYAnchor),
            logoImageView.heightAnchor.constraint(equalToConstant: 50), // Adjust logo size
            logoImageView.widthAnchor.constraint(equalToConstant: 200) // Adjust width
        ])
    }*/
}

extension MenuController: MenuHeaderDelegate {
    func profileImageViewTapped() {
            let cameraManager = CameraManager(photoType: "profilephoto")
            cameraManager.modalPresentationStyle = .fullScreen
            self.present(cameraManager, animated: true, completion: nil)
        }
}

// MARK: - UITable

extension MenuController {
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return MenuOptions.allCases.count
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: reuseIdentifier, for: indexPath)
        
        guard let option = MenuOptions(rawValue: indexPath.row) else { 
            return UITableViewCell() 
        }
        
        // Set menu item text
        cell.textLabel?.text = option.description
        
        // Force cell styling
        cell.backgroundColor = .clear
        cell.contentView.backgroundColor = .clear
        cell.textLabel?.textColor = .white
        cell.textLabel?.font = .systemFont(ofSize: 18, weight: .medium)
        
        // Remove default selection style
        cell.selectionStyle = .none
        
        // Add proper padding
        cell.separatorInset = UIEdgeInsets(top: 0, left: 16, bottom: 0, right: 16)
        cell.layoutMargins = UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16)
        
        return cell
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        guard let option = MenuOptions(rawValue: indexPath.row) else { return }
        delegate?.didSelect(option: option)
    }
}
