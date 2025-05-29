//
//  CameraManager.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 1/5/24.
//

import UIKit
import Foundation
import AVFoundation
import Photos
import Firebase
import FirebaseAuth
import FirebaseStorage

class CameraManager: UIViewController, UIImagePickerControllerDelegate, UINavigationControllerDelegate {

    // MARK: - Properties
    private let job: Job?
    private let photoType: String
    private let jobStatus: String?
    
    let imageView: UIImageView = {
        let imageView = UIImageView()
        imageView.image = UIImage(named: "mowie1024")
        imageView.contentMode = .scaleAspectFit
        imageView.translatesAutoresizingMaskIntoConstraints = false
        return imageView
    }()

    let takePhotoButton: UIButton = {
        let button = UIButton()
        button.setTitle("Take Photo", for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = UIColor.systemBlue // Set a background color
        button.setTitleColor(UIColor.white, for: .normal) // Set text color
        button.layer.cornerRadius = 8 // Apply corner radius for a rounded appearance
        button.layer.masksToBounds = true
        
        // Increase font size
        button.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .bold) // Adjust the size as needed

        // Increase button size
        button.widthAnchor.constraint(equalToConstant: 300).isActive = true
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        
        return button
    }()

    let selectPhotoButton: UIButton = {
        let button = UIButton()
        button.setTitle("Select Photo", for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = UIColor.systemBlue // Set a background color
        button.setTitleColor(UIColor.white, for: .normal) // Set text color
        button.layer.cornerRadius = 8 // Apply corner radius for a rounded appearance
        button.layer.masksToBounds = true
        
        // Increase font size
        button.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .bold) // Adjust the size as needed

        // Increase button size
        button.widthAnchor.constraint(equalToConstant: 300).isActive = true
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        
        return button
    }()

    let uploadPhotoButton: UIButton = {
        let button = UIButton()
        button.setTitle("Upload Photo", for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = UIColor.systemBlue // Set a background color
        button.setTitleColor(UIColor.white, for: .normal) // Set text color
        button.layer.cornerRadius = 8 // Apply corner radius for a rounded appearance
        button.layer.masksToBounds = true
        
        // Increase font size
        button.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .bold) // Adjust the size as needed

        // Increase button size
        button.widthAnchor.constraint(equalToConstant: 300).isActive = true
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        
        return button
    }()

    let completeUploadButton: UIButton = {
        let button = UIButton()
        button.setTitle("Finish", for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = UIColor.systemBlue // Set a background color
        button.setTitleColor(UIColor.white, for: .normal) // Set text color
        button.layer.cornerRadius = 8 // Apply corner radius for a rounded appearance
        button.layer.masksToBounds = true
        
        // Increase font size
        button.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .bold) // Adjust the size as needed

        // Increase button size
        button.widthAnchor.constraint(equalToConstant: 300).isActive = true
        button.heightAnchor.constraint(equalToConstant: 50).isActive = true
        
        return button
    }()

    let imagePicker = UIImagePickerController()

    // MARK: - View Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()

        setupUI()
        checkPermissions()
    }
    
    init(job: Job, photoType: String) {
        self.job = job
        self.photoType = photoType
        self.jobStatus = job.jobstate
        super.init(nibName: nil, bundle: nil)
    }
    
    init(photoType: String) {
        self.job = nil
        self.photoType = photoType
        self.jobStatus = nil
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - UI Setup
    func setupUI() {
        view.backgroundColor = .white

        // Add subviews
        view.addSubview(imageView)
        view.addSubview(takePhotoButton)
        view.addSubview(selectPhotoButton)
        view.addSubview(uploadPhotoButton)
        view.addSubview(completeUploadButton)

        // Set constraints
        NSLayoutConstraint.activate([
            imageView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            imageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            imageView.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.4),

            takePhotoButton.topAnchor.constraint(equalTo: imageView.bottomAnchor, constant: 20),
            takePhotoButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            takePhotoButton.widthAnchor.constraint(equalToConstant: 150),

            selectPhotoButton.topAnchor.constraint(equalTo: takePhotoButton.bottomAnchor, constant: 10),
            selectPhotoButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            selectPhotoButton.widthAnchor.constraint(equalToConstant: 150),

            uploadPhotoButton.topAnchor.constraint(equalTo: selectPhotoButton.bottomAnchor, constant: 10),
            uploadPhotoButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            uploadPhotoButton.widthAnchor.constraint(equalToConstant: 150),

            completeUploadButton.topAnchor.constraint(equalTo: uploadPhotoButton.bottomAnchor, constant: 10),
            completeUploadButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            completeUploadButton.widthAnchor.constraint(equalToConstant: 150)
        ])

        // Add actions to buttons
        takePhotoButton.addTarget(self, action: #selector(takePhoto), for: .touchUpInside)
        selectPhotoButton.addTarget(self, action: #selector(selectPhoto), for: .touchUpInside)
        uploadPhotoButton.addTarget(self, action: #selector(uploadPhoto), for: .touchUpInside)
        completeUploadButton.addTarget(self, action: #selector(completeUpload), for: .touchUpInside)

        // Image picker setup
        imagePicker.delegate = self
        imagePicker.allowsEditing = false
    }

    // MARK: - Permissions
    func checkPermissions() {
        // Check camera permission
        if AVCaptureDevice.authorizationStatus(for: .video) == .authorized {
            // Camera is authorized
        } else {
            AVCaptureDevice.requestAccess(for: .video) { granted in
                if !granted {
                    // Handle denial of camera permission
                    self.showPermissionAlert(message: "Camera access is required for taking photos.")
                }
            }
        }

        // Check photo library permission
        if PHPhotoLibrary.authorizationStatus() == .authorized {
            // Photo library is authorized
        } else {
            PHPhotoLibrary.requestAuthorization { status in
                if status != .authorized {
                    // Handle denial of photo library permission
                    self.showPermissionAlert(message: "Photo library access is required for selecting photos.")
                }
            }
        }
    }

    // MARK: - Button Actions
    @objc func takePhoto() {
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            imagePicker.sourceType = .camera
            present(imagePicker, animated: true, completion: nil)
        } else {
            print("Camera not available")
        }
    }

    @objc func selectPhoto() {
        imagePicker.sourceType = .photoLibrary
        present(imagePicker, animated: true, completion: nil)
    }

    @objc func uploadPhoto() {
        // Upload logic to Firebase Storage
        if let selectedImage = imageView.image {
            if let uid = Auth.auth().currentUser?.uid {
                // Use the unwrapped uid here
                
                let metadata = StorageMetadata()
                    metadata.contentType = "image/jpeg"
                
                // Implement Firebase Storage upload here
                let storageRef = Storage.storage().reference()
                
                switch photoType {
                case "profilephoto":
                    let profileRef = storageRef.child("users").child(uid).child("profilephoto").child("profile")
                    let imageCompressionQuality: CGFloat = 0.5

                    if let imageData = selectedImage.jpegData(compressionQuality: imageCompressionQuality) {
                        let metadata = StorageMetadata()
                        // Set additional metadata if needed

                        profileRef.putData(imageData, metadata: metadata) { (metadata, error) in
                            if let error = error {
                                // Handle the error
                                print("Error uploading image: \(error.localizedDescription)")
                            } else {
                                // Image upload successful
                                print("Image uploaded successfully!")
                                let photoNodeName = "profilephotourl"
                                let photoPath = "users/\(uid)/profilephoto/photo"
                                
                                Service.shared.updatePhoto(photoNodeName: photoNodeName, photoPath: photoPath) { (error, ref) in
                                    if let error = error {
                                        print("Error adding job: \(error.localizedDescription)")
                                        self.showAlert(title: "Error", message: "There was an issue. Please try again.")
                                    } else {
                                        print("Photo added successfully. Reference: \(ref)")
                                        self.showAlert(title: "Success", message: "Image was successfully uploaded!")
                                    }
                                }
                            }
                        }
                    } else {
                        // Handle the case where selectedImage is nil or couldn't be converted to JPEG data
                        print("Error converting image to data.")
                    }

                case "carphoto":
                    let carRef = storageRef.child("users").child(uid).child("vehiclephoto").child("car")
                    let imageCompressionQuality: CGFloat = 0.5

                    if let imageData = selectedImage.jpegData(compressionQuality: imageCompressionQuality) {
                        let metadata = StorageMetadata()
                        // Set additional metadata if needed

                        carRef.putData(imageData, metadata: metadata) { (metadata, error) in
                            if let error = error {
                                // Handle the error
                                print("Error uploading image: \(error.localizedDescription)")
                            } else {
                                // Image upload successful
                                print("Image uploaded successfully!")
                                let photoNodeName = "carphotourl"
                                let photoPath = "users/\(uid)/vehiclephoto/car"
                                
                                Service.shared.updatePhoto(photoNodeName: photoNodeName, photoPath: photoPath) { (error, ref) in
                                    if let error = error {
                                        print("Error adding job: \(error.localizedDescription)")
                                        self.showAlert(title: "Error", message: "There was an issue. Please try again.")
                                    } else {
                                        print("Photo added successfully. Reference: \(ref)")
                                        self.showAlert(title: "Success", message: "Image was successfully uploaded!")
                                    }
                                }
                            }
                        }
                    } else {
                        // Handle the case where selectedImage is nil or couldn't be converted to JPEG data
                        print("Error converting image to data.")
                    }

                case "jobphoto":
                    let address = "\(job?.streetnumber)\(job?.streetname)"
                    let pro = "\(job?.proid)"

                    let currentDate = Date()
                    let dateFormatter = DateFormatter()
                    dateFormatter.dateFormat = "yyyyMMdd"
                    let formattedDate = dateFormatter.string(from: currentDate)
                    
                    func generateRandomNumber() -> Int {
                        // Generate a random number between 100 and 999
                        let randomNum = Int(arc4random_uniform(900) + 100)
                        return randomNum
                    }

                    let randomThreeDigitNumber = generateRandomNumber()
                    
                    print(address)
                    print(uid)
                    print(randomThreeDigitNumber)
                    print(formattedDate)
                    print(job?.jobstate)
                    
                        switch job?.jobstate {
                        case "Ready":
                            let beforeRef = storageRef.child(address).child(uid).child("Before").child("\(formattedDate)-\(randomThreeDigitNumber)")
                            beforeRef.putData(selectedImage.jpegData(compressionQuality: 0.5)!, metadata: metadata) { (_, error) in
                            // Handle upload completion
                                let values: [String: Any] = [
                                    "streetname": self.job?.streetname,
                                    "streetnumber": self.job?.streetnumber,
                                    "stateaddress": self.job?.stateaddress,
                                    "cityaddress": self.job?.cityaddress,
                                    "zipcode": self.job?.zipcode,
                                    "yardsize": self.job?.yardsize,
                                    "userid": self.job?.userid,
                                    "subid": self.job?.subid,
                                    "proid": self.job?.proid,
                                    "rating": self.job?.rating,
                                    "profilephotourl": self.job?.profilephotourl,
                                    "package": self.job?.package,
                                    "note": self.job?.note,
                                    "jobid": self.job?.jobid,
                                    "frequency": self.job?.frequency,
                                    "day": self.job?.day,
                                    "carphotourl": self.job?.carphotourl,
                                    "status": "In Progress",
                                    "jobstate": "In Progress"
                                    ]
                                
                                let id = self.job?.jobid
                                print("Job ID: \(self.job?.jobid)")
                                
                                let job = Job(uid: id!, dictionary: values)
                                Service.shared.editJob(job) { (error, ref) in
                                    if let error = error {
                                        print("Error adding job: \(error.localizedDescription)")
                                        self.showAlert(title: "Error", message: "There was an issue. Please try again.")
                                    } else {
                                        print("Job added successfully. Reference: \(ref)")
                                        self.showAlert(title: "Success", message: "Image was successfully uploaded!")
                                    }
                                }
                             }
                        case "In Progress":
                            let afterRef = storageRef.child(address).child(uid).child("After").child("\(formattedDate)-\(randomThreeDigitNumber)")
                            afterRef.putData(selectedImage.jpegData(compressionQuality: 0.5)!, metadata: metadata) { (_, error) in
                            // Handle upload completion
                                let values: [String: Any] = [
                                    "streetname": self.job?.streetname,
                                    "streetnumber": self.job?.streetnumber,
                                    "stateaddress": self.job?.stateaddress,
                                    "cityaddress": self.job?.cityaddress,
                                    "zipcode": self.job?.zipcode,
                                    "yardsize": self.job?.yardsize,
                                    "userid": self.job?.userid,
                                    "subid": self.job?.subid,
                                    "proid": self.job?.proid,
                                    "rating": self.job?.rating,
                                    "profilephotourl": self.job?.profilephotourl,
                                    "package": self.job?.package,
                                    "note": self.job?.note,
                                    "jobid": self.job?.jobid,
                                    "frequency": self.job?.frequency,
                                    "day": self.job?.day,
                                    "carphotourl": self.job?.carphotourl,
                                    "status": "Completed",
                                    "jobstate": "Completed"
                                    ]
                                
                                let job = Job(uid: self.job!.jobid, dictionary: values)
                                Service.shared.editJob(job) { (error, ref) in
                                    if let error = error {
                                        print("Error adding job: \(error.localizedDescription)")
                                        self.showAlert(title: "Error", message: "There was an issue. Please try again.")
                                    } else {
                                        print("Job added successfully. Reference: \(ref)")
                                        self.showAlert(title: "Success", message: "Image was successfully uploaded!")
                                    }
                                }
                             }
                        default:
                            print("Invalid option")
                    }
                default:
                    print("Invalid photo option")
                }
            } else {
                // Handle the case where the uid is nil
                print("UID is nil")
            }
        } else {
            print("No image to upload")
        }
    }
    
    func encodeFormData(_ formData: [String: String]) -> Data? {
        var components = URLComponents()
        components.queryItems = formData.map { URLQueryItem(name: $0.key, value: $0.value) }
        return components.query?.data(using: .utf8)
    }

    @objc func completeUpload() {
        if photoType == "jobphoto", let job = job, job.jobstate == "In Progress", let uid = Auth.auth().currentUser?.uid {
            // Replace with your API endpoint URL
            let apiUrl = "https://mowie-pro-server.onrender.com/paypro"
            
            let originalString = job.package  // No need for optional binding
            
            let priceSign: Character = "$"
            let priceStrings = originalString.split(separator: priceSign)
            
            if priceStrings.count > 1 {
                let amount = priceStrings[1]
                
                let feePercentage = 0.05
                var result = Double(amount)! * feePercentage
                print("Parse Value: \(Double(amount)!)")
                result = Double(Int(result * 100)) / 100.0 // Truncate the result to 2 decimal places without rounding
                print("Truncate Result: \(result)")
                let fees = String(format: "%.2f", result)
                
                // Create a dictionary to hold the form data
                let formData: [String: String] = [
                    "amount": String(amount),
                    "fee": fees,
                    "proid": uid
                ]
                
                do {
                    if let encodedData = encodeFormData(formData) {
                        var request = URLRequest(url: URL(string: apiUrl)!)
                        request.httpMethod = "POST"
                        request.httpBody = encodedData
                        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
                        
                        URLSession.shared.dataTask(with: request) { (data, response, error) in
                            if let error = error {
                                print("Error: \(error.localizedDescription)")
                            } else if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                                // Request was successful
                                if let res = String(data: data ?? Data(), encoding: .utf8) {
                                    // Handle the response data
                                    print(res)
                                }
                            } else {
                                // Request failed
                                print("Error: \(String(describing: (response as? HTTPURLResponse)?.statusCode))")
                            }
                        }.resume()
                    }
                }
            }
        }
        dismiss(animated: true, completion: nil)
    }

    // MARK: - Image Picker Delegate
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        if let selectedImage = info[.originalImage] as? UIImage {
            imageView.image = selectedImage
        }
        dismiss(animated: true, completion: nil)
    }

    // MARK: - Helper Methods
    func showPermissionAlert(message: String) {
        let alert = UIAlertController(title: "Permission Required", message: message, preferredStyle: .alert)
        let settingsAction = UIAlertAction(title: "Settings", style: .default) { _ in
            UIApplication.shared.open(URL(string: UIApplication.openSettingsURLString)!, options: [:], completionHandler: nil)
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
        alert.addAction(settingsAction)
        alert.addAction(cancelAction)
        present(alert, animated: true, completion: nil)
    }
    
    // Function to display an alert
        func showAlert(title: String, message: String) {
            let alertController = UIAlertController(title: title, message: message, preferredStyle: .alert)
            let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
            alertController.addAction(okAction)
            present(alertController, animated: true, completion: nil)
        }
}
