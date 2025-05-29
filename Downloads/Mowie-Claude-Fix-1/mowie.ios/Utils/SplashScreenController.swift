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
        
        // Set up the video player
        if let videoURL = Bundle.main.url(forResource: "mowieV01", withExtension: "mp4") {
            
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
            
            // Play video
            player.play()

            // Automatically move to the main view after video ends
            NotificationCenter.default.addObserver(self, selector: #selector(videoDidEnd), name: .AVPlayerItemDidPlayToEndTime, object: player.currentItem)
        }
    }

    @objc func videoDidEnd() {
        // Transition to the main app interface after video finishes
//        let tabController = storyboard?.instantiateViewController(withIdentifier: "TabController") as! TabController
//        self.view.window?.rootViewController = tabController
//        self.view.window?.makeKeyAndVisible()
        
//        let appview = TabController()
//        appview.modalPresentationStyle = .fullScreen
//        self.present(appview, animated: true, completion: nil)
        
        let appview = TabController()

        // Ensure it's inside a navigation controller
        let navController = UINavigationController(rootViewController: appview)

        // Set it as the new root view controller
        if let window = self.view.window {
            window.rootViewController = navController
            window.makeKeyAndVisible()
        }
    }
}
