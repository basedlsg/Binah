//
//  MoreController.swift
//  mowie.ios
//
//  More tab containing About Us, Promo, and Logout
//  Preserves EXACT functionality from original MenuController
//

import UIKit

private let reuseIdentifier = "MoreCell"

// Delegate for logout handling
protocol MoreControllerDelegate: AnyObject {
    func didSelectLogout()
}

// Options that were in the original menu
enum MoreOptions: Int, CaseIterable, CustomStringConvertible {
    case about
    case promo
    case logout
    
    var description: String {
        switch self {
        case .about: return "About Us"
        case .promo: return "Promo"
        case .logout: return "Logout"
        }
    }
    
    var iconName: String {
        switch self {
        case .about: return "info.circle"
        case .promo: return "tag.circle"
        case .logout: return "arrow.right.square"
        }
    }
}

class MoreController: UIViewController {
    
    // MARK: - Properties
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    private let user: User
    weak var delegate: MoreControllerDelegate?
    
    private let tableView = UITableView()
    
    // User info header
    private lazy var userHeaderView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .clear
        
        // Apply glass panel styling
        view.applyGlassPanel(cornerRadius: 16)
        
        // Profile image
        let profileImageView = UIImageView()
        profileImageView.image = UIImage(systemName: "person.crop.circle.fill")
        profileImageView.tintColor = .white
        profileImageView.contentMode = .scaleAspectFill
        profileImageView.clipsToBounds = true
        profileImageView.layer.cornerRadius = 30
        profileImageView.backgroundColor = .darkGray
        profileImageView.translatesAutoresizingMaskIntoConstraints = false
        
        // Name label
        let nameLabel = UILabel()
        nameLabel.text = "\(user.firstname) \(user.lastname)"
        nameLabel.textColor = .white
        nameLabel.font = UIFont.boldSystemFont(ofSize: 18)
        nameLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Email label
        let emailLabel = UILabel()
        emailLabel.text = user.email
        emailLabel.textColor = UIColor(white: 1.0, alpha: 0.7)
        emailLabel.font = UIFont.systemFont(ofSize: 14)
        emailLabel.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(profileImageView)
        view.addSubview(nameLabel)
        view.addSubview(emailLabel)
        
        NSLayoutConstraint.activate([
            profileImageView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            profileImageView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            profileImageView.widthAnchor.constraint(equalToConstant: 60),
            profileImageView.heightAnchor.constraint(equalToConstant: 60),
            
            nameLabel.leadingAnchor.constraint(equalTo: profileImageView.trailingAnchor, constant: 12),
            nameLabel.topAnchor.constraint(equalTo: profileImageView.topAnchor, constant: 8),
            nameLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            
            emailLabel.leadingAnchor.constraint(equalTo: nameLabel.leadingAnchor),
            emailLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 4),
            emailLabel.trailingAnchor.constraint(equalTo: nameLabel.trailingAnchor)
        ])
        
        // Load profile image if available
        if let url = URL(string: user.profilephotourl), !user.profilephotourl.isEmpty {
            loadImage(from: url, into: profileImageView)
        }
        
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
        
        title = "More"
        
        // Apply gradient background to match app design
        view.applyDarkGreenGradient()
        
        configureTableView()
        setupConstraints()
    }
    
    // MARK: - Setup Methods
    
    private func configureTableView() {
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.backgroundColor = .clear
        tableView.separatorColor = UIColor(white: 1.0, alpha: 0.1)
        tableView.separatorStyle = .singleLine
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: reuseIdentifier)
        tableView.rowHeight = 60
        
        view.addSubview(userHeaderView)
        view.addSubview(tableView)
    }
    
    private func setupConstraints() {
        NSLayoutConstraint.activate([
            // User header
            userHeaderView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            userHeaderView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            userHeaderView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            userHeaderView.heightAnchor.constraint(equalToConstant: 80),
            
            // Table view
            tableView.topAnchor.constraint(equalTo: userHeaderView.bottomAnchor, constant: 24),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    // MARK: - Helper Methods
    
    private func loadImage(from url: URL, into imageView: UIImageView) {
        URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data, let image = UIImage(data: data) else { return }
            DispatchQueue.main.async {
                imageView.image = image
            }
        }.resume()
    }
    
    private func handleOptionSelection(_ option: MoreOptions) {
        switch option {
        case .about:
            // EXACT same behavior as original menu
            let controller = AboutUsController()
            let nav = UINavigationController(rootViewController: controller)
            present(nav, animated: true, completion: nil)
            
        case .promo:
            // EXACT same behavior as original menu
            let alertController = UIAlertController(
                title: "Promotions",
                message: "There are no promotions at this time. Try again later.",
                preferredStyle: .alert
            )
            let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
            alertController.addAction(okAction)
            present(alertController, animated: true, completion: nil)
            
        case .logout:
            // Delegate to CustomerTabController for EXACT same logout flow
            delegate?.didSelectLogout()
        }
    }
}

// MARK: - UITableViewDataSource

extension MoreController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return MoreOptions.allCases.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: reuseIdentifier, for: indexPath)
        
        guard let option = MoreOptions(rawValue: indexPath.row) else {
            return UITableViewCell()
        }
        
        // Configure cell exactly like original menu
        cell.backgroundColor = .clear
        cell.contentView.backgroundColor = .clear
        cell.textLabel?.text = option.description
        cell.textLabel?.textColor = .white
        cell.textLabel?.font = .systemFont(ofSize: 18, weight: .medium)
        cell.selectionStyle = .none
        
        // Add icon
        cell.imageView?.image = UIImage(systemName: option.iconName)
        cell.imageView?.tintColor = UIColor.accentGreen
        
        // Add glass panel effect to cell
        cell.contentView.applyGlassPanel(cornerRadius: 8)
        
        // Special styling for logout option
        if option == .logout {
            cell.textLabel?.textColor = UIColor.systemRed
            cell.imageView?.tintColor = UIColor.systemRed
        }
        
        return cell
    }
}

// MARK: - UITableViewDelegate

extension MoreController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        guard let option = MoreOptions(rawValue: indexPath.row) else { return }
        handleOptionSelection(option)
    }
}