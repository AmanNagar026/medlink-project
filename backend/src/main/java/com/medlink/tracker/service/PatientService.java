package com.medlink.tracker.service;

import com.medlink.tracker.exception.ResourceNotFoundException;
import com.medlink.tracker.model.Patient;
import com.medlink.tracker.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorService doctorService;

    public Patient getById(String id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + id));
    }

    public Patient getByUserId(String userId) {
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + userId));
    }

    public List<Patient> getByDoctorId(String doctorId) {
        return patientRepository.findByAssignedDoctorId(doctorId);
    }

    public Patient update(String id, Patient updatedPatient) {
        Patient patient = getById(id);
        patient.setDateOfBirth(updatedPatient.getDateOfBirth());
        patient.setGender(updatedPatient.getGender());
        patient.setBloodGroup(updatedPatient.getBloodGroup());
        patient.setAddress(updatedPatient.getAddress());
        patient.setAllergies(updatedPatient.getAllergies());
        patient.setChronicConditions(updatedPatient.getChronicConditions());
        patient.setEmergencyContactName(updatedPatient.getEmergencyContactName());
        patient.setEmergencyContactPhone(updatedPatient.getEmergencyContactPhone());
        patient.setPhoneNumber(updatedPatient.getPhoneNumber());
        patient.setUpdatedAt(LocalDateTime.now());
        return patientRepository.save(patient);
    }

    public Patient create(Patient patient) {
        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedAt(LocalDateTime.now());
        Patient savedPatient = patientRepository.save(patient);
        // Sync Doctor.patientIds for proper Doctor → Patient relationship
        if (savedPatient.getAssignedDoctorId() != null && !savedPatient.getAssignedDoctorId().isBlank()) {
            doctorService.addPatient(savedPatient.getAssignedDoctorId(), savedPatient.getId());
        }
        return savedPatient;
    }

    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    /**
     * Search patients for a specific doctor by free-text query.
     * Supports matching by name, email, phone, chronic condition, allergy, and exact ID.
     */
    public List<Patient> searchByDoctorAndQuery(String doctorId, String query) {
        if (doctorId == null || doctorId.isBlank()) {
            throw new IllegalArgumentException("doctorId is required");
        }

        if (query == null || query.trim().isEmpty()) {
            return getByDoctorId(doctorId);
        }

        String trimmed = query.trim();
        List<Patient> results = new ArrayList<>(patientRepository.searchByDoctorAndQuery(doctorId, trimmed));

        // Additionally support direct search by patient ID
        if (trimmed.matches("^[0-9a-fA-F]{24}$")) {
            patientRepository.findById(trimmed).ifPresent(patient -> {
                if (doctorId.equals(patient.getAssignedDoctorId())
                        && results.stream().noneMatch(p -> p.getId().equals(patient.getId()))) {
                    results.add(0, patient);
                }
            });
        }

        return results;
    }
}
