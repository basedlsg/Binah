//
//  RatingController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/14/23.
//

import UIKit

class RatingController: UITabBarController {
    let headerView = UIView()
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "RATINGS"
        label.font = UIFont(name: "Avenir-Light", size:36)
        label.textColor = UIColor(white: 1, alpha: 0.8)
        
        return label
    }()

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .systemBackground // or any color you want
        edgesForExtendedLayout = [] // Ensures safe area layout
        
        setupNavigationBar()
    }
    
    func setupNavigationBar() {
        // Logo in the middle
        let logoImageView = UIImageView(image: UIImage(named: "mowietranssplash"))
        logoImageView.contentMode = .scaleAspectFill
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        logoImageView.widthAnchor.constraint(equalToConstant: 130).isActive = true
        logoImageView.heightAnchor.constraint(equalToConstant: 200).isActive = true

        navigationItem.titleView = logoImageView
    }
    

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
