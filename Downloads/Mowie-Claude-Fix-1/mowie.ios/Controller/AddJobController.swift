//
//  AddJobController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/29/23.
//

import UIKit
import Firebase
import FirebaseAuth
import Stripe
import StripePaymentSheet

protocol AddJobDelegate: AnyObject {
    func didAddJob()
}

class AddJobController: UIViewController, UITextFieldDelegate {
    private let user: User
    var size: String = ""
    var compatable: Bool = true
    var adjustedFee: Bool = false
    
    private var paymentSheet: PaymentSheet?
    
    private var clientSecret: String?
    private var customerId: String?
    private var ephemeralKey: String?
    
    private var shouldPresentPaymentSheet = false
    private var hasPresentedPaymentSheet = false
    
    var selectedCity: String = ""
    var selectedRegularity: String = ""
    var selectedDay: String = ""
    var selectedPackage: String = ""
    
    weak var delegate: AddJobDelegate?
    private var activePicker: UIPickerView?
    
    
    private var streetNumberTextField: UITextField!
    private var streetNameTextField: UITextField!
    private var cityTextField: UITextField!
    private var stateTextField: UITextField!
    private var zipTextField: UITextField!
    private var regularityTextField: UITextField!
    private var dayTextField: UITextField!
    private var packageTextField: UITextField!
    private var cityPicker: UIPickerView!
    private var regularityPicker: UIPickerView!
    private var dayPicker: UIPickerView!
    private var packagePicker: UIPickerView!
    private var submitButton: UIButton!
    
    private let regularityOptions = ["One Time", "Weekly", "Bi-Weekly", "Monthly"]
    private let dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    private var packageOptions = [""]
    private let cityOptions = ["Clinton Township", "Dearborn", "Dearborn Heights",
                               "Detroit", "Eastpointe", "Ecorse", "Ferndale", "Fraser",
                               "Grosse Pointe", "Hamtramick", "Harper Woods", "Hazel Park",
                               "Highland Park", "Inkster", "Madison Heights", "Melvindale",
                               "Oak Park", "Redford", "River Rouge", "Romulus", "Roseville",
                               "Royal Oak", "Southfield", "Sterling Heights", "Troy",
                               "Warren", "Westland"]
    
    let eligibleCities: [String] = ["detroit", "eastpointe", "harper woods", "roseville", "warren", "hazel park", "oak park", "ferndale", "southfield", "ecorse", "river rouge", "redford", "inkster", "dearborn", "hamtramick", "highland park", "sterling heights", "madison heights", "clinton township", "troy", "romulus", "fraser",
                                    "melvindale", "westland", "dearborn heights", "grosse pointe", "royal oak"]
    
    enum PlaceholderType: String {
        case city = "City"
        case regularity = "Regularity"
        case day = "Day"
        case package = "Package"
    }
    
    //------------------------------------------------------------------------------
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        print("Add Job")
        checkAndRunFunction()
        configureNavigationBar()
        applyGradientToNavigationBar(self.navigationController)
        
        // Add a "Done" button to the keyboard
        addDoneButtonTo(streetNumberTextField)
        addDoneButtonTo(streetNameTextField)
        //addDoneButtonTo(cityTextField)
        addDoneButtonTo(stateTextField)
        addDoneButtonTo(zipTextField)
        
        // Set the delegate for text fields
        streetNumberTextField.delegate = self
        streetNameTextField.delegate = self
        //cityTextField.delegate = self
        stateTextField.delegate = self
        streetNumberTextField.delegate = self
        zipTextField.delegate = self
    }
    
    init(user: User, size: String) {
        self.user = user
        self.size = size
        super.init(nibName: nil, bundle: nil)
        
        switch size.lowercased() {
        case "standard":
            packageOptions.append("Mowie's Best - Mow, Edge, Trim & Bag $55")
            packageOptions.append("Clean Cut - Mow, Edging, Trim $45")
            packageOptions.append("Quick Cut - Mow $40")
            packageOptions.append("Garbage Pickup $375")
            packageOptions.append("Yard Cleanup $155")
            packageOptions.append("Leaf Cleanup $150")
            packageOptions.append("Edging $45")
            packageOptions.append("Bagging Fee $25")
            packageOptions.append("Bush Trimming Starting at $45")
            packageOptions.append("Grass Lot - Blow, Mow, Whack $130")
        case "medium":
            packageOptions.append("Mowie's Best - Mow, Edge, Trim & Bag $65")
            packageOptions.append("Clean Cut - Mow, Edging, Trim $55")
            packageOptions.append("Quick Cut - Mow $50")
            packageOptions.append("Garbage Pickup $375")
            packageOptions.append("Yard Cleanup $255")
            packageOptions.append("Leaf Cleanup $200")
            packageOptions.append("Edging $45")
            packageOptions.append("Bagging Fee $25")
            packageOptions.append("Bush Trimming Starting at $45")
            packageOptions.append("Grass Lot - Blow, Mow, Whack $130")
        case "large":
            packageOptions.append("Mowie's Best - Mow, Edge, Trim & Bag $85")
            packageOptions.append("Clean Cut - Mow, Edging, Trim $65")
            packageOptions.append("Quick Cut - Mow $60")
            packageOptions.append("Garbage Pickup $375")
            packageOptions.append("Yard Cleanup $355")
            packageOptions.append("Leaf Cleanup $300")
            packageOptions.append("Edging $45")
            packageOptions.append("Bagging Fee $25")
            packageOptions.append("Bush Trimming Starting at $45")
            packageOptions.append("Grass Lot - Blow, Mow, Whack $130")
        default:
            print("Invalid size")
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func addDoneButtonTo(_ textField: UITextField) {
        let toolbar = UIToolbar()
        toolbar.sizeToFit()
        
        let flexSpace = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
        let doneButton = UIBarButtonItem(barButtonSystemItem: .done, target: self, action: #selector(doneButtonTapped))
        
        toolbar.items = [flexSpace, doneButton]
        
        textField.inputAccessoryView = toolbar
    }
    
    @objc func doneButtonTapped() {
        // You can perform any action when the "Done" button is tapped
        view.endEditing(true)
    }
    
    func checkAndRunFunction() {
        let systemVersion = UIDevice.current.systemVersion
        let versionComponents = systemVersion.split(separator: ".").compactMap { Int($0) }
        
        compatable = false
        setupUIForiOS12()
        // Check if the major version is less than 13 or if it's equal to 13 but the minor version is less than 1
        /*if versionComponents.count >= 2, versionComponents[0] < 17 || (versionComponents[0] == 17 && versionComponents[1] < 1) {
         // iOS version is less than 13.1, so run your function here
         compatable = false
         setupUIForiOS12()
         } else {
         // iOS version is 13.1 or later
         print("iOS version is 13.1 or later.")
         compatable = true
         setupUI()
         }*/
    }
    
    //-----------------------------------------------------------------------------------
    // IOS 13 - 17 Version Code
    private func create12Picker() -> UIPickerView {
        let picker = UIPickerView()
        // Customize your picker as needed
        return picker
    }
    
    private func createPickerAlertController(placeholder: PlaceholderType, pickerView: UIPickerView) -> UIAlertController {
        let alertController = UIAlertController(title: "\n\n\n\n\n\n\n\n\n", message: nil, preferredStyle: .actionSheet)
        
        let pickerFrame = CGRect(x: 0, y: 0, width: alertController.view.bounds.width, height: 180)
        pickerView.frame = pickerFrame
        alertController.view.addSubview(pickerView)
        
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
        let doneAction = UIAlertAction(title: "Done", style: .default) { _ in
            // Handle the selection from the picker
            // For example, you can access the selected row using pickerView.selectedRow(inComponent:)
        }
        
        alertController.addAction(cancelAction)
        alertController.addAction(doneAction)
        
        return alertController
    }
    
    @objc private func openCityPicker() {
        let alertController = createPickerAlertController(placeholder: .city, pickerView: cityPicker)
        present(alertController, animated: true, completion: nil)
    }
    
    @objc private func openRegularityPicker() {
        let alertController = createPickerAlertController(placeholder: .regularity, pickerView: regularityPicker)
        present(alertController, animated: true, completion: nil)
    }
    
    @objc private func openDayPicker() {
        let alertController = createPickerAlertController(placeholder: .day, pickerView: dayPicker)
        present(alertController, animated: true, completion: nil)
    }
    
    @objc private func openPackagePicker() {
        let alertController = createPickerAlertController(placeholder: .package, pickerView: packagePicker)
        present(alertController, animated: true, completion: nil)
    }
    
    private func setupTextFields() {
        // Set up street number text field
        streetNumberTextField = createTextField(placeholder: "Street Number")
        // Set up street name text field
        streetNameTextField = createTextField(placeholder: "Street Name")
        // Set up city text field
        cityTextField = createPickerTextField(placeholder: "City") //createTextField(placeholder: "City")
        // Set up state text field
        stateTextField = createTextField(placeholder: "State")
        // Set up ZIP text field
        zipTextField = createTextField(placeholder: "ZIP")
        
        // Set up regularity text field
        regularityTextField = createPickerTextField(placeholder: "Regularity")
        
        // Set up day text field
        dayTextField = createPickerTextField(placeholder: "Day")
        
        // Set up package text field
        packageTextField = createPickerTextField(placeholder: "Package")
        
        submitButton = UIButton(type: .system)
        submitButton.setTitle("Submit", for: .normal)
        submitButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 16.0)
        submitButton.setTitleColor(.white, for: .normal)
        submitButton.backgroundColor = UIColor.systemBlue
        submitButton.layer.cornerRadius = 8.0
        submitButton.layer.masksToBounds = true
        submitButton.addTarget(self, action: #selector(submitButtonTapped), for: .touchUpInside)
        
        view.addSubview(submitButton)
        
        submitButton.translatesAutoresizingMaskIntoConstraints = false
        submitButton.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        submitButton.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        submitButton.widthAnchor.constraint(equalToConstant: 200.0).isActive = true
        submitButton.heightAnchor.constraint(equalToConstant: 40.0).isActive = true
        
        // Add UI elements to the view
        let stackView = UIStackView(arrangedSubviews: [streetNumberTextField, streetNameTextField, cityTextField, stateTextField, zipTextField, regularityTextField, dayTextField, packageTextField, submitButton])
        stackView.axis = .vertical
        stackView.spacing = 16
        stackView.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .white
        
        view.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: view.topAnchor, constant: 50),
            stackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            stackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16)
        ])
        
        // Initially hide the pickers
        cityTextField.inputView = UIView() // Set an empty view as the input view initially
        regularityTextField.inputView = UIView()
        dayTextField.inputView = UIView()
        packageTextField.inputView = UIView()
        
        // For iOS 12 and later, add targets for opening alert controllers
        cityTextField.addTarget(self, action: #selector(openAlertController(_:)), for: .touchDown)
        regularityTextField.addTarget(self, action: #selector(openAlertController(_:)), for: .touchDown)
        dayTextField.addTarget(self, action: #selector(openAlertController(_:)), for: .touchDown)
        packageTextField.addTarget(self, action: #selector(openAlertController(_:)), for: .touchDown)
    }
    
    @objc private func openAlertController(_ sender: UITextField) {
        let alertController = UIAlertController(title: "Select Option", message: nil, preferredStyle: .actionSheet)
        
        // Add options
        switch sender {
        case cityTextField:
            addAction(for: cityTextField, options: cityOptions, alertController: alertController)
        case regularityTextField:
            addAction(for: regularityTextField, options: regularityOptions, alertController: alertController)
        case dayTextField:
            addAction(for: dayTextField, options: dayOptions, alertController: alertController)
        case packageTextField:
            addAction(for: packageTextField, options: packageOptions, alertController: alertController)
        default:
            break
        }
        
        alertController.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        
        present(alertController, animated: true, completion: nil)
    }
    
    func addAction(for textField: UITextField, options: [String], alertController: UIAlertController) {
        for option in options {
            let action = UIAlertAction(title: option, style: .default) { _ in
                textField.text = option
                
                switch textField {
                case self.cityTextField:
                    self.selectedCity = option
                case self.regularityTextField:
                    self.selectedRegularity = option
                case self.dayTextField:
                    self.selectedDay = option
                case self.packageTextField:
                    self.selectedPackage = option
                default:
                    break
                }
            }
            alertController.addAction(action)
        }
    }
    
    private func setupUIForiOS12() {
        setupTextFields()
        setupPickersForiOS12()
        //setupSubmitButton()
    }
    
    private func setupPickersForiOS12() {
        cityPicker = create12Picker()
        regularityPicker = create12Picker()
        dayPicker = create12Picker()
        packagePicker = create12Picker()
    }
    
    private func setupSubmitButton() {
        submitButton = UIButton(type: .system)
        submitButton.setTitle("Submit", for: .normal)
        submitButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 16.0)
        submitButton.setTitleColor(.white, for: .normal)
        submitButton.backgroundColor = UIColor.systemBlue
        submitButton.layer.cornerRadius = 8.0
        submitButton.layer.masksToBounds = true
        submitButton.addTarget(self, action: #selector(submitButtonTapped), for: .touchUpInside)
        
        view.addSubview(submitButton)
        
        submitButton.translatesAutoresizingMaskIntoConstraints = false
        submitButton.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        submitButton.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        submitButton.widthAnchor.constraint(equalToConstant: 200.0).isActive = true
        submitButton.heightAnchor.constraint(equalToConstant: 40.0).isActive = true
    }
    
    //-------------------------------------------------------------------------
    
    private func setupUI() {
        // Set up street number text field
        streetNumberTextField = createTextField(placeholder: "Street Number")
        // Set up street name text field
        streetNameTextField = createTextField(placeholder: "Street Name")
        // Set up city text field
        cityTextField = createPickerTextField(placeholder: "City")
        cityPicker = createPicker()
        //cityTextField = createTextField(placeholder: "City")
        // Set up state text field
        stateTextField = createTextField(placeholder: "State")
        // Set up ZIP text field
        zipTextField = createTextField(placeholder: "ZIP")
        
        // Set up regularity text field
        regularityTextField = createPickerTextField(placeholder: "Regularity")
        regularityPicker = createPicker()
        
        // Set up day text field
        dayTextField = createPickerTextField(placeholder: "Day")
        dayPicker = createPicker()
        
        // Set up package text field
        packageTextField = createPickerTextField(placeholder: "Package")
        packagePicker = createPicker()
        
        // Set up submit button
        submitButton = UIButton(type: .system)
        submitButton.setTitle("Submit", for: .normal)
        submitButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 16.0)
        submitButton.setTitleColor(.white, for: .normal)
        submitButton.backgroundColor = UIColor.systemBlue
        submitButton.layer.cornerRadius = 8.0
        submitButton.layer.masksToBounds = true
        submitButton.addTarget(self, action: #selector(submitButtonTapped), for: .touchUpInside)
        
        // Add the button to your view hierarchy
        view.addSubview(submitButton)
        
        // Set constraints or frame for the button (adjust as needed based on your layout)
        submitButton.translatesAutoresizingMaskIntoConstraints = false
        submitButton.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        submitButton.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
        submitButton.widthAnchor.constraint(equalToConstant: 200.0).isActive = true
        submitButton.heightAnchor.constraint(equalToConstant: 40.0).isActive = true
        
        
        // Add UI elements to the view
        let stackView = UIStackView(arrangedSubviews: [streetNumberTextField, streetNameTextField, cityTextField, cityPicker, stateTextField, zipTextField, regularityTextField, regularityPicker, dayTextField, dayPicker, packageTextField, packagePicker, submitButton])
        stackView.axis = .vertical
        stackView.spacing = 16
        stackView.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .white
        
        view.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: view.topAnchor, constant: 50),
            stackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            stackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16)
        ])
        
        // Initially hide the pickers
        cityPicker.isHidden = true
        regularityPicker.isHidden = true
        dayPicker.isHidden = true
        packagePicker.isHidden = true
    }
    
    private func setGreenGradientBackground() {
        let gradientLayer = CAGradientLayer()
        gradientLayer.frame = view.bounds
        
        // Define the green gradient colors (dark to light)
        gradientLayer.colors = [
            UIColor(red: 46/255, green: 125/255, blue: 50/255, alpha: 1).cgColor,   // #2e7d32
            UIColor(red: 165/255, green: 214/255, blue: 167/255, alpha: 1).cgColor  // #a5d6a7
        ]
        
        // Direction of the gradient (top to bottom)
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 1)
        
        view.layer.insertSublayer(gradientLayer, at: 0)
    }
    
    private func createTextField(placeholder: String) -> UITextField {
        let textField = UITextField()
        textField.placeholder = placeholder
        textField.textColor = .black
        textField.backgroundColor = .white
        textField.attributedPlaceholder = NSAttributedString(string: placeholder, attributes: [NSAttributedString.Key.foregroundColor: UIColor.lightGray])
        textField.layer.borderColor = UIColor.lightGray.cgColor
        textField.layer.borderWidth = 1.0
        textField.borderStyle = .roundedRect
        return textField
    }
    
    /*func configureNavigationBar() {
     navigationController?.navigationBar.prefersLargeTitles = true
     navigationController?.navigationBar.isTranslucent = false
     navigationController?.navigationBar.backgroundColor = .mowieColor
     navigationController?.navigationBar.barStyle = .black
     navigationItem.title = "Add Job"
     navigationController?.navigationBar.barTintColor = .red
     
     navigationItem.leftBarButtonItem = UIBarButtonItem(image: UIImage(systemName: "xmark"), style: .plain, target: self, action: #selector(handleDismissal))
     }*/
    
    func configureNavigationBar() {
        navigationController?.navigationBar.prefersLargeTitles = true
        navigationController?.navigationBar.isTranslucent = false
        
        // Set light green background color
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        navigationController?.navigationBar.standardAppearance = appearance
        navigationController?.navigationBar.scrollEdgeAppearance = appearance
        navigationController?.navigationBar.compactAppearance = appearance
        
        navigationController?.navigationBar.barStyle = .black
        navigationItem.title = "Add Job"
        
        navigationItem.leftBarButtonItem = UIBarButtonItem(image: UIImage(systemName: "xmark"), style: .plain, target: self, action: #selector(handleDismissal))
    }
    
    func applyGradientToNavigationBar(_ navigationController: UINavigationController?) {
        let gradientLayer = CAGradientLayer()
        var updatedFrame = navigationController?.navigationBar.bounds ?? .zero
        updatedFrame.size.height += UIApplication.shared.statusBarFrame.height
        gradientLayer.frame = updatedFrame
        gradientLayer.colors = [
            UIColor(red: 165/255.0, green: 214/255.0, blue: 167/255.0, alpha: 1.0).cgColor,  // Light green,
            UIColor(red: 0/255.0, green: 117/255.0, blue: 0/255.0, alpha: 1.0).cgColor       // #007500
        ]
        gradientLayer.startPoint = CGPoint(x: 0, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 0)
        
        UIGraphicsBeginImageContext(gradientLayer.bounds.size)
        gradientLayer.render(in: UIGraphicsGetCurrentContext()!)
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        let appearance = UINavigationBarAppearance()
        appearance.configureWithTransparentBackground()
        appearance.backgroundImage = image
        
        navigationController?.navigationBar.standardAppearance = appearance
        navigationController?.navigationBar.scrollEdgeAppearance = appearance
    }
    
    private func createPickerTextField(placeholder: String) -> UITextField {
        let textField = createTextField(placeholder: placeholder)
        textField.inputView = UIView()  // Set an empty view as the input view initially
        textField.tintColor = .clear   // Hide the cursor
        textField.addTarget(self, action: #selector(pickerTextFieldTapped(_:)), for: .allEditingEvents)
        return textField
    }
    
    func createPicker() -> UIPickerView {
        let picker = UIPickerView()
        picker.dataSource = self
        picker.delegate = self
        
        return picker
    }
    
    // MARK: - Selectors
    
    @objc func handleDismissal() {
        delegate?.didAddJob()
        self.dismiss(animated: true, completion: nil)
    }
    
    @objc private func submitButtonTapped() {
        submitToFirebase()
    }
    
    @objc private func pickerTextFieldTapped(_ sender: UITextField) {
        // Hide the previous active picker
        activePicker?.isHidden = true
        
        // Show the corresponding picker when the text field is tapped
        switch sender {
        case cityTextField:
            activePicker = cityPicker
            cityPicker.isHidden = false
        case regularityTextField:
            activePicker = regularityPicker
            regularityPicker.isHidden = false
        case dayTextField:
            activePicker = dayPicker
            dayPicker.isHidden = false
        case packageTextField:
            activePicker = packagePicker
            packagePicker.isHidden = false
        default:
            break
        }
    }
    
    func isValidStreetNumber(_ streetNumber: String) -> Bool {
        let trimmedStreetNumber = streetNumber.trimmingCharacters(in: .whitespaces)
        let numberRegex = "^[0-9]+$"
        let numberPredicate = NSPredicate(format: "SELF MATCHES %@", numberRegex)
        return numberPredicate.evaluate(with: streetNumber)
    }
    
    func isValidStreetName(_ streetName: String) -> Bool {
        let trimmedStreetName = streetName.trimmingCharacters(in: .whitespaces)
        let nameRegex = "^[a-zA-Z0-9]+(?:\\s[a-zA-Z0-9]+)?\\.?$"
        let namePredicate = NSPredicate(format: "SELF MATCHES %@", nameRegex)
        return namePredicate.evaluate(with: streetName)
    }
    
    func isValidCity(_ city: String) -> Bool {
        let trimmedCity = city.trimmingCharacters(in: .whitespaces)
        let cityRegex = "^[a-zA-Z\\s]+$"
        let cityPredicate = NSPredicate(format: "SELF MATCHES %@", cityRegex)
        return cityPredicate.evaluate(with: trimmedCity)
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
            adjustedFee = true;
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
            adjustedFee = true;
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
            adjustedFee = true;
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
            adjustedFee = true;
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
            adjustedFee = true;
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
            adjustedFee = true;
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
        case "Grass Lot - Blow, Mow, Whack $130":
            if (frequency == "One Time")
            {
                price = "000036";
            }
            else if (frequency == "Weekly")
            {
                price = "000037";
            }
            else if (frequency == "Bi-Weekly")
            {
                price = "000038";
            }
            else if (frequency == "Monthly")
            {
                price = "000039";
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
            adjustedFee = true;
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
            adjustedFee = true;
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
            adjustedFee = true;
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
            adjustedFee = true;
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
            adjustedFee = true;
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
            adjustedFee = true;
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
    
    // Function to show an alert
    func showAlert(message: String, completion: (() -> Void)? = nil) {
        let alertController = UIAlertController(title: "Alert", message: message, preferredStyle: .alert)
        let okAction = UIAlertAction(title: "OK", style: .default) { _ in
            completion?()
        }
        alertController.addAction(okAction)
        present(alertController, animated: true, completion: nil)
    }
    
    private func submitToFirebase() {
        guard let streetNumber = streetNumberTextField.text,
              let streetName = streetNameTextField.text,
              //let city = cityTextField.text,
              let state = stateTextField.text,
              let zip = zipTextField.text else {
            return
        }
        
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        var city = ""
        var package = ""
        var frequency = ""
        var day = ""
        
        if(compatable) {
            city = cityOptions[cityPicker.selectedRow(inComponent: 0)]
            package = packageOptions[packagePicker.selectedRow(inComponent: 0)]
            frequency = regularityOptions[regularityPicker.selectedRow(inComponent: 0)]
            day = dayOptions[dayPicker.selectedRow(inComponent: 0)]
        } else {
            city = selectedCity
            package = selectedPackage
            frequency = selectedRegularity
            day = selectedDay
        }
        
        if isValidStreetNumber(streetNumber) {
            print("Valid street number.")
        } else {
            print("Invalid street number.")
            showAlert(message: "Invalid street number")
            return
        }
        
        if isValidStreetName(streetName) {
            print("Valid street name.")
        } else {
            print("Invalid street name.")
            showAlert(message: "Invalid street name")
            return
        }
        
        /*if isValidCity(city.lowercased()) {
         print("Valid city.")
         if isCityNotEligible(enteredCity: city.lowercased()) {
         print("\(city) is not an eligible city.")
         showAlert(message: "\(city) is not an eligible city.")
         return
         }
         } else {
         print("Invalid city.")
         showAlert(message: "Invalid city")
         return
         }*/
        
        if isValidState(state) {
            print("Valid state abbreviation.")
        } else {
            print("Invalid state abbreviation.")
            showAlert(message: "Invalid state abbreviation")
            return
        }
        
        if isValidZipCode(zip) {
            print("Valid zip code.")
        } else {
            print("Invalid zip code.")
            showAlert(message: "Invalid zip code")
            return
        }
        
        if package == "Garbage Pickup $375" && frequency != "One Time" {
            showAlert(message: "Sorry, this package doesn't have a subscription. Please select One Time.")
            return
        } else if packageOptions[packagePicker.selectedRow(inComponent: 0)].isEmpty && package == "" {
            showAlert(message: "Please select a Package")
            return
        }
        
        if (package == "Yard Cleanup $155" || package == "Yard Cleanup $255" || package == "Yard Cleanup $355") && frequency != "One Time" {
            showAlert(message: "Sorry, this package doesn't have a subscription. Please select One Time.")
            return
        }
        
        if (package == "Leaf Cleanup $150" || package == "Leaf Cleanup $200" || package == "Leaf Cleanup $300") && frequency != "One Time" {
            showAlert(message: "Sorry, this package doesn't have a subscription. Please select One Time.")
            return
        }
        
        if (package == "Edging $45" || package == "Bagging Fee $25" || package == "Bush Trimming Starting at $45") && frequency != "One Time" {
            showAlert(message: "Sorry, this package doesn't have a subscription. Please select One Time.")
            return
        }
        
        if (city.isEmpty)
        {
            showAlert(message: "Please select City")
            return
        }
        
        if (frequency.isEmpty)
        {
            showAlert(message: "Please select how often you would like to be serviced")
            return
        }
        
        if (day.isEmpty)
        {
            showAlert(message: "Please select a Day you would like to be serviced")
            return
        }
        
        var jobuid = ""
        
        // Initializing an empty dictionary
        var jobDictionary = [String: Any]()
        
        // Setting values in the dictionary
        jobDictionary["streetname"] = streetName
        jobDictionary["streetnumber"] = streetNumber
        jobDictionary["stateaddress"] = state
        jobDictionary["cityaddress"] = city
        jobDictionary["zipcode"] = zip
        jobDictionary["yardsize"] = size
        jobDictionary["userid"] = uid
        jobDictionary["subid"] = "Waiting for Payment"
        jobDictionary["proid"] = "Not Assigned"
        jobDictionary["rating"] = "Not Assigned"
        jobDictionary["profilephotourl"] = "Not Assigned"
        jobDictionary["package"] = package
        jobDictionary["note"] = "No not recorded"
        jobDictionary["jobid"] = "Not Assigned"
        jobDictionary["frequency"] = frequency
        jobDictionary["day"] = day
        jobDictionary["carphotourl"] = "Not Assigned"
        jobDictionary["status"] = "Waiting on Payment"
        jobDictionary["jobstate"] = "Waiting on Payment"
        jobDictionary["customerid"] = user.customerid
        print(jobDictionary)
        let job = Job(uid: uid, dictionary: jobDictionary)
        Service.shared.addJob(job) { result in
            switch result {
            case .success(let ref):
                print("Data successfully pushed to Firebase with RID: \(ref.key ?? "unknown key")")
                jobuid = ref.key!
            case .failure(let error):
                print("Error: \(error.localizedDescription)")
            }
        }
        
        let serverValues = self.getServerValues(package: package, frequency: frequency)
        
        let price = serverValues.0
        let amount = serverValues.1
        let name = serverValues.2
        let des = serverValues.3
        let cusid = self.user.customerid
        
        // Print the values
        print("Price: \(price)")
        print("Amount: \(amount)")
        print("Name: \(name)")
        print("Description: \(des)")
        print("Freq: \(frequency)")
        print("Customer: \(cusid)")
        print("Job: \(jobuid)")
        
        let feePercentage = self.adjustedFee ? 0.25 : 0.33333
        var fees = ""
        
        if let amountNum = Double(amount) {
            var result = amountNum * feePercentage
            
            print("Parse Value: \(amountNum)")
            print("Result: \(result)")
            
            result = round(result * 100) / 100 // Round to 2 places
            
            print("Rounded Result: \(result)")
            
            fees = String(format: "%.2f", result)
            print("Fees: \(fees)")
        } else {
            print("Invalid amount")
        }
        
        let url = "https://mowie-service-server.onrender.com/product"
        let enCusId = String(cusid.dropFirst(4))
        
        var postData = [
            "pee": price,
            "ant": amount,
            "dex": des,
            "nom": name,
            "feq": frequency,
            "cve": enCusId,
            "jzd": jobuid,
            "fxe": fees
        ]
        
        let queryString = self.getQueryString(postData)
        let htmlContent = "\(url)?\(queryString)"
        
        print("HTML URI: \(htmlContent)")
        
        self.fetchEphemeralKey(customerId: cusid) { ephemeralKey in
            // Use the ephemeral key here (e.g., configure Stripe SDK)
            print("Received ephemeral key: \(ephemeralKey)")
            
            self.fetchPaymentIntentClientSecret(name: name, description: des, price: amount, productid: price, jobId: jobuid, frequency: frequency, customerId: cusid) { clientSecret in
                // Now you have the clientSecret, pass it to Stripe PaymentSheet
                print("Received client secret: \(clientSecret)")
                
                self.clientSecret = clientSecret
                self.customerId = cusid
                self.ephemeralKey = ephemeralKey
                self.shouldPresentPaymentSheet = true
                print("Add Job - Values are set")

                // Check if view is on screen now
                if self.isViewLoaded && self.view.window != nil && !self.hasPresentedPaymentSheet {
                    self.hasPresentedPaymentSheet = true
                    self.presentPaymentSheet()
                } else {
                    // View isn't on screen yet — fall back to trigger in viewDidAppear
                    self.shouldPresentPaymentSheet = true
                }

            }
        }
        
        // Find the top-most visible view controller
        //            if var topController = UIApplication.shared.keyWindow?.rootViewController {
        //                while let presentedViewController = topController.presentedViewController {
        //                    topController = presentedViewController
        //                }
        //                // Present ApiController from the top-most visible view controller
        //                topController.present(payment, animated: true, completion: nil)
        //            }
    }
    
    func presentPaymentSheet() {
        guard let clientSecret = clientSecret,
              let customerId = customerId,
              let ephemeralKey = ephemeralKey else {
            print("Missing Stripe values")
            return
        }
        
        DispatchQueue.main.async {
            print("Add Job -Running Payment Sheet configuration")
            var config = PaymentSheet.Configuration()
            config.merchantDisplayName = "Mowie Inc."
            config.customer = .init(id: customerId, ephemeralKeySecret: ephemeralKey)
            
            let paymentSheet = PaymentSheet(paymentIntentClientSecret: clientSecret, configuration: config)
            
            paymentSheet.present(from: self) { result in
                switch result {
                case .completed:
                    self.showAlert(message: "Payment successful. Your job has been posted!") {
                        self.dismiss(animated: true) {
                            self.delegate?.didAddJob()
                        }
                    }
                case .canceled:
                    self.dismiss(animated: true) {
                        self.showAlert(message: "Payment canceled.")
                        self.delegate?.didAddJob()
                    }
                case .failed(let error):
                    self.dismiss(animated: true) {
                        self.showAlert(message: "Payment failed: \(error.localizedDescription)")
                    }
                }
            }
        }
    }
    
    
    func fetchEphemeralKey(customerId: String, completion: @escaping (String) -> Void) {
        let url = URL(string: "https://mowie-service-server.onrender.com/create-ephemeral-key")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["customerId": customerId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async {
                    print("Error: \(error.localizedDescription)")
                    // Show error to user if desired
                }
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let ephemeralKeySecret = json["ephemeralKeySecret"] as? String else {
                DispatchQueue.main.async {
                    print("Failed to retrieve ephemeral key")
                    // Show alert if desired
                }
                return
            }
            
            DispatchQueue.main.async {
                completion(ephemeralKeySecret)
            }
        }.resume()
    }
    
    func fetchPaymentIntentClientSecret(
        name: String,
        description: String,
        price: String,
        productid: String,
        jobId: String,
        frequency: String,
        customerId: String,
        completion: @escaping (String) -> Void
    ) {
        guard let url = URL(string: "https://mowie-service-server.onrender.com/payment-sheet") else { return }
        
        let requestBody: [String: Any] = [
            "jobid": jobId,
            "name": name,
            "description": description,
            "amount": price,
            "productid": productid,
            "frequency": frequency,
            "customerid": customerId
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        } catch {
            print("Failed to encode JSON: \(error)")
            return
        }
        
        print("Fetching payment intent...")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error fetching payment intent: \(error)")
                DispatchQueue.main.async {
                    // Show error to user if needed
                }
                return
            }
            
            guard let data = data else {
                print("No data received from payment intent request.")
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let clientSecret = json["client_secret"] as? String {
                    print("PaymentIntentResponse: \(json)")
                    DispatchQueue.main.async {
                        completion(clientSecret)
                    }
                } else {
                    print("Invalid response format")
                }
            } catch {
                print("Failed to parse payment intent response: \(error)")
            }
        }.resume()
    }
}
    
    extension AddJobController: UIPickerViewDataSource, UIPickerViewDelegate {
        func numberOfComponents(in pickerView: UIPickerView) -> Int {
            return 1
        }
        
        func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
            switch pickerView {
            case cityPicker:
                return cityOptions.count
            case regularityPicker:
                return regularityOptions.count
            case dayPicker:
                return dayOptions.count
            case packagePicker:
                return packageOptions.count
            default:
                return 0
            }
        }
        
        func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
            switch pickerView {
            case cityPicker:
                return cityOptions[row]
            case regularityPicker:
                return regularityOptions[row]
            case dayPicker:
                return dayOptions[row]
            case packagePicker:
                return packageOptions[row]
            default:
                return nil
            }
        }
        
        func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
            // Update the text field when an option is selected
            switch pickerView {
            case cityPicker:
                cityTextField.text = cityOptions[row]
            case regularityPicker:
                regularityTextField.text = regularityOptions[row]
            case dayPicker:
                dayTextField.text = dayOptions[row]
            case packagePicker:
                packageTextField.text = packageOptions[row]
            default:
                break
            }
            
            // Hide the picker after selection
            activePicker?.isHidden = true
        }
    }
