package com.medlink.tracker.repository;

import com.medlink.tracker.model.IntakeLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface IntakeLogRepository extends MongoRepository<IntakeLog, String> {
    List<IntakeLog> findByPatientId(String patientId);
    List<IntakeLog> findByPatientIdAndScheduledDate(String patientId, LocalDate date);
    List<IntakeLog> findByPrescriptionId(String prescriptionId);
    List<IntakeLog> findByPatientIdAndStatus(String patientId, String status);
    List<IntakeLog> findByPatientIdAndScheduledDateBetween(String patientId, LocalDate start, LocalDate end);
    long countByPatientIdAndStatus(String patientId, String status);
    boolean existsByPatientIdAndMedicationNameAndScheduledDateAndScheduledTime(
            String patientId,
            String medicationName,
            LocalDate scheduledDate,
            String scheduledTime
    );
}
