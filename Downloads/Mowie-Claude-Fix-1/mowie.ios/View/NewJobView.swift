//
//  NewJobView.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/2/23.
//

import Foundation
import UIKit
import Firebase
import FirebaseAuth

protocol NewJobViewDelegate: class {
    func addJob(_ job: Job)
}

class NewJobView: UIView {
    
    // MARK: - Properties
    
    weak var delegate: NewJobViewDelegate?
    
    private var mainController: MainController!
    
    private lazy var containerStackView: UIStackView = {
            let stackView = UIStackView()
            stackView.axis = .vertical
            stackView.spacing = 10
            stackView.translatesAutoresizingMaskIntoConstraints = false
            return stackView
        }()
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Add Property"
        label.font = UIFont(name: "Avenir-Light", size:36)
        label.textColor = UIColor(white: 1, alpha: 0.8)
        
        return label
    }()
    
    private lazy var streetNumberContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: streetNumberTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let streetNumberTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Street Number", isSecureTextEntry: false, keyboardtype: .numberPad)
    }()
    
    private lazy var streetNameContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: streetNameTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let streetNameTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Street Name", isSecureTextEntry: false)
    }()
    
    private lazy var stateaddressContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: stateaddressTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let stateaddressTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "State", isSecureTextEntry: false)
    }()
    
    private lazy var cityaddressContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: cityaddressTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let cityaddressTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "City", isSecureTextEntry: false)
    }()
    
    private lazy var zipcodeContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: zipcodeTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let zipcodeTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Zip Code", isSecureTextEntry: false)
    }()
    
    private lazy var yardsizeContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: yardsizeTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let yardsizeTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "YardSize", isSecureTextEntry: false)
    }()
    
    private lazy var packageContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: packageTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let packageTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Package", isSecureTextEntry: false)
    }()
    
    private lazy var frequencyContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: frequencyTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let frequencyTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Frequency", isSecureTextEntry: false)
    }()
    
    private lazy var dayContainerView: UIView = {
        let view = UIView().inputContainerView(image: UIImage(imageLiteralResourceName: "icons8-home-24"), textField: dayTextField)
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return view
    }()
    
    private let dayTextField: UITextField = {
        return UITextField().textField(withPlaceholder: "Service Day", isSecureTextEntry: false)
    }()
    
    private let submitJobButton: AuthButton = {
        let button = AuthButton(type: .system)
        button.setTitle("SUBMIT", for: .normal)
        button.titleLabel?.font = UIFont.boldSystemFont(ofSize: 20)
        button.addTarget(self, action: #selector(addJobButton), for: .touchUpInside)
        
        return button
    }()
    
    var newTask: Job? {
        didSet {
            return
        }
    }
    
    // MARK: - Lifecycle
    
    override init(frame: CGRect) {
        super.init(frame: frame)

        configureUI()
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Helper Functions
    
    func configureUI() {
        mainController.view.isHidden = true
        backgroundColor = .white
        
        addSubview(containerStackView)

                // Add your fields to the stack view
                containerStackView.addArrangedSubview(titleLabel)
                containerStackView.addArrangedSubview(streetNumberContainerView)
                containerStackView.addArrangedSubview(streetNameContainerView)
                containerStackView.addArrangedSubview(stateaddressContainerView)
                containerStackView.addArrangedSubview(cityaddressContainerView)
                containerStackView.addArrangedSubview(zipcodeContainerView)
                containerStackView.addArrangedSubview(yardsizeContainerView)
                containerStackView.addArrangedSubview(packageContainerView)
                containerStackView.addArrangedSubview(frequencyContainerView)
                containerStackView.addArrangedSubview(dayContainerView)

                // Add the submit button
                containerStackView.addArrangedSubview(submitJobButton)
  
                // Set up constraints
                NSLayoutConstraint.activate([
                    containerStackView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 20),
                    containerStackView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -20),
                    containerStackView.topAnchor.constraint(equalTo: topAnchor, constant: 20),
                    containerStackView.bottomAnchor.constraint(lessThanOrEqualTo: bottomAnchor, constant: -20),
                ])
    }
    
    func createJob() -> Job? {
        guard let uid = Auth.auth().currentUser?.uid else { return nil }
        
        let jobDictionary: [String: Any] = [
            "streetNumber": streetNumberTextField.text ?? "",
            "streetName": streetNameTextField.text ?? "",
            "stateAddress": stateaddressTextField.text ?? "",
            "cityAddress": cityaddressTextField.text ?? "",
            "zipCode": zipcodeTextField.text ?? "",
            "yardSize": yardsizeTextField.text ?? "",
            "package": packageTextField.text ?? "",
            "frequency": frequencyTextField.text ?? "",
            "day": dayTextField.text ?? "",
            "userid": Auth.auth().currentUser?.uid ?? "",
            "subid": "Not Assigned",
            "proid": "Not Assigned",
            "status": 0,
            "rating": "Not Rated",
            "profilephotourl": "Not Set",
            "note": "No Note",
            "jobid": "Not Assigned",
            "carphotourl": "Not Set"
        ]
        
        let newJob = Job(uid: uid, dictionary: jobDictionary)
        return newJob
    }
    
    // MARK: - Selectors
    
    @objc func addJobButton() {
        guard let job = createJob() else {
                print("DEBUG: Failed to create job. User not authenticated or some required data is missing.")
                return
            }

            delegate?.addJob(job)
    }
}
