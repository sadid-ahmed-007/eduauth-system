-- ============================================
-- EduAuth Registry - FINAL PRODUCTION SCHEMA
-- ============================================

-- 1. CLEAN SLATE (Fixes #1451)
DROP DATABASE IF EXISTS eduauth_registry;
CREATE DATABASE eduauth_registry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eduauth_registry;

-- ============================================
-- CORE AUTHENTICATION
-- ============================================

-- Table 1: users
CREATE TABLE users (
  user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  -- Added 'admin' to support your new Dashboard
  role ENUM('student', 'institution', 'authority', 'recruiter', 'admin') NOT NULL,
  status ENUM('active', 'suspended', 'pending', 'rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  failed_login_attempts TINYINT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY idx_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROFILES & IDENTITIES
-- ============================================

-- Table 2: student_identities (Sensitive Data)
CREATE TABLE student_identities (
  identity_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  identity_type ENUM('nid', 'birth_certificate') DEFAULT 'nid',
  identity_number_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'other') NULL,
  phone VARCHAR(20) NULL,
  address TEXT NULL,
  verification_document_path VARCHAR(500) NULL,
  identity_verified TINYINT(1) NOT NULL DEFAULT 0,
  verified_by VARCHAR(255) NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id),
  UNIQUE KEY idx_identity_user (user_id),
  UNIQUE KEY idx_identity_hash (identity_number_hash),
  CONSTRAINT fk_identity_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: students (Public Profile)
CREATE TABLE students (
  student_id VARCHAR(255) NOT NULL,
  identity_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  student_number VARCHAR(50) NULL,
  photo_url VARCHAR(255) NULL, -- Added for your UI
  profile_visibility ENUM('public', 'private', 'recruiter_only') NOT NULL DEFAULT 'private',
  allow_recruiter_contact TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  UNIQUE KEY idx_student_identity (identity_id),
  UNIQUE KEY idx_student_user (user_id),
  CONSTRAINT fk_student_identity FOREIGN KEY (identity_id) REFERENCES student_identities(identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: institutions (University/Board)
CREATE TABLE institutions (
  institution_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  institution_name VARCHAR(255) NOT NULL,
  institution_type ENUM('university', 'college', 'vocational_school', 'training_center', 'board') NOT NULL,
  registration_number VARCHAR(100) NOT NULL,
  address TEXT NULL,
  website VARCHAR(255) NULL,
  contact_email VARCHAR(255) NULL,
  can_issue_certificates BOOLEAN DEFAULT TRUE, -- Added for Admin Control
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending', -- Added for Approval Flow
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verified_by VARCHAR(255) NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (institution_id),
  UNIQUE KEY idx_institution_user (user_id),
  UNIQUE KEY idx_institution_reg (registration_number),
  CONSTRAINT fk_institution_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: recruiters
CREATE TABLE recruiters (
  recruiter_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_registration VARCHAR(100) NULL,
  industry VARCHAR(100) NULL,
  contact_person VARCHAR(255) NULL,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(20) NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verified_by VARCHAR(255) NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (recruiter_id),
  UNIQUE KEY idx_recruiter_user (user_id),
  CONSTRAINT fk_recruiter_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ACADEMIC REGISTRY & CERTIFICATES
-- ============================================

-- Table 6: institution_enrollments (NEW: For "My Students" Feature)
CREATE TABLE institution_enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id VARCHAR(255) NOT NULL,
    student_id VARCHAR(255) NOT NULL, 
    local_student_id VARCHAR(50) NOT NULL, 
    department VARCHAR(100) NOT NULL,
    session_year VARCHAR(20) NOT NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 7: certificates
CREATE TABLE certificates (
  certificate_id VARCHAR(255) NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  issuer_id VARCHAR(255) NOT NULL,
  certificate_type VARCHAR(50) NOT NULL,
  credential_name VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255) NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NULL,
  grade_gpa VARCHAR(20) NULL,
  certificate_hash VARCHAR(255) NOT NULL, -- Core for Verification
  metadata JSON NULL, -- Stores flexible extra data
  status ENUM('active', 'revoked', 'pending') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (certificate_id),
  UNIQUE KEY idx_certificate_hash (certificate_hash),
  CONSTRAINT fk_certificate_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT fk_certificate_issuer FOREIGN KEY (issuer_id) REFERENCES institutions(institution_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 8: approval_requests (For Certificates needing approval)
CREATE TABLE approval_requests (
  request_id VARCHAR(255) NOT NULL,
  certificate_id VARCHAR(255) NOT NULL,
  institution_id VARCHAR(255) NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  request_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id),
  CONSTRAINT fk_approval_cert FOREIGN KEY (certificate_id) REFERENCES certificates(certificate_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- LOGS & SETTINGS
-- ============================================

-- Table 9: verification_logs (For "Scan History")
CREATE TABLE verification_logs (
  log_id VARCHAR(255) NOT NULL,
  certificate_id VARCHAR(255) NOT NULL,
  verifier_type ENUM('public', 'recruiter', 'institution') NOT NULL DEFAULT 'public',
  verification_result ENUM('valid', 'invalid') NOT NULL,
  ip_address VARCHAR(45) NULL,
  verified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  CONSTRAINT fk_ver_log_cert FOREIGN KEY (certificate_id) REFERENCES certificates(certificate_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 10: audit_logs (System Security)
CREATE TABLE audit_logs (
  log_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NULL,
  action_type VARCHAR(100) NOT NULL,
  action_result ENUM('success', 'failure') NOT NULL,
  ip_address VARCHAR(45) NULL,
  timestamp DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 11: system_settings
CREATE TABLE system_settings (
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('max_login_attempts', '5', 'Lock account after 5 failed tries'),
('recruiter_approval_required', 'true', 'Recruiters must be approved by Admin');