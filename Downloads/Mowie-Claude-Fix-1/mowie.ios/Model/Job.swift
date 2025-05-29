//
//  Job.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/4/23.
//

import Foundation

struct Job {
    let streetname: String
    let streetnumber: String
    let stateaddress: String
    let cityaddress: String
    let zipcode: String
    let yardsize: String
    let userid: String
    let subid: String
    let proid: String
    let status: String
    let jobstate: String
    let rating: String
    let profilephotourl: String
    let package: String
    let note: String
    let jobid: String
    let frequency: String
    let day: String
    let carphotourl: String
    let customerid: String
    let uid: String
    
    init(uid: String, dictionary:[String: Any]) {
        self.uid = uid
        self.streetname = dictionary["streetname"] as? String ?? ""
        self.streetnumber = dictionary["streetnumber"] as? String ?? ""
        self.stateaddress = dictionary["stateaddress"] as? String ?? ""
        self.cityaddress = dictionary["cityaddress"] as? String ?? ""
        self.zipcode = dictionary["zipcode"] as? String ?? ""
        self.yardsize = dictionary["yardsize"] as? String ?? ""
        self.userid = dictionary["userid"] as? String ?? ""
        self.subid = dictionary["subid"] as? String ?? ""
        self.proid = dictionary["proid"] as? String ?? ""
        self.rating = dictionary["rating"] as? String ?? ""
        self.profilephotourl = dictionary["profilephotourl"] as? String ?? ""
        self.package = dictionary["package"] as? String ?? ""
        self.note = dictionary["note"] as? String ?? ""
        self.jobid = dictionary["jobid"] as? String ?? ""
        self.frequency = dictionary["frequency"] as? String ?? ""
        self.day = dictionary["day"] as? String ?? ""
        self.carphotourl = dictionary["carphotourl"] as? String ?? ""
        self.status = dictionary["status"] as? String ?? ""
        self.jobstate = dictionary["jobstate"] as? String ?? ""
        self.customerid = dictionary["customerid"] as? String ?? ""
    }
    
    init(userid: String, uid: String, dictionary: [String: Any]) {
        self.uid = uid
        self.userid = userid
        self.streetname = dictionary["streetname"] as? String ?? ""
        self.streetnumber = dictionary["streetnumber"] as? String ?? ""
        self.stateaddress = dictionary["stateaddress"] as? String ?? ""
        self.cityaddress = dictionary["cityaddress"] as? String ?? ""
        self.zipcode = dictionary["zipcode"] as? String ?? ""
        self.yardsize = dictionary["yardsize"] as? String ?? ""
        self.jobid = dictionary["jobid"] as? String ?? ""
        self.subid = dictionary["subid"] as? String ?? ""
        self.proid = dictionary["proid"] as? String ?? ""
        self.rating = dictionary["rating"] as? String ?? ""
        self.profilephotourl = dictionary["profilephotourl"] as? String ?? ""
        self.package = dictionary["package"] as? String ?? ""
        self.note = dictionary["note"] as? String ?? ""
        self.frequency = dictionary["frequency"] as? String ?? ""
        self.day = dictionary["day"] as? String ?? ""
        self.carphotourl = dictionary["carphotourl"] as? String ?? ""
        self.status = dictionary["status"] as? String ?? ""
        self.jobstate = dictionary["jobstate"] as? String ?? ""
        self.customerid = dictionary["customerid"] as? String ?? ""
        }
}
