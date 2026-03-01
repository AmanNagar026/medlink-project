import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';

// Action types
const PATIENT_ACTIONS = {
  SET_PATIENTS: 'SET_PATIENTS',
  ADD_PATIENT: 'ADD_PATIENT',
  UPDATE_PATIENT: 'UPDATE_PATIENT',
  REMOVE_PATIENT: 'REMOVE_PATIENT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  patients: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Reducer
const patientReducer = (state, action) => {
  switch (action.type) {
    case PATIENT_ACTIONS.SET_PATIENTS:
      return {
        ...state,
        patients: action.payload,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      };
    case PATIENT_ACTIONS.ADD_PATIENT:
      return {
        ...state,
        patients: [action.payload, ...state.patients],
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      };
    case PATIENT_ACTIONS.UPDATE_PATIENT:
      return {
        ...state,
        patients: state.patients.map(patient =>
          patient.id === action.payload.id ? action.payload : patient
        ),
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      };
    case PATIENT_ACTIONS.REMOVE_PATIENT:
      return {
        ...state,
        patients: state.patients.filter(patient => patient.id !== action.payload),
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      };
    case PATIENT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case PATIENT_ACTIONS.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case PATIENT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
        return state;
  }
};

// Create context
const PatientContext = createContext();

// Provider component
export const PatientProvider = ({ children, doctorId }) => {
  const [state, dispatch] = useReducer(patientReducer, initialState);

  // Load patients for the doctor
  const loadPatients = async () => {
    if (!doctorId) return;
    
    dispatch({ type: PATIENT_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const patients = await api.get(`/patient/doctor/${doctorId}`);
      dispatch({ type: PATIENT_ACTIONS.SET_PATIENTS, payload: Array.isArray(patients) ? patients : [] });
    } catch (error) {
      console.error('Error loading patients:', error);
      dispatch({ type: PATIENT_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Add a new patient
  const addPatient = async (patientData) => {
    try {
      const newPatient = await api.post('/patient', patientData);
      dispatch({ type: PATIENT_ACTIONS.ADD_PATIENT, payload: newPatient });
      return newPatient;
    } catch (error) {
      console.error('Error adding patient:', error);
      dispatch({ type: PATIENT_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Update patient
  const updatePatient = async (patientId, patientData) => {
    try {
      const updatedPatient = await api.put(`/patient/${patientId}`, patientData);
      dispatch({ type: PATIENT_ACTIONS.UPDATE_PATIENT, payload: updatedPatient });
      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient:', error);
      dispatch({ type: PATIENT_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Remove patient
  const removePatient = async (patientId) => {
    try {
      await api.delete(`/patient/${patientId}`);
      dispatch({ type: PATIENT_ACTIONS.REMOVE_PATIENT, payload: patientId });
    } catch (error) {
      console.error('Error removing patient:', error);
      dispatch({ type: PATIENT_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: PATIENT_ACTIONS.CLEAR_ERROR });
  };

  // Load patients on mount and when doctorId changes
  useEffect(() => {
    if (doctorId) {
      loadPatients();
    }
  }, [doctorId]);

  // Refresh patients data
  const refreshPatients = () => {
    loadPatients();
  };

  const value = {
    // State
    ...state,
    // Actions
    loadPatients,
    addPatient,
    updatePatient,
    removePatient,
    clearError,
    refreshPatients,
    // Derived data
    patientCount: state.patients.length,
    latestPatients: state.patients.slice(0, 5), // For insights section
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};

// Custom hook to use patient context
export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};

export default PatientContext;