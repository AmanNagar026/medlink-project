package com.medlink.tracker.service;

import com.medlink.tracker.exception.ResourceNotFoundException;
import com.medlink.tracker.model.Doctor;
import com.medlink.tracker.model.Patient;
import com.medlink.tracker.model.Prescription;
import com.medlink.tracker.repository.DoctorRepository;
import com.medlink.tracker.repository.PatientRepository;
import com.medlink.tracker.repository.PrescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private PrescriptionRepository prescriptionRepository;

    public Doctor getById(String id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + id));
    }

    public Doctor getByUserId(String userId) {
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + userId));
    }

    public List<Doctor> getAll() {
        return doctorRepository.findAll();
    }

    public List<Doctor> getBySpecialization(String specialization) {
        return doctorRepository.findBySpecialization(specialization);
    }

    public Doctor update(String id, Doctor updatedDoctor) {
        Doctor doctor = getById(id);
        // Basic identity & contact details
        doctor.setName(updatedDoctor.getName());
        doctor.setEmail(updatedDoctor.getEmail());
        doctor.setPhoneNumber(updatedDoctor.getPhoneNumber());

        // Professional information
        doctor.setSpecialization(updatedDoctor.getSpecialization());
        doctor.setLicenseNumber(updatedDoctor.getLicenseNumber());
        doctor.setHospital(updatedDoctor.getHospital());
        doctor.setDepartment(updatedDoctor.getDepartment());
        doctor.setQualifications(updatedDoctor.getQualifications());
        doctor.setYearsOfExperience(updatedDoctor.getYearsOfExperience());
        doctor.setConsultationTimings(updatedDoctor.getConsultationTimings());
        doctor.setAvailable(updatedDoctor.isAvailable());

        // Profile image
        doctor.setProfileImageUrl(updatedDoctor.getProfileImageUrl());

        doctor.setUpdatedAt(LocalDateTime.now());
        return doctorRepository.save(doctor);
    }

    public void addPatient(String doctorId, String patientId) {
        Doctor doctor = getById(doctorId);
        List<String> patients = doctor.getPatientIds() != null ? doctor.getPatientIds() : new java.util.ArrayList<>();
        if (!patients.contains(patientId)) {
            patients.add(patientId);
            doctor.setPatientIds(patients);
            doctorRepository.save(doctor);
        }
    }
    
    /**
     * Get comprehensive dashboard statistics for a doctor
     * @param doctorId the doctor's ID
     * @return Map containing dashboard statistics
     */
    public Map<String, Object> getDoctorDashboardStats(String doctorId) {
        Map<String, Object> stats = new HashMap<>();
        
        // Get all prescriptions for this doctor
        List<Prescription> prescriptions = prescriptionRepository.findByDoctorId(doctorId);
        
        // Get all patients assigned to this doctor
        List<Patient> patients = patientRepository.findByAssignedDoctorId(doctorId);
        
        // Calculate statistics
        int totalPatients = patients.size();
        int activePrescriptions = 0;
        int completedPrescriptions = 0;
        int expiringSoon = 0;
        
        LocalDate today = LocalDate.now();
        
        for (Prescription prescription : prescriptions) {
            String status = prescription.getStatus();
            LocalDate expiryDate = prescription.getExpiryDate();
            
            // Count completed prescriptions
            if ("COMPLETED".equals(status)) {
                completedPrescriptions++;
                continue;
            }
            
            // For active prescriptions, check expiry status
            if (expiryDate != null) {
                long daysUntilExpiry = java.time.temporal.ChronoUnit.DAYS.between(today, expiryDate);
                
                // Active prescription (not expired and not completed)
                if (daysUntilExpiry >= 0) {
                    activePrescriptions++;
                    
                    // Expiring within 7 days
                    if (daysUntilExpiry <= 7) {
                        expiringSoon++;
                    }
                }
            } else {
                // No expiry date set, consider as active
                activePrescriptions++;
            }
        }
        
        stats.put("totalPatients", totalPatients);
        stats.put("activePrescriptions", activePrescriptions);
        stats.put("completedPrescriptions", completedPrescriptions);
        stats.put("expiringSoon", expiringSoon);
        stats.put("lastUpdated", LocalDateTime.now());
        
        return stats;
    }
    
    /**
     * Get latest patients assigned to a doctor for insights section
     * @param doctorId the doctor's ID
     * @param limit number of patients to return (default 10)
     * @return List of recent patients with full details
     */
    public List<Patient> getLatestPatientsForDoctor(String doctorId, int limit) {
        List<Patient> patients = patientRepository.findByAssignedDoctorId(doctorId);
        
        // Sort by creation date (newest first) and limit results
        return patients.stream()
                .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                .limit(limit > 0 ? limit : 10)
                .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * Get real-time dashboard data including stats and latest patients
     * @param doctorId the doctor's ID
     * @return Map containing both statistics and patient data
     */
    public Map<String, Object> getRealTimeDashboardData(String doctorId) {
        Map<String, Object> data = new HashMap<>();
        
        // Get statistics
        Map<String, Object> stats = getDoctorDashboardStats(doctorId);
        data.put("stats", stats);
        
        // Get latest patients for insights (limit to 5 for dashboard)
        List<Patient> latestPatients = getLatestPatientsForDoctor(doctorId, 5);
        data.put("patients", latestPatients);
        
        // Add timestamp
        data.put("timestamp", LocalDateTime.now());
        
        return data;
    }
}
