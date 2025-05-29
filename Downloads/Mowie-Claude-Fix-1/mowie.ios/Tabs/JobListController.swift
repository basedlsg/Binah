//
//  JobListController.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/14/23.
//

import UIKit
import FirebaseAuth

private let reuseIdentifier = "JobCardCell"

class JobListController: UITabBarController {
    // MARK: Properties
    
    var filteredData: [Job] = []
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "JOB BOARD"
        label.font = UIFont(name: "Avenir-Light", size:36)
        label.textColor = UIColor(white: 1, alpha: 0.8)
        
        return label
    }()
    
    var data: [Job] = []
    private var isSearchActive = false
    private let searchBar = UISearchBar()
    private let tableView = UITableView()
    
    let logoImageView = UIImageView(image: UIImage(named: "mowietranssplash"))
    
    override func viewDidLoad() {
        super.viewDidLoad()
        searchBar.delegate = self
        
        print("Inside Job List")
        
        view.backgroundColor = .systemBackground // or any color you want
        edgesForExtendedLayout = [] // Ensures safe area layout
        
        setupNavigationBar()
        getJobs()
    }
    
    func getJobs() {
        Service().getJobList() { jobs in
            // Do something with the fetched jobs
            for job in jobs {
                print(job)
                self.data.append(job)
            }
            DispatchQueue.main.async {
                // Update UI or perform other tasks with the fetched data
                self.configureUI()
                //self.tableView.reloadData()
                print(self.data.count)
            }
        }
    }
    
    func setupNavigationBar() {
        // Logo in the middle
        logoImageView.contentMode = .scaleAspectFill
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        logoImageView.widthAnchor.constraint(equalToConstant: 130).isActive = true
        logoImageView.heightAnchor.constraint(equalToConstant: 200).isActive = true

        navigationItem.titleView = logoImageView

        // Search button on the right
        let searchButton = UIBarButtonItem(image: UIImage(systemName: "magnifyingglass"), style: .plain, target: self, action: #selector(toggleSearchBar))
        searchButton.tintColor = .white
        navigationItem.rightBarButtonItem = searchButton
        
        if let textField = searchBar.value(forKey: "searchField") as? UITextField {
            textField.textColor = .white
            textField.tintColor = .white
            textField.attributedPlaceholder = NSAttributedString(
                string: "Search",
                attributes: [.foregroundColor: UIColor.white.withAlphaComponent(0.5)]
            )
        }
    }

    @objc func toggleSearchBar() {
        if isSearchActive {
            UIView.transition(with: navigationController!.navigationBar, duration: 0.3, options: .transitionCrossDissolve) {
                self.navigationItem.titleView = self.logoImageView
            }
            searchBar.text = ""
            isSearchActive = false
            tableView.reloadData()
        } else {
            UIView.transition(with: navigationController!.navigationBar, duration: 0.3, options: .transitionCrossDissolve) {
                self.navigationItem.titleView = self.searchBar
            }
            searchBar.showsCancelButton = true
            isSearchActive = true
        }
    }
    
    // FOR TABLE
    func configureUI() {
        print("Config UI")
        view.backgroundColor = .lightGray
        
        setTableViewDelegates()
        view.addSubview(tableView)
        tableView.backgroundColor = .clear
        tableView.separatorStyle = .singleLine
        tableView.isScrollEnabled = true
        tableView.rowHeight = 150
        
        // Add Auto Layout constraints (adjust as needed)
        tableView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        
    }
    
    func setTableViewDelegates() {
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(JobCardTableViewCell.self, forCellReuseIdentifier: reuseIdentifier)
    }
    
    func createLabel(withText text: String) -> UILabel {
        let label = UILabel()
        label.text = text
        label.numberOfLines = 0
        label.textAlignment = .left
        label.textColor = .black
        return label
    }
    
    func presentAcceptJobAlert(job: Job) {
        let alertController = buildAcceptJobAlert(for: job)
        
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)
        alertController.addAction(cancelAction)
        
        let submitAction = UIAlertAction(title: "Submit", style: .destructive) { [weak self] _ in
                self?.handleJobAcceptance(for: job)
            }
        alertController.addAction(submitAction)
        
        present(alertController, animated: true, completion: nil)
    }
    
    private func buildAcceptJobAlert(for job: Job) -> UIAlertController {
        let alertController = UIAlertController(title: "Accept this Job?", message: nil, preferredStyle: .alert)
        
        let labels: [String: String] = [
            "Street Name": job.streetname,
            "City": job.cityaddress,
            "State": job.stateaddress,
            "Job Note": job.note,
            "Job Frequency": job.frequency,
            "Service Day": job.day
        ]
        
        var alertMessage = ""
            
            for (labelText, value) in labels {
                alertMessage += "\(labelText): \(value)\n"
            }
        
        let streetLabel = "Street Name: \(job.streetname)\n"
        let cityLabel = "City: \(job.cityaddress)\n"
        let stateLabel = "State: \(job.stateaddress)\n"
        let noteLabel = "Job Note: \(job.note)\n"
        let freqLabel = "Job Frequency: \(job.frequency)\n"
        let dayLabel = "Service Day: \(job.day)\n"
        
        let multilineString = [streetLabel, cityLabel, stateLabel, noteLabel, freqLabel, dayLabel].joined(separator: "\n")
            
        alertController.message = multilineString //alertMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        
        return alertController
    }
    
    private func handleJobAcceptance(for job: Job) {
        guard let uid = Auth.auth().currentUser?.uid else { return }
        
        var jobDictionary = [String: Any]()
        
        // Setting values in the dictionary
        jobDictionary["streetname"] = job.streetname
        jobDictionary["streetnumber"] = job.streetnumber
        jobDictionary["stateaddress"] = job.stateaddress
        jobDictionary["cityaddress"] = job.cityaddress
        jobDictionary["zipcode"] = job.zipcode
        jobDictionary["yardsize"] = job.yardsize
        jobDictionary["userid"] = job.userid
        jobDictionary["subid"] = job.subid
        jobDictionary["proid"] = uid
        jobDictionary["rating"] = job.rating
        jobDictionary["profilephotourl"] = job.profilephotourl
        jobDictionary["package"] = job.package
        jobDictionary["note"] = job.note
        jobDictionary["jobid"] = job.jobid
        jobDictionary["frequency"] = job.frequency
        jobDictionary["day"] = job.day
        jobDictionary["carphotourl"] = job.carphotourl
        jobDictionary["status"] = "Accepted"
        jobDictionary["jobstate"] = "Standby"
        
        let jobId = jobDictionary["jobid"]
        
        let newJob = Job(uid: jobId as! String, dictionary: jobDictionary)
        
        Service.shared.editJob(newJob) { (error, ref) in
            if let error = error {
                print("Error accepting job: \(error.localizedDescription)")
            } else {
                print("Job accepted successfully. Reference: \(ref)")
                self.tableView.reloadData()
            }
        }
        // Reload the tableView to reflect the changes
        let jobListController = TabController()
        let navigationController = UINavigationController(rootViewController: jobListController)
        navigationController.modalPresentationStyle = .fullScreen
        self.present(navigationController, animated: true, completion: nil)
    }
}

// MARK: - TableView Delegates

extension JobListController: UITableViewDelegate, UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return isSearchActive ? filteredData.count : data.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: reuseIdentifier, for: indexPath) as! JobCardTableViewCell
        
        let job = isSearchActive ? filteredData[indexPath.row] : data[indexPath.row]
        
        // Configure the cell with job data
        cell.streetAddressLabel.text = "\(job.streetname)"
        cell.frequencyLabel.text = "Frequency: \(job.frequency)"
        cell.statusLabel.text = "Status: \(job.jobstate)"
        cell.packageLabel.text = "Package: \(job.package)"
        // Configure dayLabel and deleteButton
        print(cell.streetAddressLabel)
        return cell
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        return section == 0 ? "List of available jobs" : ""
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        // Calculate and return the height for the cell
        return 100
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        // Get the selected job
        let selectedJob = isSearchActive ? filteredData[indexPath.row] : data[indexPath.row]
        print(selectedJob)
        presentAcceptJobAlert(job: selectedJob)
    }
}

extension JobListController: UISearchBarDelegate {
    func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
        guard !searchText.isEmpty else {
            isSearchActive = false
            tableView.reloadData()
            return
        }

        isSearchActive = true
        filteredData = data.filter {
            $0.cityaddress.lowercased().contains(searchText.lowercased()) ||
            $0.package.lowercased().contains(searchText.lowercased()) ||
            $0.day.lowercased().contains(searchText.lowercased())
        }
        tableView.reloadData()
    }

    func searchBarCancelButtonClicked(_ searchBar: UISearchBar) {
        isSearchActive = false
        searchBar.text = ""
        searchBar.showsCancelButton = false
        navigationItem.titleView = logoImageView
        searchBar.resignFirstResponder()
        tableView.reloadData()
    }
}

