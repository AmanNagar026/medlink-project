package com.medlink.tracker.controller;

import com.medlink.tracker.model.VitalSign;
import com.medlink.tracker.service.VitalSignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vitals")
@CrossOrigin(origins = "*")
public class VitalSignController {

    @Autowired
    private VitalSignService vitalSignService;

    @PostMapping
    public ResponseEntity<VitalSign> create(@RequestBody VitalSign vitalSign) {
        return ResponseEntity.ok(vitalSignService.create(vitalSign));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<VitalSign>> getByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(vitalSignService.getByPatientId(patientId));
    }

    @GetMapping("/patient/{patientId}/latest")
    public ResponseEntity<VitalSign> getLatest(@PathVariable String patientId) {
        VitalSign latest = vitalSignService.getLatestByPatientId(patientId);
        return latest != null ? ResponseEntity.ok(latest) : ResponseEntity.noContent().build();
    }

    @GetMapping("/patient/{patientId}/trend")
    public ResponseEntity<List<VitalSign>> getTrendData(
            @PathVariable String patientId,
            @RequestParam(defaultValue = "7") String period) {
        return ResponseEntity.ok(vitalSignService.getTrendData(patientId, period));
    }

    @GetMapping("/patient/{patientId}/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable String patientId) {
        return ResponseEntity.ok(vitalSignService.getVitalsSummary(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VitalSign> getById(@PathVariable String id) {
        return ResponseEntity.ok(vitalSignService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VitalSign> update(@PathVariable String id, @RequestBody VitalSign vitalSign) {
        return ResponseEntity.ok(vitalSignService.update(id, vitalSign));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        vitalSignService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
