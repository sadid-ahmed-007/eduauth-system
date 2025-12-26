-- One-off migration: profile update requests

CREATE TABLE IF NOT EXISTS profile_update_requests (
  request_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  identity_id VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  proposed_full_name VARCHAR(255) NULL,
  proposed_date_of_birth DATE NULL,
  proposed_identity_type ENUM('nid', 'birth_certificate') NULL,
  proposed_identity_number_hash VARCHAR(255) NULL,
  proposed_photo_url VARCHAR(255) NULL,
  proof_document_path VARCHAR(500) NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by VARCHAR(255) NULL,
  reviewer_comment TEXT NULL,
  PRIMARY KEY (request_id),
  KEY idx_profile_request_user (user_id),
  KEY idx_profile_request_status (status),
  CONSTRAINT fk_profile_request_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_profile_request_identity FOREIGN KEY (identity_id) REFERENCES student_identities(identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
