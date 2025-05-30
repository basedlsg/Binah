//
//  SplashScreenController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 1/18/24.
//

import Foundation
import UIKit
import AVFoundation

class SplashScreenController: UIViewController {

    var player: AVPlayer!
    var playerLayer: AVPlayerLayer!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("🔵 SplashScreenController: viewDidLoad")
        
        // Set immediate background color using Phase 1 dark green
        view.backgroundColor = UIColor.primaryDark
        
        // Add loading label as fallback
        let loadingLabel = UILabel()
        loadingLabel.text = "Loading Mowie..."
        loadingLabel.textColor = UIColor.white.withAlphaComponent(0.7)
        loadingLabel.font = .systemFont(ofSize: 24, weight: .medium)
        loadingLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(loadingLabel)
        
        NSLayoutConstraint.activate([
            loadingLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            loadingLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        
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
            print("❌ Video file not found, showing loading screen")
            // If no video, transition after delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                self.videoDidEnd()
            }
        }
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        print("🔵 SplashScreenController: viewWillAppear")
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        print("🔵 SplashScreenController: viewDidAppear")
    }

    @objc func videoDidEnd() {
        print("🏁 Splash video ended, transitioning to main app")
        
        // Transition to the main app interface after video finishes
        let appview = TabController()

        // Ensure it's inside a navigation controller
        let navController = UINavigationController(rootViewController: appview)

        // Set it as the new root view controller
        if let window = self.view.window {
            print("✅ Transitioning to TabController")
            window.rootViewController = navController
            window.makeKeyAndVisible()
        } else {
            print("❌ Window is nil, cannot transition")
        }
    }
}
