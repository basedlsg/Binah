//
//  LoginController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 11/10/23.
//

import Foundation
import UIKit
import Firebase
import FirebaseAuth
import AVFoundation

class LoginController: UIViewController, UITextFieldDelegate {
    
    // MARK: - Properties
    
    // Video background properties
    private var player: AVPlayer?
    private var playerLayer: AVPlayerLayer?
    private var videoOverlay: UIView?
    
    // Status bar style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    private let logoContainer: UIView = {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false
        container.layer.cornerRadius = 40 // 80x80 = 40 radius
        container.clipsToBounds = true
        
        // Add gradient background
        let gradientLayer = CAGradientLayer()
        gradientLayer.colors = [
            UIColor.gradientDark.cgColor,
            UIColor.gradientMid.cgColor,
            UIColor.accentGreen.cgColor
        ]
        gradientLayer.locations = [0.0, 0.7, 1.0]
        gradientLayer.startPoint = CGPoint(x: 0, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 1)
        gradientLayer.frame = CGRect(x: 0, y: 0, width: 80, height: 80)
        container.layer.addSublayer(gradientLayer)
        
        // Add logo text
        let logoLabel = UILabel()
        logoLabel.text = "M"
        logoLabel.font = UIFont(name: "Avenir-Heavy", size: 32) ?? UIFont.boldSystemFont(ofSize: 32)
        logoLabel.textColor = .white
        logoLabel.textAlignment = .center
        logoLabel.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(logoLabel)
        
        NSLayoutConstraint.activate([
            logoLabel.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            logoLabel.centerYAnchor.constraint(equalTo: container.centerYAnchor)
        ])
        
        return container
    }()
    
    private lazy var emailContainerView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        
        view.addSubview(emailTextField)
        emailTextField.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            emailTextField.topAnchor.constraint(equalTo: view.topAnchor),
            emailTextField.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            emailTextField.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            emailTextField.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        return view
    }()
    
    private lazy var passwordContainerView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        view.heightAnchor.constraint(equalToConstant: 50).isActive = true
        
        view.addSubview(passwordTextField)
        passwordTextField.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            passwordTextField.topAnchor.constraint(equalTo: view.topAnchor),
            passwordTextField.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            passwordTextField.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            passwordTextField.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        return view
    }()
    
    private let emailTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Email"
        tf.backgroundColor = UIColor.clear
        tf.textColor = .white
        tf.tintColor = UIColor.accentGreen
        tf.layer.cornerRadius = 16
        tf.layer.borderWidth = 1
        tf.layer.borderColor = UIColor.glassBorder.cgColor
        tf.font = UIFont.systemFont(ofSize: 16)
        tf.keyboardAppearance = .dark
        tf.attributedPlaceholder = NSAttributedString(
            string: "Email",
            attributes: [NSAttributedString.Key.foregroundColor: UIColor(white: 1.0, alpha: 0.5)]
        )
        
        // Add glass background
        tf.backgroundColor = UIColor.glassEffect
        
        // Add padding
        let paddingView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: tf.frame.height))
        tf.leftView = paddingView
        tf.leftViewMode = .always
        tf.rightView = paddingView
        tf.rightViewMode = .always
        
        return tf
    }()
    
    private let passwordTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Password"
        tf.backgroundColor = UIColor.clear
        tf.textColor = .white
        tf.tintColor = UIColor.accentGreen
        tf.layer.cornerRadius = 16
        tf.layer.borderWidth = 1
        tf.layer.borderColor = UIColor.glassBorder.cgColor
        tf.font = UIFont.systemFont(ofSize: 16)
        tf.keyboardAppearance = .dark
        tf.isSecureTextEntry = true
        tf.attributedPlaceholder = NSAttributedString(
            string: "Password",
            attributes: [NSAttributedString.Key.foregroundColor: UIColor(white: 1.0, alpha: 0.5)]
        )
        tf.passwordRules = UITextInputPasswordRules(descriptor: "required: upper; required: digit; max-consecutive: 2; minlength: 8;")
        
        // Add glass background
        tf.backgroundColor = UIColor.glassEffect
        
        // Add padding
        let paddingView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: tf.frame.height))
        tf.leftView = paddingView
        tf.leftViewMode = .always
        tf.rightView = paddingView
        tf.rightViewMode = .always
        
        return tf
    }()
    
    private let loginButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("LOG IN", for: .normal)
        button.titleLabel?.font = UIFont.boldSystemFont(ofSize: 18)
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 16
        button.clipsToBounds = true
        
        // Add gradient background
        let gradientLayer = CAGradientLayer()
        gradientLayer.colors = [
            UIColor.accentGreen.cgColor,
            UIColor.accentGreen.withAlphaComponent(0.8).cgColor
        ]
        gradientLayer.locations = [0.0, 1.0]
        gradientLayer.startPoint = CGPoint(x: 0, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 1)
        button.layer.insertSublayer(gradientLayer, at: 0)
        
        button.addTarget(self, action: #selector(handleLogin), for: .touchUpInside)
        
        // Add performance-aware press animation
        button.addPerformanceAwarePressAnimation()
        
        return button
    }()
    
    let dontHaveAccountButton: UIButton = {
        let button = UIButton(type: .system)
        
        let attributedTitle = NSMutableAttributedString(string: "Don't have an account? ", attributes:
                                                            [NSAttributedString.Key.font: UIFont.systemFont(ofSize: 16), NSAttributedString.Key.foregroundColor: UIColor.white])
        attributedTitle.append(NSAttributedString(string: "Sign Up", attributes: [NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 16), NSAttributedString.Key.foregroundColor: UIColor.accentGreen]))
        button.addTarget(self, action: #selector(handleShowSignUp), for: .touchUpInside)
        button.setAttributedTitle(attributedTitle, for: .normal)
        
        // Add performance-aware press animation
        button.addPerformanceAwarePressAnimation()
        
        return button
    }()
    
    let forgotPasswordButton: UIButton = {
        let button = UIButton(type: .system)
        
        let attributedTitle = NSMutableAttributedString(string: "Forgot Password? ", attributes:
                                                            [NSAttributedString.Key.font: UIFont.systemFont(ofSize: 16), NSAttributedString.Key.foregroundColor: UIColor.white])
        attributedTitle.append(NSAttributedString(string: "Reset Password", attributes: [NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 16), NSAttributedString.Key.foregroundColor: UIColor.accentGreen]))
        button.addTarget(self, action: #selector(handleForgotPassword), for: .touchUpInside)
        button.setAttributedTitle(attributedTitle, for: .normal)
        
        // Add performance-aware press animation
        button.addPerformanceAwarePressAnimation()
        
        return button
    }()
    
    // MARK: - Lifecycle
    
    deinit {
        // Clean up video player and observers
        player?.pause()
        player = nil
        playerLayer?.removeFromSuperlayer()
        playerLayer = nil
        NotificationCenter.default.removeObserver(self)
        print("🧹 LoginController cleaned up")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Add a "Done" button to the keyboard
        addDoneButtonTo(emailTextField)
        addDoneButtonTo(passwordTextField)
        
        // Set the delegate for text fields
        emailTextField.delegate = self
        passwordTextField.delegate = self
        
        // Add focus animations
        emailTextField.addTarget(self, action: #selector(textFieldFocusChanged(_:)), for: .editingDidBegin)
        emailTextField.addTarget(self, action: #selector(textFieldFocusChanged(_:)), for: .editingDidEnd)
        passwordTextField.addTarget(self, action: #selector(textFieldFocusChanged(_:)), for: .editingDidBegin)
        passwordTextField.addTarget(self, action: #selector(textFieldFocusChanged(_:)), for: .editingDidEnd)
        
        configureUI()
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        
        // Update video layer frame
        playerLayer?.frame = view.bounds
        
        // Update logo gradient frame
        if let logoGradientLayer = logoContainer.layer.sublayers?.first(where: { $0 is CAGradientLayer }) as? CAGradientLayer {
            logoGradientLayer.frame = logoContainer.bounds
        }
        
        // Update button gradient frame
        if let buttonGradientLayer = loginButton.layer.sublayers?.first(where: { $0 is CAGradientLayer }) as? CAGradientLayer {
            buttonGradientLayer.frame = loginButton.bounds
        }
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        // Animate form appearance
        if let formContainer = view.subviews.first(where: { $0.layer.cornerRadius == 20 }) {
            formContainer.animateFromBottom(duration: 0.4, delay: 0.1, distance: 30)
        }
        
        // Add logo float animation with performance check
        startLogoFloatAnimation()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        
        // Stop logo animation to prevent memory leaks
        stopLogoFloatAnimation()
        
        // Pause video to save battery and memory
        player?.pause()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Resume video when returning to screen
        player?.play()
    }
    
    private func startLogoFloatAnimation() {
        guard PerformanceManager.shared.shouldAnimate() else {
            print("🎬 Skipping logo float animation due to performance constraints")
            return
        }
        
        print("🎬 Starting logo float animation")
        
        // Gentle floating animation (3s duration, 5px movement)
        PerformanceManager.shared.animateSpring(
            duration: 3.0,
            delay: 0.5,
            damping: 0.9,
            velocity: 0.2,
            options: [.repeat, .autoreverse, .allowUserInteraction],
            animations: {
                self.logoContainer.transform = CGAffineTransform(translationX: 0, y: -5)
            },
            completion: nil
        )
    }
    
    private func stopLogoFloatAnimation() {
        // Remove all animations from logo container
        logoContainer.layer.removeAllAnimations()
        logoContainer.transform = .identity
        print("🎬 Stopped logo float animation")
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
    
    @objc func textFieldFocusChanged(_ textField: UITextField) {
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseInOut, animations: {
            if textField.isFirstResponder {
                textField.layer.borderColor = UIColor.primaryGreen.cgColor
                textField.layer.borderWidth = 2.0
                textField.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.6)
                
                // Add green glow
                textField.layer.shadowColor = UIColor.primaryGreen.cgColor
                textField.layer.shadowOffset = CGSize(width: 0, height: 0)
                textField.layer.shadowRadius = 10
                textField.layer.shadowOpacity = 0.6
            } else {
                textField.layer.borderColor = UIColor.clear.cgColor
                textField.layer.borderWidth = 0
                textField.backgroundColor = UIColor(red: 0, green: 0, blue: 0, alpha: 0.4)
                
                // Remove glow
                textField.layer.shadowOpacity = 0
            }
        })
    }
    
    // MARK: - Selectors
    
    @objc func handleLogin() {
        // Add haptic feedback
        loginButton.addHapticFeedback(style: .medium)
        
        guard let email = emailTextField.text else { return }
        guard let password = passwordTextField.text else { return }
        
        if isValidEmail(email) {
            print("Email is valid.")
        } else {
            print("Email is not valid.")
            showAlert(message: "Please enter a valid Email")
        }
        
        if isValidPassword(password) {
            print("Password is valid.")
        } else {
            print("Password is not valid.")
            showAlert(message: "Password is not valid. Please follow the password criteria.")
        }
        
        Auth.auth().signIn(withEmail: email, password: password) { (result, error) in
            if let error = error {
                print("DEBUG: Failed to log user in with error \(error.localizedDescription)")
                self.showAlert(message: "\(error.localizedDescription)")
                
                return
            }
            // Add glass transition overlay
            self.view.addGlassTransitionOverlay {
                let customerview = TabController()
                customerview.fetchUserData()
                customerview.modalPresentationStyle = .fullScreen
                customerview.modalTransitionStyle = .crossDissolve
                self.present(customerview, animated: true, completion: nil)
            }
            
        }
    }
    
    func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    func isValidPassword(_ password: String) -> Bool {
        // Add your password validation criteria here
        // For example, requiring at least 8 characters, containing both letters and numbers
        let passwordRegex = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$"
        let passwordPredicate = NSPredicate(format: "SELF MATCHES %@", passwordRegex)
        return passwordPredicate.evaluate(with: password)
    }
    
    @objc func handleShowSignUp() {
        // Add glass transition overlay
        view.addGlassTransitionOverlay {
            let signup = SignUpController()
            signup.modalPresentationStyle = .fullScreen
            signup.modalTransitionStyle = .crossDissolve
            self.present(signup, animated: true, completion: nil)
        }
    }
    
    @objc func handleForgotPassword() {
        // Add glass transition overlay
        view.addGlassTransitionOverlay {
            let forgot = ForgotPasswordController()
            forgot.modalPresentationStyle = .fullScreen
            forgot.modalTransitionStyle = .crossDissolve
            self.present(forgot, animated: true, completion: nil)
        }
    }
    
    // MARK: - Video Background Setup
    
    private func setupVideoBackground() {
        guard let videoURL = Bundle.main.url(forResource: "mowieV01", withExtension: "mp4") else {
            print("❌ Video file not found - using gradient background fallback")
            view.applyDarkGreenGradient()
            return
        }
        
        print("✅ Setting up video background")
        
        // Create player
        player = AVPlayer(url: videoURL)
        player?.isMuted = true // Always muted for background video
        
        // Create player layer
        playerLayer = AVPlayerLayer(player: player)
        playerLayer?.frame = view.bounds
        playerLayer?.videoGravity = .resizeAspectFill
        
        // Add to view at index 0 (background)
        if let playerLayer = playerLayer {
            view.layer.insertSublayer(playerLayer, at: 0)
        }
        
        // Setup looping
        setupVideoLooping()
        
        // Start playing
        player?.play()
        
        print("🎬 Video background started")
    }
    
    private func setupVideoLooping() {
        // Add observer for end of video to loop seamlessly
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerDidFinishPlaying),
            name: .AVPlayerItemDidPlayToEndTime,
            object: player?.currentItem
        )
    }
    
    @objc private func playerDidFinishPlaying() {
        // Seamlessly loop the video
        player?.seek(to: .zero)
        player?.play()
        print("🔄 Video looped")
    }
    
    private func setupVideoOverlay() {
        // Create dark overlay for text readability
        videoOverlay = UIView()
        videoOverlay?.backgroundColor = UIColor.black.withAlphaComponent(0.8)
        videoOverlay?.translatesAutoresizingMaskIntoConstraints = false
        
        if let overlay = videoOverlay {
            view.addSubview(overlay)
            NSLayoutConstraint.activate([
                overlay.topAnchor.constraint(equalTo: view.topAnchor),
                overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                overlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                overlay.bottomAnchor.constraint(equalTo: view.bottomAnchor)
            ])
        }
        
        print("🎨 Video overlay applied")
    }
    
    // MARK: - Helper Functions
    
    func configureUI() {
        
        configureNavigationBar()
        
        // Setup video background first
        setupVideoBackground()
        
        // Apply dark overlay instead of gradient (video provides background)
        setupVideoOverlay()
        
        // Add logo container
        view.addSubview(logoContainer)
        NSLayoutConstraint.activate([
            logoContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 60),
            logoContainer.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            logoContainer.widthAnchor.constraint(equalToConstant: 80),
            logoContainer.heightAnchor.constraint(equalToConstant: 80)
        ])
        
        // Create form container with Phase 1 glass panel
        let formContainer = UIView()
        formContainer.translatesAutoresizingMaskIntoConstraints = false
        formContainer.applyGlassPanel(cornerRadius: 24)
        view.addSubview(formContainer)
        
        // Login button gradient is handled in the button definition
        
        let stack = UIStackView(arrangedSubviews: [emailContainerView, passwordContainerView, loginButton])
        stack.axis = .vertical
        stack.distribution = .fillEqually
        stack.spacing = 24
        
        formContainer.addSubview(stack)
        stack.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            // Form container constraints
            formContainer.topAnchor.constraint(equalTo: logoContainer.bottomAnchor, constant: 40),
            formContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            formContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            formContainer.heightAnchor.constraint(equalToConstant: 240),
            
            // Stack constraints inside form container
            stack.topAnchor.constraint(equalTo: formContainer.topAnchor, constant: 20),
            stack.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor, constant: -20),
            stack.bottomAnchor.constraint(equalTo: formContainer.bottomAnchor, constant: -20)
        ])
        
        view.addSubview(forgotPasswordButton)
        forgotPasswordButton.centerX(inView: view)
        forgotPasswordButton.anchor(top: formContainer.bottomAnchor, paddingTop: 20, height: 32)
        
        view.addSubview(dontHaveAccountButton)
        dontHaveAccountButton.centerX(inView: view)
        dontHaveAccountButton.anchor(bottom: view.safeAreaLayoutGuide.bottomAnchor, height: 32)
    }
    
    // Function to show an alert
        func showAlert(message: String) {
            let alertController = UIAlertController(title: "Alert", message: message, preferredStyle: .alert)
            let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
            alertController.addAction(okAction)
            present(alertController, animated: true, completion: nil)
        }
    
    func configureNavigationBar() {
        
        navigationController?.navigationBar.isHidden = true
        navigationController?.navigationBar.barStyle = .black
    }
}
