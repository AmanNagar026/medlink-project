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
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
        
        if (startDate == null || schedule.getScheduledTimes() == null || schedule.getScheduledTimes().isEmpty()) {
            return;
        }

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        LocalDate today = LocalDate.now();
        LocalDate maxWindowEnd = today.plusDays(30);
        LocalDate effectiveEnd = endDate != null ? endDate : maxWindowEnd;
        LocalDate targetEnd = effectiveEnd.isBefore(maxWindowEnd) ? effectiveEnd : maxWindowEnd;
        List<LocalTime> effectiveTimes = getTimesForFrequency(schedule.getFrequency(), schedule.getScheduledTimes());
        
        // If start date is in the past or today, start from today
        LocalDate currentDate = startDate.isAfter(today) ? startDate : today;
        
        while (!currentDate.isAfter(targetEnd)) {
            for (var time : effectiveTimes) {
                IntakeLog log = new IntakeLog();
                log.setPatientId(schedule.getPatientId());
                log.setMedicationId(schedule.getMedicationId());
                log.setMedicationName(schedule.getMedicationName());
                log.setDosageQuantity(1); // Default to 1, dosage info is in schedule
                log.setScheduledDate(currentDate);
                String formattedTime = time.format(timeFormatter);
                log.setScheduledTime(formattedTime);

                boolean alreadyExists = intakeLogRepository.existsByPatientIdAndMedicationNameAndScheduledDateAndScheduledTime(
                        schedule.getPatientId(),
                        schedule.getMedicationName(),
                        currentDate,
                        formattedTime
                );
                if (alreadyExists) {
                    continue;
                }
                
                // If it's today and the time has passed, mark as MISSED, otherwise PENDING
                if (currentDate.equals(today)) {
                    java.time.LocalTime now = java.time.LocalTime.now();
                    java.time.LocalTime scheduledTime = time;
                    if (scheduledTime.isBefore(now.minusMinutes(5))) {
                        log.setStatus("MISSED");
                    } else {
                        log.setStatus("PENDING");
                    }
                } else {
                    log.setStatus("PENDING");
                }
                
                log.setCreatedAt(LocalDateTime.now());
                intakeLogRepository.save(log);
            }
            currentDate = currentDate.plusDays(1);
        }
    }

    private List<LocalTime> getTimesForFrequency(String frequency, List<LocalTime> scheduledTimes) {
        int requiredSlots = getRequiredSlots(frequency);
        if (requiredSlots == 0) {
            return scheduledTimes;
        }

        List<LocalTime> times = new ArrayList<>(scheduledTimes);
        times.sort(LocalTime::compareTo);
        if (times.size() > requiredSlots) {
            return times.subList(0, requiredSlots);
        }
        return times;
    }

    private int getRequiredSlots(String frequency) {
        if (frequency == null) return 0;
        return switch (frequency) {
            case "ONCE_DAILY" -> 1;
            case "TWICE_DAILY" -> 2;
            case "THREE_TIMES_DAILY" -> 3;
            case "FOUR_TIMES_DAILY" -> 4;
            default -> 0;
        };
    }
}
