//
//  User.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 11/20/23.
//

import Foundation

enum AccountType: Int {
    case customer
    case pro
}

struct Pro {
    var accountType: AccountType!
    let backgroundCheck: String
    let businessName: String
    let carPhotoURL: String
    let connectid: String
    let einNumber: String
    let email: String
    let firstname: String
    let id: String
    let lastname: String
    let needOnboard: String
    let phone: String
    let profilePhotoURL: String
    let rating: String

    init(dictionary: [String: Any]) {
        self.backgroundCheck = dictionary["backgroundcheck"] as? String ?? ""
        self.businessName = dictionary["Businessname"] as? String ?? ""
        self.carPhotoURL = dictionary["carphotourl"] as? String ?? ""
        self.connectid = dictionary["connectid"] as? String ?? ""
        self.einNumber = dictionary["einnumber"] as? String ?? ""
        self.email = dictionary["email"] as? String ?? ""
        self.firstname = dictionary["firstname"] as? String ?? ""
        self.id = dictionary["id"] as? String ?? ""
        self.lastname = dictionary["lastname"] as? String ?? ""
        self.needOnboard = dictionary["needonboard"] as? String ?? ""
        self.phone = dictionary["phone"] as? String ?? ""
        self.profilePhotoURL = dictionary["profilephotourl"] as? String ?? ""
        self.rating = dictionary["rating"] as? String ?? ""
        
        if let index = dictionary["accountType"] as? Int {
            self.accountType = AccountType(rawValue: index)
        }
    }
}

struct User {
    let firstname: String
    let lastname: String
    let phonenumber: String
    let email: String
    let customerid: String
    let profilephotourl: String
    var accountType: AccountType!
    var homeLocation: String?
    var workLocation: String?
    let id: String
    var proDetails: Pro?

    init(uid: String, dictionary: [String: Any]) {
        self.id = uid
        self.firstname = dictionary["firstname"] as? String ?? ""
        self.lastname = dictionary["lastname"] as? String ?? ""
        self.phonenumber = dictionary["phonenumber"] as? String ?? ""
        self.email = dictionary["email"] as? String ?? ""
        self.customerid = dictionary["customerid"] as? String ?? ""
        self.profilephotourl = dictionary["profilephotourl"] as? String ?? ""
        
        if let home = dictionary["homelocation"] as? String {
            self.homeLocation = home
        }
        
        if let work = dictionary["workLocation"] as? String {
            self.workLocation = work
        }
        
        if let index = dictionary["accountType"] as? Int {
            self.accountType = AccountType(rawValue: index)
        }

        if let proProperties = dictionary["proProperties"] as? [String: Any] {
            self.proDetails = Pro(dictionary: proProperties)
        }
    }
}

