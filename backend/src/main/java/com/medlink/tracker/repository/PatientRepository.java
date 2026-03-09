package com.medlink.tracker.repository;

import com.medlink.tracker.model.Patient;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends MongoRepository<Patient, String> {
    Optional<Patient> findByUserId(String userId);
    List<Patient> findByAssignedDoctorId(String doctorId);
    boolean existsByUserId(String userId);

    /**
     * Full-text style search scoped to a specific doctor.
     * Matches by name, email, phone number, or chronic conditions.
     */
    @Query("{ 'assignedDoctorId': ?0, $or: [ " +
            "{ 'name': { $regex: ?1, $options: 'i' } }, " +
            "{ 'email': { $regex: ?1, $options: 'i' } }, " +
            "{ 'phoneNumber': { $regex: ?1, $options: 'i' } }, " +
            "{ 'chronicConditions': { $elemMatch: { $regex: ?1, $options: 'i' } } }, " +
            "{ 'allergies': { $elemMatch: { $regex: ?1, $options: 'i' } } } " +
            "] }")
    List<Patient> searchByDoctorAndQuery(String doctorId, String query);
}
