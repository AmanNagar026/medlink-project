package com.medlink.tracker.service;

import com.medlink.tracker.exception.ResourceNotFoundException;
import com.medlink.tracker.model.IntakeLog;
import com.medlink.tracker.model.MedicationSchedule;
import com.medlink.tracker.repository.IntakeLogRepository;
import com.medlink.tracker.repository.MedicationScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class MedicationScheduleService {

    @Autowired
    private MedicationScheduleRepository scheduleRepository;

    @Autowired
    private IntakeLogRepository intakeLogRepository;

    public MedicationSchedule create(MedicationSchedule schedule) {
        schedule.setCreatedAt(LocalDateTime.now());
        schedule.setUpdatedAt(LocalDateTime.now());
        MedicationSchedule saved = scheduleRepository.save(schedule);
        
        // Generate intake logs for the schedule
        generateIntakeLogs(saved);
        
        return saved;
    }

    public List<MedicationSchedule> getByPatientId(String patientId) {
        return scheduleRepository.findByPatientIdAndActiveTrue(patientId);
    }

    public List<MedicationSchedule> getCurrentSchedules(String patientId) {
        LocalDate today = LocalDate.now();
        return scheduleRepository.findByPatientIdAndActiveTrueAndStartDateBeforeAndEndDateAfter(
                patientId, today.plusDays(1), today.minusDays(1));
    }

    public MedicationSchedule getById(String id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + id));
    }

    public MedicationSchedule update(String id, MedicationSchedule updatedSchedule) {
        MedicationSchedule schedule = getById(id);
        schedule.setMedicationId(updatedSchedule.getMedicationId());
        schedule.setMedicationName(updatedSchedule.getMedicationName());
        schedule.setDosage(updatedSchedule.getDosage());
        schedule.setFrequency(updatedSchedule.getFrequency());
        schedule.setScheduledTimes(updatedSchedule.getScheduledTimes());
        schedule.setStartDate(updatedSchedule.getStartDate());
        schedule.setEndDate(updatedSchedule.getEndDate());
        schedule.setInstructions(updatedSchedule.getInstructions());
        schedule.setActive(updatedSchedule.isActive());
        schedule.setUpdatedAt(LocalDateTime.now());
        return scheduleRepository.save(schedule);
    }

    public void delete(String id) {
        MedicationSchedule schedule = getById(id);
        schedule.setActive(false);
        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleRepository.save(schedule);
    }

    private void generateIntakeLogs(MedicationSchedule schedule) {
        LocalDate startDate = schedule.getStartDate();
        LocalDate endDate = schedule.getEndDate();
        
        if (startDate == null || endDate == null || schedule.getScheduledTimes() == null) {
            return;
        }

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            for (var time : schedule.getScheduledTimes()) {
                IntakeLog log = new IntakeLog();
                log.setPatientId(schedule.getPatientId());
                log.setMedicationId(schedule.getMedicationId());
                log.setMedicationName(schedule.getMedicationName());
                log.setDosageQuantity(1); // Default to 1, dosage info is in schedule
                log.setScheduledDate(currentDate);
                log.setScheduledTime(time.format(timeFormatter));
                log.setStatus("PENDING");
                log.setCreatedAt(LocalDateTime.now());
                intakeLogRepository.save(log);
            }
            currentDate = currentDate.plusDays(1);
        }
    }
}
