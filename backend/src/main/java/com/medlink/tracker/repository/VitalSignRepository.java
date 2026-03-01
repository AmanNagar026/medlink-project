package com.medlink.tracker.repository;

import com.medlink.tracker.model.VitalSign;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VitalSignRepository extends MongoRepository<VitalSign, String> {

    List<VitalSign> findByPatientIdOrderByRecordedAtDesc(String patientId);

    List<VitalSign> findByPatientIdAndRecordedAtBetweenOrderByRecordedAtDesc(
            String patientId, LocalDateTime start, LocalDateTime end);

    VitalSign findFirstByPatientIdOrderByRecordedAtDesc(String patientId);

    List<VitalSign> findTop7ByPatientIdOrderByRecordedAtDesc(String patientId);

    List<VitalSign> findTop30ByPatientIdOrderByRecordedAtDesc(String patientId);

    List<VitalSign> findTop90ByPatientIdOrderByRecordedAtDesc(String patientId);
}
