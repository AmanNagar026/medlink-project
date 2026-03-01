package com.medlink.tracker.service;

import com.medlink.tracker.exception.ResourceNotFoundException;
import com.medlink.tracker.model.VitalSign;
import com.medlink.tracker.repository.VitalSignRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class VitalSignService {

    @Autowired
    private VitalSignRepository vitalSignRepository;

    public VitalSign create(VitalSign vitalSign) {
        vitalSign.setStatus(calculateStatus(vitalSign));
        vitalSign.setCreatedAt(LocalDateTime.now());
        return vitalSignRepository.save(vitalSign);
    }

    public List<VitalSign> getByPatientId(String patientId) {
        return vitalSignRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
    }

    public VitalSign getLatestByPatientId(String patientId) {
        return vitalSignRepository.findFirstByPatientIdOrderByRecordedAtDesc(patientId);
    }

    public List<VitalSign> getRecentByPatientId(String patientId, int days) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(days);
        return vitalSignRepository.findByPatientIdAndRecordedAtBetweenOrderByRecordedAtDesc(
                patientId, start, end);
    }

    public List<VitalSign> getTrendData(String patientId, String period) {
        switch (period) {
            case "7":
                return vitalSignRepository.findTop7ByPatientIdOrderByRecordedAtDesc(patientId);
            case "30":
                return vitalSignRepository.findTop30ByPatientIdOrderByRecordedAtDesc(patientId);
            case "90":
                return vitalSignRepository.findTop90ByPatientIdOrderByRecordedAtDesc(patientId);
            default:
                return vitalSignRepository.findTop7ByPatientIdOrderByRecordedAtDesc(patientId);
        }
    }

    public VitalSign getById(String id) {
        return vitalSignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vital sign not found: " + id));
    }

    public VitalSign update(String id, VitalSign updatedVital) {
        VitalSign vital = getById(id);
        vital.setSystolicBP(updatedVital.getSystolicBP());
        vital.setDiastolicBP(updatedVital.getDiastolicBP());
        vital.setHeartRate(updatedVital.getHeartRate());
        vital.setGlucose(updatedVital.getGlucose());
        vital.setGlucoseUnit(updatedVital.getGlucoseUnit());
        vital.setStressLevel(updatedVital.getStressLevel());
        vital.setTemperature(updatedVital.getTemperature());
        vital.setTemperatureUnit(updatedVital.getTemperatureUnit());
        vital.setOxygenSaturation(updatedVital.getOxygenSaturation());
        vital.setWeight(updatedVital.getWeight());
        vital.setWeightUnit(updatedVital.getWeightUnit());
        vital.setNotes(updatedVital.getNotes());
        vital.setRecordedAt(updatedVital.getRecordedAt());
        vital.setStatus(calculateStatus(vital));
        return vitalSignRepository.save(vital);
    }

    public void delete(String id) {
        vitalSignRepository.deleteById(id);
    }

    public Map<String, Object> getVitalsSummary(String patientId) {
        VitalSign latest = getLatestByPatientId(patientId);
        Map<String, Object> summary = new HashMap<>();

        if (latest != null) {
            summary.put("bloodPressure", Map.of(
                "systolic", latest.getSystolicBP(),
                "diastolic", latest.getDiastolicBP(),
                "status", getBPStatus(latest.getSystolicBP(), latest.getDiastolicBP())
            ));
            summary.put("heartRate", Map.of(
                "value", latest.getHeartRate(),
                "status", getHeartRateStatus(latest.getHeartRate())
            ));
            summary.put("glucose", Map.of(
                "value", latest.getGlucose(),
                "unit", latest.getGlucoseUnit(),
                "status", getGlucoseStatus(latest.getGlucose())
            ));
            summary.put("stressLevel", Map.of(
                "value", latest.getStressLevel(),
                "status", getStressStatus(latest.getStressLevel())
            ));
            summary.put("lastUpdated", latest.getRecordedAt());
        }

        return summary;
    }

    private String calculateStatus(VitalSign vital) {
        // Calculate overall status based on all vitals
        boolean hasHighBP = vital.getSystolicBP() != null && vital.getSystolicBP() > 140;
        boolean hasHighGlucose = vital.getGlucose() != null && vital.getGlucose() > 180;
        boolean hasHighStress = vital.getStressLevel() != null && vital.getStressLevel() > 7;

        if (hasHighBP || hasHighGlucose) {
            return "HIGH";
        } else if (hasHighStress) {
            return "ELEVATED";
        }
        return "NORMAL";
    }

    private String getBPStatus(Integer systolic, Integer diastolic) {
        if (systolic == null || diastolic == null) return "UNKNOWN";
        if (systolic < 120 && diastolic < 80) return "NORMAL";
        if (systolic < 130 && diastolic < 80) return "ELEVATED";
        if (systolic < 140 || diastolic < 90) return "HIGH_STAGE_1";
        return "HIGH_STAGE_2";
    }

    private String getHeartRateStatus(Integer hr) {
        if (hr == null) return "UNKNOWN";
        if (hr >= 60 && hr <= 100) return "NORMAL";
        if (hr < 60) return "LOW";
        return "HIGH";
    }

    private String getGlucoseStatus(Double glucose) {
        if (glucose == null) return "UNKNOWN";
        if (glucose >= 70 && glucose <= 100) return "NORMAL";
        if (glucose < 70) return "LOW";
        return "HIGH";
    }

    private String getStressStatus(Integer stress) {
        if (stress == null) return "UNKNOWN";
        if (stress <= 3) return "LOW";
        if (stress <= 6) return "MODERATE";
        return "HIGH";
    }
}
