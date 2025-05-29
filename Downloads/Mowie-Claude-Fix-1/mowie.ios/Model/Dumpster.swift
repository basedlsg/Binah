//
//  Dumpster.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 5/18/25.
//

import Foundation

struct Dumpster {
    let name: String
    let address: String
    let phone: String
    let size: String
    let timestamp: String
    let customerid: String
    let rentaldays: String
    let city: String
    let amount: String
    
    init(name: String,
         address: String,
         phone: String,
         size: String,
         timestamp: String,
         customerid: String,
         rentaldays: String,
         city: String,
         amount: String) {
        self.name = name
        self.address = address
        self.phone = phone
        self.size = size
        self.timestamp = timestamp
        self.customerid = customerid
        self.rentaldays = rentaldays
        self.city = city
        self.amount = amount
    }
}
