//
//  JobListTableViewCell.swift
//  mowie.ios
//
//  Created by Treyvon Cortez Johnson on 12/31/23.
//

import UIKit

class JobListTableViewCell: UITableViewCell {
    // Properties for your cell content
    let streetAddressLabel = UILabel()
    let frequencyLabel = UILabel()
    let statusLabel = UILabel()
    let packageLabel = UILabel()
    let dayLabel = UILabel()
    let deleteButton = UIButton()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        print("Job Card")
        // Configure your labels
        streetAddressLabel.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        frequencyLabel.font = UIFont.systemFont(ofSize: 12)
        statusLabel.font = UIFont.systemFont(ofSize: 12)
        packageLabel.font = UIFont.systemFont(ofSize: 12)
        
        // Configure your dayLabel and deleteButton if needed
        selectionStyle = .none
        
        // Create vertical stack view for frequency, status, and package labels
        let labelsStackView = UIStackView(arrangedSubviews: [streetAddressLabel, frequencyLabel, statusLabel, packageLabel])
        labelsStackView.axis = .vertical
        labelsStackView.spacing = 4
        labelsStackView.distribution = .fillProportionally
        
        addSubview(labelsStackView)
        
        labelsStackView.centerY(inView: self, leftAnchor: leftAnchor, paddingLeft: 12)
        
        // Add dayLabel and deleteButton to the contentView
        //addSubview(dayLabel)
        //addSubview(deleteButton)

    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
