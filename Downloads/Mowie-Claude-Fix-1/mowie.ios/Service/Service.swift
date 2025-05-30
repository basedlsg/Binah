//
//  Service.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 11/20/23.
//

import Foundation
import Firebase
import FirebaseAuth
import CoreLocation

let DB_REF = Database.database().reference()
let REF_USERS = DB_REF.child("users")
let REF_JOBS = DB_REF.child("job")

struct Service {
    
    static let shared = Service()
    
    func fetchUserData(uid: String, completion: @escaping(User?) -> Void) {
        print("🔍 Fetching user data for uid: \(uid)")
        
        REF_USERS.child(uid).observeSingleEvent(of: .value) { (snapshot) in
            if snapshot.exists() {
                guard let dictionary = snapshot.value as? [String: Any] else { 
                    print("❌ Failed to parse user data dictionary")
                    completion(nil)
                    return 
                }
                let uid = snapshot.key
                let user = User(uid: uid, dictionary: dictionary)
                print("✅ Successfully fetched user data")
                completion(user)
            } else {
                print("❌ No user document found in Firebase")
                completion(nil)
            }
        } withCancel: { error in
            print("❌ Firebase error fetching user data: \(error.localizedDescription)")
            completion(nil)
        }
    }
    
    func fetchPro(uid: String, completion: @escaping(Pro) -> Void) {
        REF_USERS.child(uid).observe(.value) { (snapshot) in
            guard let dictionary = snapshot.value as? [String: Any] else { return }
            let uid = snapshot.key
            let pro = Pro(dictionary: dictionary)
            
            completion(pro)
        }
    }
    
    func getJobs(completion: @escaping ([Job]) -> Void) {
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        REF_JOBS.child(uid).observe(.value, with: { snapshot in
            var jobs: [Job] = []
            
            guard let jobsDictionary = snapshot.value as? [String: [String: Any]] else {
                // Handle the case where the snapshot data is not in the expected format
                completion([])
                return
            }
            
            for (jobId, jobData) in jobsDictionary {
                // Initialize a Job object from the dictionary and add it to the array
                let job = Job(uid: jobId, dictionary: jobData)
                jobs.append(job)
                print(job)
            }
            
            // Return the array of jobs through the completion handler
            completion(jobs)
        })
    }
    
    func updatePhoto(photoNodeName: String, photoPath: String, completion: @escaping(Error?, DatabaseReference) -> Void) {
        let updates = [photoNodeName: photoPath]
        print("\(photoNodeName): \(photoPath)")
        
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        REF_USERS.child(uid).updateChildValues(updates) { (error, reference) in
            if let error = error {
                print("Error updating data: \(error.localizedDescription)")
            } else {
                print("Data updated successfully!")
            }
        }
    }
    
    // MARK: - Customer Services
    
    func saveLocation(locationString: String, type: LocationType, completion: @escaping(Error?, DatabaseReference) -> Void) {
        guard let uid = Auth.auth().currentUser?.uid else { return }
        let key: String = type == .home ? "homeLocation" : "workLocation"
        REF_USERS.child(uid).child(key).setValue(locationString, withCompletionBlock: completion)
    }
    
    func addDumpsterJob(_ job: Dumpster, completion: @escaping(Result<String, Error>) -> Void) {
        guard let uid = Auth.auth().currentUser?.uid else {
            print("User not authenticated")
            return
        }

        // Generate a new job ID
        let dumpsterJobRef = Database.database().reference()
            .child("dumpsterjob")
            .child(uid)
            .childByAutoId()

        guard let jobId = dumpsterJobRef.key else {
            print("Failed to generate job ID")
            return
        }

        print("Dumpster Job UID: \(jobId)")

        let values: [String: Any] = [
            "jobid": jobId,
            "userid": uid,
            "name": job.name,
            "address": job.address,
            "phone": job.phone,
            "size": job.size,
            "city": job.city,
            "rentaldays": job.rentaldays,
            "customerid": job.customerid,
            "amount": job.amount,
            "status": "Waiting on Payment", // hardcoded default
            "timestamp": job.timestamp
        ]

        dumpsterJobRef.setValue(values) { error, _ in
            if let error = error {
                print("Failed to save dumpster job: \(error.localizedDescription)")
                completion(.failure(error))
            } else {
                print("Dumpster job saved with jobid: \(jobId)")
                completion(.success(jobId))
            }
        }
    }

    
    func addJob(_ job: Job, completion: @escaping(Result<DatabaseReference, Error>) -> Void) {
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        let newChildReference = REF_JOBS.child(uid).childByAutoId()
        let jobUID = newChildReference.key
        var getJobID = ""
        
        if let unwrappedJobUID = jobUID {
            // Now, unwrappedJobUID is a non-optional String
            print("Job UID: \(unwrappedJobUID)")
            getJobID = unwrappedJobUID
        }
        
        print(getJobID)
            
            let values: [String: Any] = [
                "streetname": job.streetname,
                "streetnumber": job.streetnumber,
                "stateaddress": job.stateaddress,
                "cityaddress": job.cityaddress,
                "zipcode": job.zipcode,
                "yardsize": job.yardsize,
                "userid": job.userid,
                "subid": job.subid,
                "proid": "Not Assigned",
                "rating": "N/A",
                "profilephotourl": "Not Assigned",
                "package": job.package,
                "note": job.note,
                "jobid": getJobID,
                "frequency": job.frequency,
                "day": job.day,
                "carphotourl": "Not Assigned",
                "status": job.status,
                "jobstate": job.jobstate
            ]
        
        newChildReference.setValue(values) { (error, ref) in
            if let error = error {
                completion(.failure(error))
            } else {
                completion(.success(ref))
            }
        }
    }
    
    func editJob(_ job: Job, completion: @escaping(Error?, DatabaseReference?) -> Void) {
        print("Service Edit job")
        let values: [String: Any] = [
                "streetname": job.streetname,
                "streetnumber": job.streetnumber,
                "stateaddress": job.stateaddress,
                "cityaddress": job.cityaddress,
                "zipcode": job.zipcode,
                "yardsize": job.yardsize,
                "userid": job.userid,
                "subid": job.subid,
                "proid": job.proid,
                "rating": job.rating,
                "profilephotourl": job.profilephotourl,
                "package": job.package,
                "note": job.note,
                "jobid": job.jobid,
                "frequency": job.frequency,
                "day": job.day,
                "carphotourl": job.carphotourl,
                "status": job.status,
                "jobstate": job.jobstate,
                ]
        
        let jobRef = REF_JOBS.child(job.userid).child(job.jobid)
            jobRef.setValue(values) { error, _ in
            if let error = error {
                print("Failed to edit job: \(error.localizedDescription)")
                completion(error, nil)
            } else {
                print("Successfully edited job")
                completion(nil, jobRef)
            }
        }
    }
    
    func deleteJob(_ job: Job, completion: @escaping(Error?, DatabaseReference) -> Void) {
        print("Service Delete job")
        if job.jobstate != "Waiting for Payment" || job.jobstate != "Completed" {
            
            let subscriptionId = job.subid
            cancelSubscription(subscriptionId: subscriptionId) { result in
                switch result {
                case .success:
                    print("Subscription canceled successfully")
                case .failure(let error):
                    print("Failed to cancel subscription: \(error)")
                }
            }
            
        }
        // Reference to the child node you want to delete
        let nodeRef = REF_JOBS.child(job.userid).child(job.jobid)

        // Remove the data at the specified child node location
        nodeRef.removeValue { error, _ in
            if let error = error {
                print("Error deleting child node: \(error.localizedDescription)")
                
            } else {
                print("Child node deleted successfully")
            }
            // Call the completion handler with the result of the deletion
            completion(error, nodeRef)
        }
    }

    func cancelSubscription(subscriptionId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // Construct the URL
        guard let url = URL(string: "https://mowie-service-server.onrender.com/cancel-subscription") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        // Create the request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Construct the request body
        let requestBody: [String: Any] = ["subid": subscriptionId]
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody, options: [])
        } catch {
            completion(.failure(error))
            return
        }
        
        // Make the request
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            // Check for successful response
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                completion(.failure(NSError(domain: "Server Error", code: 0, userInfo: nil)))
                return
            }
            
            // Handle successful response
            completion(.success(()))
        }
        
        task.resume()
    }
    
    func deleteAccount(customerid: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        guard let url = URL(string: "https://mowie-service-server.onrender.com/v1/customers/\(customerid)") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        print("Url: \(url)")

        // Create the data to be sent in the request body
        let message = ["customerid": customerid]
        let jsonData = try? JSONSerialization.data(withJSONObject: message)

        // Check if creating JSON data was successful
        guard let postData = jsonData else {
            completion(.failure(NSError(domain: "Invalid JSON Data", code: 0, userInfo: nil)))
            return
        }
        
        print("Post Data: \(postData)")

        // Create the request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = postData // Set the request body with the JSON data

        // Set up a URLSession task
        let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
            if let error = error {
                print("Error: \(error.localizedDescription)")
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                print("Invalid response")
                return
            }

            // Check if the request was successful (HTTP status code 200-299)
            if (200...299).contains(httpResponse.statusCode) {
                if let user = Auth.auth().currentUser {
                    user.delete { error in
                        if let error = error {
                            print("Error deleting user: \(error.localizedDescription)")
                        } else {
                            print("User deleted successfully")
                            print("Account deleted successfully")
                            let jobReference = REF_JOBS.child(uid)

                            // Remove the data at the specified reference
                            jobReference.removeValue { error, _ in
                                if let error = error {
                                    print("Error removing job data: \(error.localizedDescription)")
                                } else {
                                    print("Job data successfully removed")
                                    print(jobReference)
                                    let userReference = REF_USERS.child(uid)

                                    // Remove the data at the specified reference
                                    userReference.removeValue { error, _ in
                                        if let error = error {
                                            print("Error removing user data: \(error.localizedDescription)")
                                        } else {
                                            print("User data successfully removed")
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    print("No user is currently signed in")
                }
            } else {
                print("Request failed with status code: \(httpResponse.statusCode)")
            }
            // Handle successful response
            completion(.success(()))
        }
        // Resume the task
        task.resume()
    }
    
    // MARK: - Pro Services
    
    func getJobList(completion: @escaping ([Job]) -> Void) {
        REF_JOBS.observe(.value, with: { snapshot in
            var jobs: [Job] = []

            guard let jobsDictionary = snapshot.value as? [String: [String: Any]] else {
                // Handle the case where the snapshot data is not in the expected format
                completion([])
                return
            }

            for (userid, jobData) in jobsDictionary {
                print("Job Data: \(jobData)")
                for(jobid, rawData) in jobData {
                    print("Raw Data: \(rawData)")
                    let job = Job(userid: userid, uid: jobid, dictionary: rawData as! [String : Any])
                    if job.status == "Waiting for Pro" {
                        jobs.append(job)
                        print("Job: \(job)")
                    }
                }
            }

            // Return the array of jobs through the completion handler
            completion(jobs)
        })
    }
    
    func getProJobs(completion: @escaping ([Job]) -> Void) {
        guard let prouid = Auth.auth().currentUser?.uid else { return }

        REF_JOBS.observe(.value, with: { snapshot in
            var jobs: [Job] = []

            guard let jobsDictionary = snapshot.value as? [String: [String: Any]] else {
                // Handle the case where the snapshot data is not in the expected format
                completion([])
                return
            }

            for (userid, jobData) in jobsDictionary {
                print("Job Data: \(jobData)")
                for(jobid, rawData) in jobData {
                    print("Raw Data: \(rawData)")
                    let job = Job(userid: userid, uid: jobid, dictionary: rawData as! [String : Any])
                    if job.proid == prouid {
                        jobs.append(job)
                        print("Job: \(job)")
                    }
                }
            }

            // Return the array of jobs through the completion handler
            completion(jobs)
        })
    }
    
    func deleteProAccount(completion: @escaping (Result<Void, Error>) -> Void) {
        guard let uid = Auth.auth().currentUser?.uid else {
            completion(.failure(NSError(domain: "AuthenticationError", code: 401, userInfo: [NSLocalizedDescriptionKey: "User not authenticated"])))
            return
        }

        // Delete the user account
        Auth.auth().currentUser?.delete { error in
            if let error = error {
                print("Error deleting user account: \(error.localizedDescription)")
                completion(.failure(error))
                return
            }

            print("User account deleted successfully")

            // Remove job data
            let jobReference = Database.database().reference().child("jobs").child(uid)
            jobReference.removeValue { error, _ in
                if let error = error {
                    print("Error removing job data: \(error.localizedDescription)")
                    completion(.failure(error))
                    return
                }

                print("Job data successfully removed")

                // Remove user data
                let userReference = Database.database().reference().child("users").child(uid)
                userReference.removeValue { error, _ in
                    if let error = error {
                        print("Error removing user data: \(error.localizedDescription)")
                        completion(.failure(error))
                        return
                    }

                    print("User data successfully removed")
                    completion(.success(()))
                }
            }
        }
    }
}
