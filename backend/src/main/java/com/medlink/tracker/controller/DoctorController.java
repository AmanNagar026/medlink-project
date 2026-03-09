package com.medlink.tracker.controller;

import com.medlink.tracker.model.Doctor;
import com.medlink.tracker.model.Patient;
import com.medlink.tracker.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
@CrossOrigin(origins = "*")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getById(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Doctor> getByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(doctorService.getByUserId(userId));
    }

    @GetMapping
    public ResponseEntity<List<Doctor>> getAll() {
        return ResponseEntity.ok(doctorService.getAll());
    }

    @GetMapping("/specialization/{spec}")
    public ResponseEntity<List<Doctor>> getBySpecialization(@PathVariable String spec) {
        return ResponseEntity.ok(doctorService.getBySpecialization(spec));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Doctor> update(@PathVariable String id, @RequestBody Doctor doctor) {
        return ResponseEntity.ok(doctorService.update(id, doctor));
    }

    @PostMapping("/{doctorId}/patients")
    public ResponseEntity<Void> addPatient(@PathVariable String doctorId,
                                           @RequestBody Map<String, String> body) {
        doctorService.addPatient(doctorId, body.get("patientId"));
        return ResponseEntity.ok().build();
    }
    
    /**
     * Get comprehensive dashboard statistics for a doctor
     * @param doctorId the doctor's ID
     * @return Dashboard statistics including patient and prescription counts
     */
    @GetMapping("/{doctorId}/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@PathVariable String doctorId) {
        Map<String, Object> stats = doctorService.getDoctorDashboardStats(doctorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get latest patients assigned to a doctor for insights section
     * @param doctorId the doctor's ID
     * @param limit number of patients to return (optional, default 10)
     * @return List of recent patients
     */
    @GetMapping("/{doctorId}/patients/latest")
    public ResponseEntity<List<Patient>> getLatestPatients(
            @PathVariable String doctorId,
            @RequestParam(defaultValue = "10") int limit) {
        List<Patient> patients = doctorService.getLatestPatientsForDoctor(doctorId, limit);
        return ResponseEntity.ok(patients);
    }
    
    /**
     * Get real-time dashboard data including stats and latest patients
     * @param doctorId the doctor's ID
     * @return Combined dashboard data with statistics and patient information
     */
    @GetMapping("/{doctorId}/dashboard/realtime")
    public ResponseEntity<Map<String, Object>> getRealTimeDashboard(@PathVariable String doctorId) {
        Map<String, Object> data = doctorService.getRealTimeDashboardData(doctorId);
        return ResponseEntity.ok(data);
    }
}
