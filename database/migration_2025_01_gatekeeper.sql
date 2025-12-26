-- One-off migration: gatekeeper/enrollment updates
-- Preflight: ensure no duplicates before adding unique keys
SELECT institution_id, student_id, COUNT(*) AS duplicate_count
FROM institution_enrollments
GROUP BY institution_id, student_id
HAVING COUNT(*) > 1;

SELECT institution_id, local_student_id, COUNT(*) AS duplicate_count
FROM institution_enrollments
GROUP BY institution_id, local_student_id
HAVING COUNT(*) > 1;

ALTER TABLE institutions
  MODIFY institution_type ENUM('university','college','polytechnic','vocational_school','training_center','board') NOT NULL;

ALTER TABLE institution_enrollments
  ADD UNIQUE KEY idx_enrollment_institution_student (institution_id, student_id),
  ADD UNIQUE KEY idx_enrollment_institution_local (institution_id, local_student_id);
