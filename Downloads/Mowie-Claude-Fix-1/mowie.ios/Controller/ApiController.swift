//
//  ApiController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 1/13/24.
//

import Foundation
import UIKit
import WebKit

class ApiController: UIViewController, WKNavigationDelegate {

    var webView: WKWebView!
    private let job: Job?
    var htmlContent = ""
    
    init(job: Job, url: String) {
        self.job = job
        self.htmlContent = url
        print("API Controller")
        super.init(nibName: nil, bundle: nil)
        configureUI()
    }
    
    init(url: String) {
        self.job = nil
        self.htmlContent = url
        super.init(nibName: nil, bundle: nil)
        configureUI()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func configureUI() {
        // Create a WKWebView
        webView = WKWebView()
        webView.navigationDelegate = self
        view = webView

        // Add a back button
        let backButton = UIBarButtonItem(image: UIImage(systemName: "chevron.left"), style: .plain, target: self, action: #selector(goBack))

        navigationItem.leftBarButtonItem = backButton
        
        navigationController?.navigationBar.barTintColor = .white

        // Load a webpage
        if let url = URL(string: htmlContent) {
            let request = URLRequest(url: url)
            webView.load(request)
        } else {
            print("Invalid URL")
            // Handle invalid URL scenario
        }
    }

    // WKNavigationDelegate methods
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("Page loaded successfully")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Failed to load webpage with error: \(error.localizedDescription)")
        // Handle error scenario
    }

    // Action for the back button
    @objc func goBack() {
        let customerview = UINavigationController(rootViewController: ContainerController())
        //customerview.fetchUserData()
        customerview.modalPresentationStyle = .fullScreen
        
        // Find the top-most visible view controller
        if var topController = UIApplication.shared.keyWindow?.rootViewController {
            while let presentedViewController = topController.presentedViewController {
                topController = presentedViewController
            }
            // Present ApiController from the top-most visible view controller
            topController.present(customerview, animated: true, completion: nil)
        }
    }
}
