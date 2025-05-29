//
//  AppDelegate.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 11/10/23.
//

import UIKit
import FirebaseCore
import FirebaseDatabase
import Stripe

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        FirebaseApp.configure()
        STPAPIClient.shared.publishableKey = "pk_live_51Mj9dFGQVpwkvutOiqrm4a1sRMff7tzwwvrlmyBuvOZt6cfX5YqkxsBpOQ2c1vbl7nPNlJngFGG54ct1ZFxV3V0h00OGQedBpa"
        return true
    }
    
    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}

    // 👇 REQUIRED for SceneDelegate setup
    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
