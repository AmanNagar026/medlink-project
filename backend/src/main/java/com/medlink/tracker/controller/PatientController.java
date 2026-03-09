package com.medlink.tracker.controller;

import com.medlink.tracker.model.Patient;
import com.medlink.tracker.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient")
@CrossOrigin(origins = "*")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @PostMapping
    public ResponseEntity<Patient> create(@RequestBody Patient patient) {
        return ResponseEntity.ok(patientService.create(patient));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getById(@PathVariable String id) {
        return ResponseEntity.ok(patientService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Patient> getByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(patientService.getByUserId(userId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Patient>> getByDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(patientService.getByDoctorId(doctorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Patient> update(@PathVariable String id, @RequestBody Patient patient) {
        return ResponseEntity.ok(patientService.update(id, patient));
    }

    @GetMapping
    public ResponseEntity<List<Patient>> getAll() {
        return ResponseEntity.ok(patientService.getAll());
    }

    /**
     * Search patients for a given doctor by free-text query.
     * Supports searching by name, email, phone, ID, and conditions.
     */
    @GetMapping("/search")
    public ResponseEntity<List<Patient>> searchPatients(
            @RequestParam String doctorId,
            @RequestParam String query
    ) {
        return ResponseEntity.ok(patientService.searchByDoctorAndQuery(doctorId, query));
    }
}
