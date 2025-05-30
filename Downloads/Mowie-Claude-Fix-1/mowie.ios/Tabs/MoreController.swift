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
        
        // Add subtle animations to user header
        animateUserHeader()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Refresh animations when view appears
        animateUserHeader()
    }
    
    private func animateUserHeader() {
        // Initial state
        userHeaderView.alpha = 0
        userHeaderView.transform = CGAffineTransform(translationX: 0, y: -20)
        
        // Animate in with spring effect
        UIView.animate(withDuration: 0.6, delay: 0.1, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: [.curveEaseOut], animations: {
            self.userHeaderView.alpha = 1
            self.userHeaderView.transform = .identity
        })
        
        // Add subtle float animation to profile image
        if let profileImageView = userHeaderView.subviews.first(where: { $0 is UIImageView }) {
            addFloatAnimation(to: profileImageView)
        }
    }
    
    private func addFloatAnimation(to view: UIView) {
        guard PerformanceManager.shared.shouldAnimate() else { return }
        
        // Remove any existing animations
        view.layer.removeAllAnimations()
        
        // Gentle floating animation
        let animation = CABasicAnimation(keyPath: "transform.translation.y")
        animation.duration = 3.0
        animation.fromValue = -2
        animation.toValue = 2
        animation.autoreverses = true
        animation.repeatCount = .infinity
        animation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        
        view.layer.add(animation, forKey: "float")
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
        
        // Configure cell with premium styling
        cell.backgroundColor = .clear
        cell.contentView.backgroundColor = .clear
        cell.selectionStyle = .none
        
        // Remove any existing subviews to prevent duplication
        cell.contentView.subviews.forEach { $0.removeFromSuperview() }
        
        // Create custom container for premium layout
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false
        container.applyGlassPanel(cornerRadius: 12)
        cell.contentView.addSubview(container)
        
        // Icon with glow effect
        let iconContainer = UIView()
        iconContainer.translatesAutoresizingMaskIntoConstraints = false
        iconContainer.backgroundColor = UIColor.accentGreen.withAlphaComponent(0.1)
        iconContainer.layer.cornerRadius = 20
        
        let iconImageView = UIImageView()
        iconImageView.translatesAutoresizingMaskIntoConstraints = false
        iconImageView.image = UIImage(systemName: option.iconName)
        iconImageView.tintColor = UIColor.accentGreen
        iconImageView.contentMode = .scaleAspectFit
        
        iconContainer.addSubview(iconImageView)
        container.addSubview(iconContainer)
        
        // Label with custom styling
        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = option.description
        titleLabel.textColor = .white
        titleLabel.font = .systemFont(ofSize: 17, weight: .medium)
        container.addSubview(titleLabel)
        
        // Arrow indicator
        let arrowImageView = UIImageView()
        arrowImageView.translatesAutoresizingMaskIntoConstraints = false
        arrowImageView.image = UIImage(systemName: "chevron.right")
        arrowImageView.tintColor = UIColor(white: 1.0, alpha: 0.4)
        arrowImageView.contentMode = .scaleAspectFit
        container.addSubview(arrowImageView)
        
        // Special styling for logout option
        if option == .logout {
            iconContainer.backgroundColor = UIColor.systemRed.withAlphaComponent(0.1)
            iconImageView.tintColor = UIColor.systemRed
            titleLabel.textColor = UIColor.systemRed
            
            // Add subtle pulse animation to logout
            let pulseAnimation = CABasicAnimation(keyPath: "opacity")
            pulseAnimation.duration = 2.0
            pulseAnimation.fromValue = 1.0
            pulseAnimation.toValue = 0.6
            pulseAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            pulseAnimation.autoreverses = true
            pulseAnimation.repeatCount = .infinity
            iconContainer.layer.add(pulseAnimation, forKey: "pulse")
        }
        
        // Add glow to icon
        iconContainer.layer.shadowColor = option == .logout ? UIColor.systemRed.cgColor : UIColor.accentGreen.cgColor
        iconContainer.layer.shadowOffset = CGSize(width: 0, height: 0)
        iconContainer.layer.shadowRadius = 4
        iconContainer.layer.shadowOpacity = 0.3
        
        // Layout constraints
        NSLayoutConstraint.activate([
            // Container fills cell with padding
            container.topAnchor.constraint(equalTo: cell.contentView.topAnchor, constant: 4),
            container.leadingAnchor.constraint(equalTo: cell.contentView.leadingAnchor, constant: 16),
            container.trailingAnchor.constraint(equalTo: cell.contentView.trailingAnchor, constant: -16),
            container.bottomAnchor.constraint(equalTo: cell.contentView.bottomAnchor, constant: -4),
            
            // Icon container
            iconContainer.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 12),
            iconContainer.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            iconContainer.widthAnchor.constraint(equalToConstant: 40),
            iconContainer.heightAnchor.constraint(equalToConstant: 40),
            
            // Icon inside container
            iconImageView.centerXAnchor.constraint(equalTo: iconContainer.centerXAnchor),
            iconImageView.centerYAnchor.constraint(equalTo: iconContainer.centerYAnchor),
            iconImageView.widthAnchor.constraint(equalToConstant: 22),
            iconImageView.heightAnchor.constraint(equalToConstant: 22),
            
            // Title label
            titleLabel.leadingAnchor.constraint(equalTo: iconContainer.trailingAnchor, constant: 16),
            titleLabel.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: arrowImageView.leadingAnchor, constant: -8),
            
            // Arrow
            arrowImageView.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -12),
            arrowImageView.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            arrowImageView.widthAnchor.constraint(equalToConstant: 12),
            arrowImageView.heightAnchor.constraint(equalToConstant: 16)
        ])
        
        return cell
    }
}

// MARK: - UITableViewDelegate

extension MoreController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        guard let option = MoreOptions(rawValue: indexPath.row) else { return }
        
        // Add haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.prepare()
        generator.impactOccurred()
        
        // Animate cell press
        if let cell = tableView.cellForRow(at: indexPath) {
            animateCellPress(cell) {
                self.handleOptionSelection(option)
            }
        } else {
            handleOptionSelection(option)
        }
    }
    
    private func animateCellPress(_ cell: UITableViewCell, completion: @escaping () -> Void) {
        // Get the glass container from cell
        guard let container = cell.contentView.subviews.first else {
            completion()
            return
        }
        
        // Scale down animation
        UIView.animate(withDuration: 0.1, delay: 0, options: [.curveEaseOut, .allowUserInteraction], animations: {
            container.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
            container.alpha = 0.8
        }) { _ in
            // Scale back up
            UIView.animate(withDuration: 0.1, delay: 0, options: [.curveEaseIn, .allowUserInteraction], animations: {
                container.transform = .identity
                container.alpha = 1.0
            }) { _ in
                completion()
            }
        }
    }
    
    func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
        // Animate cells appearing with stagger effect
        cell.alpha = 0
        cell.transform = CGAffineTransform(translationX: 0, y: 20)
        
        let delay = 0.05 * Double(indexPath.row)
        UIView.animate(withDuration: 0.4, delay: delay, options: [.curveEaseOut], animations: {
            cell.alpha = 1
            cell.transform = .identity
        })
    }
}