//
//  PaymentViewController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 5/4/25.
//

import UIKit
import Stripe
import StripePaymentSheet

class PaymentViewController: UIViewController {
    private var paymentSheet: PaymentSheet?

    override func viewDidLoad() {
        super.viewDidLoad()
        fetchPaymentSheetData()
    }

    func fetchPaymentSheetData() {
        // Replace with your backend endpoint
        let url = URL(string: "https://mowie-service-server.onrender.com/payment-sheet")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = ["amount": 1000, "customer_id": "cus_..."]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data else { return }

            let json = try? JSONSerialization.jsonObject(with: data) as? [String: String]
            let customer = json?["customer"]
            let ephemeralKey = json?["ephemeralKey"]
            let clientSecret = json?["paymentIntent"]

            var configuration = PaymentSheet.Configuration()
            configuration.merchantDisplayName = "Mowie Inc."
            configuration.customer = .init(id: customer ?? "", ephemeralKeySecret: ephemeralKey ?? "")

            DispatchQueue.main.async {
                self.paymentSheet = PaymentSheet(paymentIntentClientSecret: clientSecret ?? "", configuration: configuration)
            }
        }.resume()
    }

    @IBAction func payButtonTapped(_ sender: UIButton) {
        paymentSheet?.present(from: self) { paymentResult in
            switch paymentResult {
            case .completed:
                print("Payment successful")
            case .canceled:
                print("Payment canceled")
            case .failed(let error):
                print("Payment failed: \(error.localizedDescription)")
            }
        }
    }
}

