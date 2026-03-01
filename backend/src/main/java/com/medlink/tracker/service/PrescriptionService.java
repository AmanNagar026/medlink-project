package com.medlink.tracker.service;

import com.medlink.tracker.exception.ResourceNotFoundException;
import com.medlink.tracker.model.Prescription;
import com.medlink.tracker.repository.PrescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    public Prescription create(Prescription prescription) {
        prescription.setPrescribedDate(LocalDate.now());
        prescription.setStatus("ACTIVE");
        prescription.setCreatedAt(LocalDateTime.now());
        prescription.setUpdatedAt(LocalDateTime.now());
        return prescriptionRepository.save(prescription);
    }

    public List<Prescription> getByPatientId(String patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    public List<Prescription> getByDoctorId(String doctorId) {
        List<Prescription> prescriptions = prescriptionRepository.findByDoctorId(doctorId);
        // Compute status based on expiry date
        LocalDate today = LocalDate.now();
        for (Prescription rx : prescriptions) {
            String computedStatus = computeStatus(rx, today);
            rx.setStatus(computedStatus);
        }
        return prescriptions;
    }

    private String computeStatus(Prescription rx, LocalDate today) {
        if (rx.getExpiryDate() == null) return rx.getStatus() != null ? rx.getStatus() : "ACTIVE";
        
        // If manually marked as completed, respect that
        if ("COMPLETED".equals(rx.getStatus())) return "COMPLETED";
        if ("CANCELLED".equals(rx.getStatus())) return "CANCELLED";
        
        LocalDate expiry = rx.getExpiryDate();
        long daysUntilExpiry = today.until(expiry).getDays();
        
        if (daysUntilExpiry < 0) return "EXPIRED";
        if (daysUntilExpiry <= 7) return "EXPIRING_SOON";
        return "ACTIVE";
    }

    public Prescription getById(String id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found: " + id));
    }

    public Prescription updateStatus(String id, String status) {
        Prescription prescription = getById(id);
        prescription.setStatus(status);
        prescription.setUpdatedAt(LocalDateTime.now());
        return prescriptionRepository.save(prescription);
    }

    public List<Prescription> getActiveByPatient(String patientId) {
        return prescriptionRepository.findByPatientIdAndStatus(patientId, "ACTIVE");
    }

    public void delete(String id) {
        prescriptionRepository.deleteById(id);
    }
}
