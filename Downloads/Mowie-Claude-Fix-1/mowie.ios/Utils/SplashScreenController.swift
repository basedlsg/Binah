//
//  SplashScreenController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 1/18/24.
//

import Foundation
import UIKit
import AVFoundation
import Firebase
import FirebaseAuth

class SplashScreenController: UIViewController {

    var player: AVPlayer!
    var playerLayer: AVPlayerLayer!
    private var didNavigate = false
    private var loadingLabel: UILabel!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("🔵 SplashScreenController: viewDidLoad")
        
        // ALWAYS set background color first to prevent white screen
        view.backgroundColor = UIColor.primaryDark
        
        // Setup UI
        setupUI()
        
        // Setup video if available
        setupVideoPlayer()
        
        print("✅ SplashScreenController viewDidLoad completed")
    }
    
    private func setupUI() {
        // Add loading label as fallback
        loadingLabel = UILabel()
        loadingLabel.text = "Loading Mowie..."
        loadingLabel.textColor = UIColor.white.withAlphaComponent(0.7)
        loadingLabel.font = .systemFont(ofSize: 24, weight: .medium)
        loadingLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(loadingLabel)
        
        NSLayoutConstraint.activate([
            loadingLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            loadingLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
    
    private func setupVideoPlayer() {
        // Set up the video player
        if let videoURL = Bundle.main.url(forResource: "mowieV01", withExtension: "mp4") {
            print("✅ Found video file: mowieV01.mp4")
            
            // Initialize the AVPlayer with the video URL
            player = AVPlayer(url: videoURL)
            
            // Create an AVPlayerLayer to display the video
            playerLayer = AVPlayerLayer(player: player)
            
            // Define padding for the sides (adjust as needed)
            let sidePadding: CGFloat = 0 // Adjust to your preference
            let videoWidth = view.bounds.width - (2 * sidePadding)
            let videoHeight = view.bounds.height
            
            // Set the frame with the adjusted width (centered)
            playerLayer.frame = CGRect(x: sidePadding, y: 0, width: videoWidth, height: videoHeight)
            
            // Maintain aspect fill while allowing side margins
            playerLayer.videoGravity = .resizeAspectFill
            
            // Add player layer to the view
            view.layer.addSublayer(playerLayer)
            
            // Hide loading label once video starts
            loadingLabel.isHidden = true
            
            // Play video
            player.play()
            print("▶️ Playing splash video")

            // Automatically move to the main view after video ends
            NotificationCenter.default.addObserver(self, selector: #selector(videoDidEnd), name: .AVPlayerItemDidPlayToEndTime, object: player.currentItem)
        } else {
            print("❌ Video file not found, will transition after delay")
        }
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        print("🔵 SplashScreenController: viewWillAppear")
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        print("🔵 SplashScreenController: viewDidAppear")
        
        // Start authentication check with timeout
        performAuthCheck()
    }

    @objc func videoDidEnd() {
        print("🏁 Video playback ended")
        // Don't navigate here - wait for auth check
    }
    
    private func performAuthCheck() {
        // Prevent multiple navigations
        guard !didNavigate else { return }
        
        // TEMPORARY TEST: Skip auth and go straight to login (uncomment to test)
        /*
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.showLoginController()
        }
        return
        */
        
        // Set a timeout to prevent white screen hang
        DispatchQueue.main.asyncAfter(deadline: .now() + 8.0) {
            if !self.didNavigate {
                print("⚠️ Auth check timeout - forcing login")
                self.showLoginController()
            }
        }
        
        // Check authentication
        if Auth.auth().currentUser == nil {
            print("📱 No user - showing login")
            // Wait for video or minimum delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                self.showLoginController()
            }
        } else {
            print("📱 User exists - fetching data")
            guard let uid = Auth.auth().currentUser?.uid else {
                showLoginController()
                return
            }
            
            // Add specific timeout for fetchUserData
            var didFetchComplete = false
            
            // Timeout after 10 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) {
                if !didFetchComplete && !self.didNavigate {
                    print("⚠️ fetchUserData timeout - showing login")
                    self.showLoginController()
                }
            }
            
            Service.shared.fetchUserData(uid: uid) { [weak self] user in
                guard let self = self else { return }
                didFetchComplete = true
                
                if !self.didNavigate {
                    if let user = user {
                        print("✅ User data fetched - account type: \(user.accountType == .customer ? "customer" : "pro")")
                        // Wait for video or minimum delay
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                            if !self.didNavigate {
                                self.navigateToMainApp(user: user)
                            }
                        }
                    } else {
                        print("⚠️ User data was nil - showing login")
                        self.showLoginController()
                    }
                }
            }
        }
    }
    
    private func showLoginController() {
        guard !didNavigate else { return }
        didNavigate = true
        
        let loginVC = LoginController()
        
        // CRITICAL: Ensure LoginController has a background color
        loginVC.view.backgroundColor = UIColor.primaryDark
        
        let nav = UINavigationController(rootViewController: loginVC)
        nav.modalPresentationStyle = .fullScreen
        
        // Use window transition for smoother experience
        if let window = self.view.window {
            UIView.transition(with: window, duration: 0.3, options: .transitionCrossDissolve, animations: {
                window.rootViewController = nav
            }, completion: { _ in
                print("✅ LoginController presented")
            })
        } else {
            present(nav, animated: true) {
                print("✅ LoginController presented (fallback)")
            }
        }
    }
    
    private func navigateToMainApp(user: User) {
        guard !didNavigate else { return }
        didNavigate = true
        
        // The TabController will handle the user type routing
        let tabVC = TabController()
        tabVC.user = user
        
        let navController = UINavigationController(rootViewController: tabVC)
        navController.modalPresentationStyle = .fullScreen
        
        // Use window transition for smoother experience
        if let window = self.view.window {
            UIView.transition(with: window, duration: 0.3, options: .transitionCrossDissolve, animations: {
                window.rootViewController = navController
            }, completion: { _ in
                print("✅ Main app presented for \(user.accountType == .customer ? "customer" : "pro")")
            })
        } else {
            present(navController, animated: true) {
                print("✅ Main app presented (fallback)")
            }
        }
    }
}
