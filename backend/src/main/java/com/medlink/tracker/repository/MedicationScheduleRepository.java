package com.medlink.tracker.repository;

import com.medlink.tracker.model.MedicationSchedule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicationScheduleRepository extends MongoRepository<MedicationSchedule, String> {

    List<MedicationSchedule> findByPatientIdAndActiveTrue(String patientId);

    List<MedicationSchedule> findByPatientIdAndActiveTrueAndStartDateBeforeAndEndDateAfter(
            String patientId, LocalDate now1, LocalDate now2);

    List<MedicationSchedule> findByMedicationId(String medicationId);

    List<MedicationSchedule> findByPatientId(String patientId);
}
