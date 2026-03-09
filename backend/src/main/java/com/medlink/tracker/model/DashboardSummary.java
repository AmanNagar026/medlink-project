package com.medlink.tracker.model;

public class DashboardSummary {

    private String patientId;
    private int activeMedications;
    private int prescriptions;
    private int takenToday;
    private int missedToday;
    private int pendingToday;
    private int totalToday;
    private int adherenceRate;
    private int streakDays;

    public DashboardSummary() {}

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public int getActiveMedications() {
        return activeMedications;
    }

    public void setActiveMedications(int activeMedications) {
        this.activeMedications = activeMedications;
    }

    public int getPrescriptions() {
        return prescriptions;
    }

    public void setPrescriptions(int prescriptions) {
        this.prescriptions = prescriptions;
    }

    public int getTakenToday() {
        return takenToday;
    }

    public void setTakenToday(int takenToday) {
        this.takenToday = takenToday;
    }

    public int getMissedToday() {
        return missedToday;
    }

    public void setMissedToday(int missedToday) {
        this.missedToday = missedToday;
    }

    public int getPendingToday() {
        return pendingToday;
    }

    public void setPendingToday(int pendingToday) {
        this.pendingToday = pendingToday;
    }

    public int getTotalToday() {
        return totalToday;
    }

    public void setTotalToday(int totalToday) {
        this.totalToday = totalToday;
    }

    public int getAdherenceRate() {
        return adherenceRate;
    }

    public void setAdherenceRate(int adherenceRate) {
        this.adherenceRate = adherenceRate;
    }

    public int getStreakDays() {
        return streakDays;
    }

    public void setStreakDays(int streakDays) {
        this.streakDays = streakDays;
    }
}
