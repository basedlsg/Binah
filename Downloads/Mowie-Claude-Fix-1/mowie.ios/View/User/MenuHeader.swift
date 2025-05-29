//
//  MenuHeader.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/24/23.
//

import UIKit

class MenuHeader: UIView {
    
    // MARK: - Properties
    
    private let user: User
    weak var delegate: MenuHeaderDelegate?
    
    private let profileImageView: UIImageView = {
        let iv = UIImageView()
        iv.image = UIImage(systemName: "person.crop.circle.fill") // Default image
        iv.tintColor = .white
        iv.contentMode = .scaleAspectFill
        iv.clipsToBounds = true
        iv.layer.cornerRadius = 32
        iv.backgroundColor = .darkGray // Just to help you see it
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()
    
    private let nameLabel: UILabel = {
        let label = UILabel()
        label.textColor = .white
        label.font = UIFont.boldSystemFont(ofSize: 18)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    // MARK: - Lifecycle
    
    init(user: User, frame: CGRect) {
        self.user = user
        super.init(frame: frame)
        
        backgroundColor = UIColor.rgb(red: 0, green: 75, blue: 0)
        
        addSubview(profileImageView)
        addSubview(nameLabel)
        
        NSLayoutConstraint.activate([
            profileImageView.topAnchor.constraint(equalTo: topAnchor, constant: 16),
            profileImageView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            profileImageView.widthAnchor.constraint(equalToConstant: 64),
            profileImageView.heightAnchor.constraint(equalToConstant: 64),
            
            nameLabel.centerYAnchor.constraint(equalTo: profileImageView.centerYAnchor),
            nameLabel.leadingAnchor.constraint(equalTo: profileImageView.trailingAnchor, constant: 12),
            nameLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16)
        ])
        
        nameLabel.text = "\(user.firstname) \(user.lastname)"
        
        if let url = URL(string: user.profilephotourl), !user.profilephotourl.isEmpty {
            loadImage(from: url)
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Selectors
    
    // MARK: - Helpers
    
    private func loadImage(from url: URL) {
        URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data, let image = UIImage(data: data) else { return }
            DispatchQueue.main.async {
                self.profileImageView.image = image
            }
        }.resume()
    }
}
