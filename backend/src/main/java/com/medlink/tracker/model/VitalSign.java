package com.medlink.tracker.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "vital_signs")
public class VitalSign {

    @Id
    private String id;

    private String patientId;
    private String patientName;

    // Blood Pressure
    private Integer systolicBP;
    private Integer diastolicBP;

    // Heart Rate
    private Integer heartRate;

    // Blood Glucose
    private Double glucose;
    private String glucoseUnit; // mg/dL or mmol/L

    // Stress Level (1-10)
    private Integer stressLevel;

    // Temperature
    private Double temperature;
    private String temperatureUnit; // Celsius or Fahrenheit

    // Oxygen Saturation
    private Integer oxygenSaturation;

    // Weight
    private Double weight;
    private String weightUnit; // kg or lbs

    // Notes
    private String notes;

    // Status - calculated based on values
    private String status; // NORMAL, ELEVATED, HIGH, LOW

    private LocalDateTime recordedAt = LocalDateTime.now();
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors
    public VitalSign() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public Integer getSystolicBP() { return systolicBP; }
    public void setSystolicBP(Integer systolicBP) { this.systolicBP = systolicBP; }

    public Integer getDiastolicBP() { return diastolicBP; }
    public void setDiastolicBP(Integer diastolicBP) { this.diastolicBP = diastolicBP; }

    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }

    public Double getGlucose() { return glucose; }
    public void setGlucose(Double glucose) { this.glucose = glucose; }

    public String getGlucoseUnit() { return glucoseUnit; }
    public void setGlucoseUnit(String glucoseUnit) { this.glucoseUnit = glucoseUnit; }

    public Integer getStressLevel() { return stressLevel; }
    public void setStressLevel(Integer stressLevel) { this.stressLevel = stressLevel; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public String getTemperatureUnit() { return temperatureUnit; }
    public void setTemperatureUnit(String temperatureUnit) { this.temperatureUnit = temperatureUnit; }

    public Integer getOxygenSaturation() { return oxygenSaturation; }
    public void setOxygenSaturation(Integer oxygenSaturation) { this.oxygenSaturation = oxygenSaturation; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public String getWeightUnit() { return weightUnit; }
    public void setWeightUnit(String weightUnit) { this.weightUnit = weightUnit; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
