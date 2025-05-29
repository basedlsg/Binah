//
//  DumpsterRequestController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 4/30/25.
//

import UIKit
import Firebase
import FirebaseAuth
import Stripe
import StripePaymentSheet

class DumpsterRequestController: UIViewController, UITextFieldDelegate {

    private let user: User
    private let scrollView = UIScrollView()

    private let sizes = ["10Yard - 2 tons ($350)", "20Yard - 3 tons ($400)", "30Yard - 4 tons ($450)", "40Yard - 5 tons ($550)"]
    private var selectedSizeIndex = 0
    
    private var clientSecret: String?
    private var customerId: String?
    private var ephemeralKey: String?

    private var shouldPresentPaymentSheet = false
    private var hasPresentedPaymentSheet = false

    init(user: User) {
        self.user = user
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    private let container = UIStackView()
    private let nameField = CustomInputField(icon: UIImage(systemName: "person.fill"), placeholder: "Full Name")
    private let addressField = CustomInputField(icon: UIImage(systemName: "house.fill"), placeholder: "Service Address")
    private let phoneField = CustomInputField(icon: UIImage(systemName: "phone.fill"), placeholder: "Phone Number")
    private let sizeSelector = UISegmentedControl(items: ["10Y", "20Y", "30Y", "40Y"])
    private let sizeDescriptionLabel = UILabel()
    private let submitButton = UIButton()

    override func viewDidLoad() {
        super.viewDidLoad()
        
        nameField.delegate = self
        addressField.delegate = self
        phoneField.delegate = self
        
        view.backgroundColor = .systemGroupedBackground
        configureLayout()
        populateUserData()
        
            // Add this to dismiss keyboard on tap
            let tap = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
            tap.cancelsTouchesInView = false
            view.addGestureRecognizer(tap)
        
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            image: UIImage(systemName: "xmark"),
            style: .plain,
            target: self,
            action: #selector(handleClose)
        )
    }

    private func configureLayout() {
        title = "Dumpster Request"
        navigationController?.navigationBar.prefersLargeTitles = true

        // Setup scrollView
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scrollView)

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        // Setup container
        container.axis = .vertical
        container.spacing = 20
        container.translatesAutoresizingMaskIntoConstraints = false
        container.alignment = .fill

        // Configure size selector
        sizeSelector.selectedSegmentIndex = selectedSizeIndex
        sizeSelector.addTarget(self, action: #selector(sizeChanged), for: .valueChanged)
        sizeSelector.backgroundColor = .secondarySystemBackground
        sizeSelector.layer.cornerRadius = 8
        sizeSelector.clipsToBounds = true

        sizeDescriptionLabel.text = sizes[selectedSizeIndex]
        sizeDescriptionLabel.font = .systemFont(ofSize: 14, weight: .medium)
        sizeDescriptionLabel.textAlignment = .center

        configureSubmitButton()

        // Add all views to stack
        container.addArrangedSubview(createCardView(title: "Dumpster Size", views: [sizeSelector, sizeDescriptionLabel]))
        container.addArrangedSubview(createCardView(title: "Contact Info", views: [nameField, addressField, phoneField]))
        container.addArrangedSubview(submitButton)

        scrollView.addSubview(container)

        NSLayoutConstraint.activate([
            container.topAnchor.constraint(equalTo: scrollView.topAnchor, constant: 20),
            container.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor, constant: 20),
            container.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor, constant: -20),
            container.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor, constant: -20),
            container.widthAnchor.constraint(equalTo: scrollView.widthAnchor, constant: -40)
        ])
    }


    private func configureSubmitButton() {
        submitButton.setTitle("Request Now", for: .normal)
        submitButton.setTitleColor(.white, for: .normal)
        submitButton.titleLabel?.font = .boldSystemFont(ofSize: 18)
        submitButton.layer.cornerRadius = 12
        submitButton.clipsToBounds = true
        submitButton.addTarget(self, action: #selector(handleSubmit), for: .touchUpInside)

        // Gradient background
        let gradientLayer = CAGradientLayer()
        gradientLayer.colors = [UIColor.systemGreen.cgColor, UIColor.systemTeal.cgColor]
        gradientLayer.frame = CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width - 40, height: 50)
        gradientLayer.cornerRadius = 12
        let image = UIGraphicsImageRenderer(size: gradientLayer.frame.size).image { ctx in
            gradientLayer.render(in: ctx.cgContext)
        }
        submitButton.setBackgroundImage(image, for: .normal)
        submitButton.heightAnchor.constraint(equalToConstant: 50).isActive = true
    }
    
    func textFieldDidBeginEditing(_ textField: UITextField) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            let convertedFrame = textField.convert(textField.bounds, to: self.scrollView)
            self.scrollView.scrollRectToVisible(convertedFrame.insetBy(dx: 0, dy: -40), animated: true)
        }
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        return true
    }
    
    func fetchEphemeralKey(customerId: String, completion: @escaping (String) -> Void) {
        let url = URL(string: "https://mowie-service-server.onrender.com/create-ephemeral-key")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["customerId": user.customerid]
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
        guard let url = URL(string: "https://mowie-service-server.onrender.com/dumpster-payment-sheet") else { return }
        
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

    func saveDumpsterJobToFirebase(
        name: String,
        address: String,
        phone: String,
        size: String,
        timestamp: String,
        customerid: String,
        rentaldays: String,
        city: String,
        amount: String,
        completion: @escaping (String?) -> Void
    ) {
        let job = Dumpster(
            name: name,
            address: address,
            phone: phone,
            size: size,
            timestamp: timestamp,
            customerid: customerid,
            rentaldays: rentaldays,
            city: city,
            amount: amount
        )

        Service.shared.addDumpsterJob(job) { result in
            switch result {
            case .success(let jobId):
                print("Saved dumpster job with ID: \(jobId)")
                completion(jobId)
            case .failure(let error):
                print("Failed to save dumpster job: \(error.localizedDescription)")
                completion(nil)
            }
        }
    }


    private func populateUserData() {
        nameField.text = "\(user.firstname) \(user.lastname)"
        phoneField.text = user.phonenumber
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
    
    @objc private func dismissKeyboard() {
        view.endEditing(true)
    }

    @objc private func sizeChanged() {
        selectedSizeIndex = sizeSelector.selectedSegmentIndex
        sizeDescriptionLabel.text = sizes[selectedSizeIndex]
    }

    @objc private func handleSubmit() {
        guard let name = nameField.text, !name.isEmpty,
              let address = addressField.text, !address.isEmpty,
              let phone = phoneField.text, !phone.isEmpty else {
            let alert = UIAlertController(title: "Missing Info", message: "Please fill in all required fields.", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: true)
            return
        }

        let selectedSize = sizes[selectedSizeIndex]
        let frequency = "One Time"
        let cusid = user.customerid
        var productName = ""
        var dumpsterDescription = ""
        var amount = ""
        var productId = ""

        switch selectedSizeIndex {
        case 0:
            productName = "10 Yard Dumpster"
            dumpsterDescription = "2 Tonnage"
            amount = "350"
            productId = "000040"
        case 1:
            productName = "20 Yard Dumpster"
            dumpsterDescription = "3 Tonnage"
            amount = "400"
            productId = "000041"
        case 2:
            productName = "30 Yard Dumpster"
            dumpsterDescription = "4 Tonnage"
            amount = "450"
            productId = "000042"
        case 3:
            productName = "40 Yard Dumpster"
            dumpsterDescription = "5 Tonnage"
            amount = "550"
            productId = "000043"
        default:
            productName = "Unknown"
            dumpsterDescription = "N/A"
            amount = "0"
            productId = "prod_default"
        }

        let message = """
        You selected: \(productName)
        Description: \(dumpsterDescription)
        Price: $\(amount)
        
        To complete your rental, you will need to submit a photo ID.

        Do you wish to continue?
        """

        let confirmationAlert = UIAlertController(title: "Confirm Rental", message: message, preferredStyle: .alert)
        confirmationAlert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        confirmationAlert.addAction(UIAlertAction(title: "Accept", style: .default) { _ in
            self.saveDumpsterJobToFirebase(
                name: name,
                address: address,
                phone: phone,
                size: selectedSize,
                timestamp: String(Int(Date().timeIntervalSince1970)),
                customerid: self.user.customerid,
                rentaldays: "7",
                city: "Detroit",
                amount: amount
            ) { jobId in
                guard let jobId = jobId else {
                    self.showAlert(message: "Failed to save dumpster job.")
                    return
                }

                print("🎉 Job ID: \(jobId)")

                self.fetchEphemeralKey(customerId: cusid) { ephemeralKey in
                    self.fetchPaymentIntentClientSecret(
                        name: productName,
                        description: dumpsterDescription,
                        price: amount,
                        productid: productId,
                        jobId: jobId,
                        frequency: frequency,
                        customerId: cusid
                    ) { clientSecret in
                        self.clientSecret = clientSecret
                        self.customerId = cusid
                        self.ephemeralKey = ephemeralKey

                        if self.isViewLoaded, self.view.window != nil, !self.hasPresentedPaymentSheet {
                            self.hasPresentedPaymentSheet = true
                            self.presentPaymentSheet()
                        } else {
                            self.shouldPresentPaymentSheet = true
                        }
                    }
                }
            }
        })

        present(confirmationAlert, animated: true)
    }
    
    @objc private func handleClose() {
        dismiss(animated: true, completion: nil)
    }
    
    func presentPaymentSheet() {
        guard let clientSecret = clientSecret,
              let customerId = customerId,
              let ephemeralKey = ephemeralKey else {
            print("Missing Stripe values")
            return
        }

        DispatchQueue.main.async {
            var config = PaymentSheet.Configuration()
            config.merchantDisplayName = "Mowie Inc."
            config.customer = .init(id: customerId, ephemeralKeySecret: ephemeralKey)

            let paymentSheet = PaymentSheet(paymentIntentClientSecret: clientSecret, configuration: config)

            paymentSheet.present(from: self) { result in
                switch result {
                case .completed:
                    self.showAlert(message: "Payment successful!") {
                        // Call phone number first
                        if let phoneURL = URL(string: "tel://3136073620"), UIApplication.shared.canOpenURL(phoneURL) {
                            UIApplication.shared.open(phoneURL, options: [:], completionHandler: nil)
                        }

                        // Then dismiss the controller
                        self.dismiss(animated: true)
                    }
                case .canceled:
                    self.showAlert(message: "Payment canceled.")
                case .failed(let error):
                    self.showAlert(message: "Payment failed: \(error.localizedDescription)")
                }
            }
        }
    }


    private func createCardView(title: String, views: [UIView]) -> UIView {
        let titleLabel = UILabel()
        titleLabel.text = title
        titleLabel.font = .systemFont(ofSize: 16, weight: .semibold)

        let stack = UIStackView(arrangedSubviews: [titleLabel] + views)
        stack.axis = .vertical
        stack.spacing = 10

        let card = UIView()
        card.backgroundColor = .white
        card.layer.cornerRadius = 12
        card.layer.shadowColor = UIColor.black.cgColor
        card.layer.shadowOpacity = 0.05
        card.layer.shadowOffset = CGSize(width: 0, height: 2)
        card.layer.shadowRadius = 5
        card.translatesAutoresizingMaskIntoConstraints = false

        card.addSubview(stack)
        stack.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor, constant: 16),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -16)
        ])
        return card
    }
}

class CustomInputField: UITextField {
    init(icon: UIImage?, placeholder: String) {
        super.init(frame: .zero)
        self.placeholder = placeholder
        self.borderStyle = .roundedRect
        self.heightAnchor.constraint(equalToConstant: 44).isActive = true
        self.leftViewMode = .always
        if let icon = icon {
            let imageView = UIImageView(image: icon)
            imageView.tintColor = .gray
            imageView.contentMode = .scaleAspectFit
            imageView.frame = CGRect(x: 0, y: 0, width: 24, height: 24)
            self.leftView = imageView
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
