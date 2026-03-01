import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

/**
 * Custom hook for real-time patient synchronization
 * Handles data updates, polling, and state synchronization
 */
export const usePatientSync = (doctorId, options = {}) => {
  const {
    enablePolling = true,
    pollingInterval = 10000, // Reduced to 10 seconds for better responsiveness
    enableRealTime = false, // For WebSocket implementation
    onPatientAdded,
    onPatientUpdated,
    onPatientRemoved,
  } = options;

  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePrescriptions: 0,
    completedPrescriptions: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Fetch patients data
  const fetchPatients = useCallback(async () => {
    if (!doctorId) return;
    
    try {
      setLoading(true);
      const patientData = await api.get(`/patient/doctor/${doctorId}`);
      setPatients(Array.isArray(patientData) ? patientData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!doctorId) return;
    
    try {
      const statsData = await api.get(`/doctor/${doctorId}/dashboard/stats`);
      setStats({
        totalPatients: statsData.totalPatients || 0,
        activePrescriptions: statsData.activePrescriptions || 0,
        completedPrescriptions: statsData.completedPrescriptions || 0,
        expiringSoon: statsData.expiringSoon || 0,
      });
      setLastSync(new Date().toISOString());
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
      // Set default stats on error to prevent UI crashes
      setStats({
        totalPatients: 0,
        activePrescriptions: 0,
        completedPrescriptions: 0,
        expiringSoon: 0,
      });
    }
  }, [doctorId]);

  // Fetch real-time dashboard data
  const fetchRealTimeData = useCallback(async () => {
    if (!doctorId) return;
    
    try {
      const data = await api.get(`/doctor/${doctorId}/dashboard/realtime`);
      if (data.patients) {
        setPatients(Array.isArray(data.patients) ? data.patients : []);
      }
      if (data.stats) {
        setStats({
          totalPatients: data.stats.totalPatients || 0,
          activePrescriptions: data.stats.activePrescriptions || 0,
          completedPrescriptions: data.stats.completedPrescriptions || 0,
          expiringSoon: data.stats.expiringSoon || 0,
        });
      }
      setLastSync(new Date().toISOString());
      setError(null); // Clear any previous errors
      console.log('Real-time data refreshed successfully');
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err.message);
      // Keep existing data on error to prevent UI crashes
      // But log the error for debugging
      console.warn('Using cached data due to fetch error');
    }
  }, [doctorId]);

  // Add new patient and trigger real-time update
  const addPatient = useCallback(async (patientData) => {
    try {
      const newPatient = await api.post('/patient', patientData);
      
      // Update local state immediately
      setPatients(prev => [newPatient, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalPatients: prev.totalPatients + 1
      }));
      
      // Trigger callback if provided
      if (onPatientAdded) {
        onPatientAdded(newPatient);
      }
      
      // Refresh data to ensure consistency
      await fetchRealTimeData();
      
      console.log('Patient added successfully:', newPatient.name);
      return newPatient;
    } catch (err) {
      console.error('Error adding patient:', err);
      setError(err.message);
      throw err; // Re-throw to let caller handle it
    }
  }, [onPatientAdded, fetchRealTimeData]);

  // Update patient
  const updatePatient = useCallback(async (patientId, patientData) => {
    try {
      const updatedPatient = await api.put(`/patient/${patientId}`, patientData);
      
      // Update local state
      setPatients(prev => 
        prev.map(p => p.id === patientId ? updatedPatient : p)
      );
      
      if (onPatientUpdated) {
        onPatientUpdated(updatedPatient);
      }
      
      // Refresh stats
      await fetchStats();
      
      return updatedPatient;
    } catch (err) {
      console.error('Error updating patient:', err);
      setError(err.message);
      throw err;
    }
  }, [onPatientUpdated, fetchStats]);

  // Remove patient
  const removePatient = useCallback(async (patientId) => {
    try {
      await api.delete(`/patient/${patientId}`);
      
      // Update local state
      setPatients(prev => prev.filter(p => p.id !== patientId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalPatients: Math.max(0, prev.totalPatients - 1)
      }));
      
      if (onPatientRemoved) {
        onPatientRemoved(patientId);
      }
      
      // Refresh data
      await fetchRealTimeData();
    } catch (err) {
      console.error('Error removing patient:', err);
      setError(err.message);
      throw err;
    }
  }, [onPatientRemoved, fetchRealTimeData]);

  // Refresh all data (use realtime endpoint for consistent stats + patient list)
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetchRealTimeData();
    } finally {
      setLoading(false);
    }
  }, [fetchRealTimeData]);

  // Polling effect for real-time updates
  useEffect(() => {
    if (!enablePolling || !doctorId) return;

    const interval = setInterval(() => {
      fetchRealTimeData();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enablePolling, doctorId, pollingInterval, fetchRealTimeData]);

  // Focus effect - refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  // Initial load
  useEffect(() => {
    if (doctorId) {
      refreshAll();
    }
  }, [doctorId, refreshAll]);

  return {
    // Data
    patients,
    stats,
    loading,
    error,
    lastSync,
    
    // Actions
    addPatient,
    updatePatient,
    removePatient,
    refreshAll,
    fetchPatients,
    fetchStats,
    fetchRealTimeData,
    
    // Derived data
    patientCount: patients.length,
    latestPatients: patients.slice(0, 5),
    hasPatients: patients.length > 0,
  };
};

export default usePatientSync;