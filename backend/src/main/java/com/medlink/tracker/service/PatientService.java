package com.medlink.tracker.service;

import com.medlink.tracker.exception.ResourceNotFoundException;
import com.medlink.tracker.model.DashboardSummary;
import com.medlink.tracker.model.IntakeLog;
import com.medlink.tracker.model.Patient;
import com.medlink.tracker.repository.IntakeLogRepository;
import com.medlink.tracker.repository.MedicationScheduleRepository;
import com.medlink.tracker.repository.PatientRepository;
import com.medlink.tracker.repository.PrescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private MedicationScheduleRepository medicationScheduleRepository;

    @Autowired
    private IntakeLogRepository intakeLogRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

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
        patient.setName(updatedPatient.getName());
        patient.setEmail(updatedPatient.getEmail());
        patient.setAge(updatedPatient.getAge());
        patient.setDateOfBirth(updatedPatient.getDateOfBirth());
        patient.setGender(updatedPatient.getGender());
        patient.setBloodGroup(updatedPatient.getBloodGroup());
        patient.setHeight(updatedPatient.getHeight());
        patient.setWeight(updatedPatient.getWeight());
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
        // Sync Doctor.patientIds for proper Doctor -> Patient relationship
        if (savedPatient.getAssignedDoctorId() != null && !savedPatient.getAssignedDoctorId().isBlank()) {
            doctorService.addPatient(savedPatient.getAssignedDoctorId(), savedPatient.getId());
        }
        return savedPatient;
    }

    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    public DashboardSummary getDashboardSummary(String patientId) {
        // Ensure patient exists so callers get a clear 404 when using an invalid id.
        getById(patientId);

        DashboardSummary summary = new DashboardSummary();
        summary.setPatientId(patientId);

        int activeMedications = medicationScheduleRepository.findByPatientIdAndActiveTrue(patientId).size();
        int activePrescriptions = prescriptionRepository.findByPatientIdAndStatus(patientId, "ACTIVE").size();

        LocalDate today = LocalDate.now();
        List<IntakeLog> todayLogs = intakeLogRepository.findByPatientIdAndScheduledDate(patientId, today);

        long takenToday = todayLogs.stream().filter(log -> "TAKEN".equals(log.getStatus())).count();
        long missedToday = todayLogs.stream()
                .filter(log -> "MISSED".equals(log.getStatus()) || "SKIPPED".equals(log.getStatus()))
                .count();
        long pendingToday = todayLogs.stream().filter(log -> "PENDING".equals(log.getStatus())).count();

        long totalTaken = intakeLogRepository.countByPatientIdAndStatus(patientId, "TAKEN");
        long totalMissed = intakeLogRepository.countByPatientIdAndStatus(patientId, "MISSED")
                + intakeLogRepository.countByPatientIdAndStatus(patientId, "SKIPPED");
        long totalMeasured = totalTaken + totalMissed;
        int adherenceRate = totalMeasured == 0 ? 0 : (int) Math.round(((double) totalTaken / totalMeasured) * 100);

        LocalDate weekStart = today.minusDays(6);
        List<IntakeLog> lastSevenDays = intakeLogRepository.findByPatientIdAndScheduledDateBetween(patientId, weekStart, today);

        int streakDays = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate date = today.minusDays(i);
            boolean hasTaken = lastSevenDays.stream()
                    .anyMatch(log -> date.equals(log.getScheduledDate()) && "TAKEN".equals(log.getStatus()));
            if (hasTaken) {
                streakDays++;
            } else {
                break;
            }
        }

        summary.setActiveMedications(activeMedications);
        summary.setPrescriptions(activePrescriptions);
        summary.setTakenToday((int) takenToday);
        summary.setMissedToday((int) missedToday);
        summary.setPendingToday((int) pendingToday);
        summary.setTotalToday(todayLogs.size());
        summary.setAdherenceRate(adherenceRate);
        summary.setStreakDays(streakDays);

        return summary;
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
