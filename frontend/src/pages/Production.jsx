import { useState, useEffect, useRef, useCallback } from 'react';
import { productionAPI, machineAPI, workerAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FiSave, FiCalendar, FiRefreshCw, FiChevronDown, FiChevronUp, FiCheck, FiClock } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import ScreenshotUploader from '../components/ScreenshotUploader';

export default function Production() {
  const { t } = useTranslation();
  const [machines, setMachines] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [productionData, setProductionData] = useState({});
  const [summary, setSummary] = useState(null);
  const [expandedMachine, setExpandedMachine] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const dataChangedRef = useRef(false);
  
  // Global electricity data (for all machines combined)
  const [electricityData, setElectricityData] = useState({
    previousReading: '',
    currentReading: '',
    unitsConsumed: ''
  });

  useEffect(() => {
    fetchMachinesAndWorkers();
  }, []);

  useEffect(() => {
    if (machines.length > 0) {
      loadProductionData();
    }
  }, [selectedDate, machines]);

  // Auto-save functionality - saves every 30 seconds
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up auto-save timer
    autoSaveTimerRef.current = setInterval(() => {
      if (dataChangedRef.current && !saving) {
        autoSaveData();
      }
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [productionData, electricityData, selectedDate, machines, saving]);

  // Save to localStorage whenever data changes (as backup)
  useEffect(() => {
    if (Object.keys(productionData).length > 0) {
      const backupData = {
        date: selectedDate,
        productionData,
        electricityData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('production_backup', JSON.stringify(backupData));
      dataChangedRef.current = true;
      setHasUnsavedChanges(true);
    }
  }, [productionData, electricityData, selectedDate]);

  // Restore from localStorage if available
  useEffect(() => {
    const backup = localStorage.getItem('production_backup');
    if (backup) {
      try {
        const { date, productionData: savedData, electricityData: savedElectricity, timestamp } = JSON.parse(backup);
        
        // Only restore if it's for today or recent (within 2 days)
        const backupDate = new Date(timestamp);
        const now = new Date();
        const daysDiff = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 2 && date === selectedDate && Object.keys(savedData).length > 0) {
          const shouldRestore = window.confirm(
            `Found unsaved data from ${new Date(timestamp).toLocaleString()}. Do you want to restore it?`
          );
          
          if (shouldRestore) {
            setProductionData(savedData);
            setElectricityData(savedElectricity);
            toast.info('Restored previous session data');
          }
        }
      } catch (error) {
        console.error('Error restoring backup:', error);
      }
    }
  }, []);

  const fetchMachinesAndWorkers = async () => {
    try {
      const [machineRes, workerRes] = await Promise.all([
        machineAPI.getAll(),
        workerAPI.getAll(),
      ]);
      setMachines(machineRes.data.data);
      setWorkers(workerRes.data.data);
    } catch (error) {
      toast.error('Failed to load machines and workers');
    } finally {
      setLoading(false);
    }
  };

  const loadProductionData = async () => {
    try {
      setLoading(true);
      const response = await productionAPI.getDateSummary(selectedDate);
      const { productions, dailyProductions, summary } = response.data.data;

      // Initialize production data structure
      const data = {};
      machines.forEach(machine => {
        data[machine._id] = {
          speed: 0,
          cfm: 0,
          pik: 0,
          previousReading: 0,
          currentReading: 0,
          unitsConsumed: 0,
          day: {
            worker: '',
            runtime: 0, // Store as minutes
            efficiency: 0,
            h1: 0,
            h2: 0,
            worph: 0,
            meter: 0,
            totalPick: 0,
            notes: ''
          },
          night: {
            worker: '',
            runtime: 0, // Store as minutes
            efficiency: 0,
            h1: 0,
            h2: 0,
            worph: 0,
            meter: 0,
            totalPick: 0,
            notes: ''
          }
        };
      });

      // Populate with existing data
      if (dailyProductions && dailyProductions.length > 0) {
        // Load global electricity data from the first daily production record
        const firstDaily = dailyProductions[0];
        if (firstDaily.previousReading !== undefined || firstDaily.currentReading !== undefined) {
          setElectricityData({
            previousReading: firstDaily.previousReading !== undefined ? firstDaily.previousReading : '',
            currentReading: firstDaily.currentReading !== undefined ? firstDaily.currentReading : '',
            unitsConsumed: firstDaily.unitsConsumed !== undefined ? firstDaily.unitsConsumed : ''
          });
        }

        // Load machine-specific daily data
        dailyProductions.forEach(daily => {
          if (data[daily.machine._id]) {
            data[daily.machine._id].speed = daily.speed || 0;
            data[daily.machine._id].cfm = daily.cfm || 0;
            data[daily.machine._id].pik = daily.pik || 0;
          }
        });
      }

      if (productions) {
        productions.forEach(prod => {
          const machineId = prod.machine._id;
          if (data[machineId] && data[machineId][prod.shift]) {
            data[machineId][prod.shift] = {
              worker: prod.worker?._id || '',
              runtime: prod.runtime || 0, // Already in minutes from backend
              efficiency: prod.efficiency || 0,
              h1: prod.h1 || 0,
              h2: prod.h2 || 0,
              worph: prod.worph || 0,
              meter: prod.meter || 0,
              totalPick: prod.totalPick || 0,
              notes: prod.notes || ''
            };
          }
        });
      }

      setProductionData(data);
      setSummary(summary);
    } catch (error) {
      console.error('Error loading production data:', error);
      const data = {};
      machines.forEach(machine => {
        data[machine._id] = {
          speed: 0,
          cfm: 0,
          pik: 0,
          day: { worker: '', runtime: 0, efficiency: 0, h1: 0, h2: 0, worph: 0, meter: 0, totalPick: 0, notes: '' },
          night: { worker: '', runtime: 0, efficiency: 0, h1: 0, h2: 0, worph: 0, meter: 0, totalPick: 0, notes: '' }
        };
      });
      setProductionData(data);
    } finally {
      setLoading(false);
    }
  };

  const convertMinutesToHHMM = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const updateField = (machineId, shift, field, value) => {
    setProductionData(prev => ({
      ...prev,
      [machineId]: {
        ...prev[machineId],
        [shift]: {
          ...prev[machineId][shift],
          [field]: value
        }
      }
    }));
  };

  const updateDailyField = (machineId, field, value) => {
    setProductionData(prev => ({
      ...prev,
      [machineId]: {
        ...prev[machineId],
        [field]: value
      }
    }));
  };

  // Handle screenshot data extraction
  const handleScreenshotData = (machineId, shift, extractedData) => {
    console.log('Extracted data:', extractedData);
    
    // Map extracted data to form fields (only machine data, no worker name in photo)
    if (extractedData.productionLength) {
      updateField(machineId, shift, 'productionLength', extractedData.productionLength);
    }

    if (extractedData.totalPick) {
      updateField(machineId, shift, 'totalPick', extractedData.totalPick);
    }

    if (extractedData.speed) {
      updateField(machineId, shift, 'speed', extractedData.speed);
    }

    if (extractedData.h1) {
      updateField(machineId, shift, 'h1', extractedData.h1);
    }

    if (extractedData.h2) {
      updateField(machineId, shift, 'h2', extractedData.h2);
    }

    if (extractedData.worph) {
      updateField(machineId, shift, 'worph', extractedData.worph);
    }

    toast.success('Screenshot data applied successfully!');
  };

  // Auto-save function (silent save in background)
  const autoSaveData = async () => {
    try {
      const promises = [];
      let isFirstSave = true;
      
      machines.forEach(machine => {
        const data = productionData[machine._id];
        if (!data) return;

        // Save day shift if worker is assigned
        if (data.day.worker) {
          promises.push(
            productionAPI.create({
              machine: machine._id,
              worker: data.day.worker,
              productionDate: selectedDate,
              shift: 'day',
              runtime: parseInt(data.day.runtime) || 0,
              efficiency: parseFloat(data.day.efficiency) || 0,
              h1: parseFloat(data.day.h1) || 0,
              h2: parseFloat(data.day.h2) || 0,
              worph: parseFloat(data.day.worph) || 0,
              meter: parseFloat(data.day.meter) || 0,
              totalPick: parseFloat(data.day.totalPick) || 0,
              speed: parseFloat(data.speed) || 0,
              cfm: parseFloat(data.cfm) || 0,
              pik: parseFloat(data.pik) || 0,
              ...(isFirstSave && {
                previousReading: electricityData.previousReading !== '' ? parseFloat(electricityData.previousReading) : undefined,
                currentReading: electricityData.currentReading !== '' ? parseFloat(electricityData.currentReading) : undefined,
              }),
              notes: data.day.notes
            }).catch(err => console.error('Auto-save error (day):', err))
          );
          isFirstSave = false;
        }

        // Save night shift if worker is assigned
        if (data.night.worker) {
          promises.push(
            productionAPI.create({
              machine: machine._id,
              worker: data.night.worker,
              productionDate: selectedDate,
              shift: 'night',
              runtime: parseInt(data.night.runtime) || 0,
              efficiency: parseFloat(data.night.efficiency) || 0,
              h1: parseFloat(data.night.h1) || 0,
              h2: parseFloat(data.night.h2) || 0,
              worph: parseFloat(data.night.worph) || 0,
              meter: parseFloat(data.night.meter) || 0,
              totalPick: parseFloat(data.night.totalPick) || 0,
              speed: parseFloat(data.speed) || 0,
              cfm: parseFloat(data.cfm) || 0,
              pik: parseFloat(data.pik) || 0,
              notes: data.night.notes
            }).catch(err => console.error('Auto-save error (night):', err))
          );
        }
      });

      if (promises.length > 0) {
        await Promise.allSettled(promises);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        dataChangedRef.current = false;
        // Clear localStorage backup after successful save
        localStorage.removeItem('production_backup');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const promises = [];
      let isFirstSave = true; // Track first save to include electricity data
      
      machines.forEach(machine => {
        const data = productionData[machine._id];
        if (!data) return;

        // Save day shift
        if (data.day.worker) {
          promises.push(
            productionAPI.create({
              machine: machine._id,
              worker: data.day.worker,
              productionDate: selectedDate,
              shift: 'day',
              runtime: parseInt(data.day.runtime) || 0, // Send as minutes
              efficiency: parseFloat(data.day.efficiency) || 0,
              h1: parseFloat(data.day.h1) || 0,
              h2: parseFloat(data.day.h2) || 0,
              worph: parseFloat(data.day.worph) || 0,
              meter: parseFloat(data.day.meter) || 0,
              totalPick: parseFloat(data.day.totalPick) || 0,
              speed: parseFloat(data.speed) || 0,
              cfm: parseFloat(data.cfm) || 0,
              pik: parseFloat(data.pik) || 0,
              // Include global electricity data only on first save
              ...(isFirstSave && {
                previousReading: electricityData.previousReading !== '' ? parseFloat(electricityData.previousReading) : undefined,
                currentReading: electricityData.currentReading !== '' ? parseFloat(electricityData.currentReading) : undefined,
              }),
              notes: data.day.notes
            })
          );
          isFirstSave = false; // Electricity data sent, don't send again
        }

        // Save night shift
        if (data.night.worker) {
          promises.push(
            productionAPI.create({
              machine: machine._id,
              worker: data.night.worker,
              productionDate: selectedDate,
              shift: 'night',
              runtime: parseInt(data.night.runtime) || 0, // Send as minutes
              efficiency: parseFloat(data.night.efficiency) || 0,
              h1: parseFloat(data.night.h1) || 0,
              h2: parseFloat(data.night.h2) || 0,
              worph: parseFloat(data.night.worph) || 0,
              meter: parseFloat(data.night.meter) || 0,
              totalPick: parseFloat(data.night.totalPick) || 0,
              speed: parseFloat(data.speed) || 0,
              cfm: parseFloat(data.cfm) || 0,
              pik: parseFloat(data.pik) || 0,
              notes: data.night.notes
            })
          );
        }
      });

      await Promise.all(promises);
      toast.success('Production data saved successfully!');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      dataChangedRef.current = false;
      localStorage.removeItem('production_backup');
      loadProductionData();
    } catch (error) {
      console.error('Error saving production data:', error);
      toast.error(error.response?.data?.message || 'Failed to save production data');
    } finally {
      setSaving(false);
    }
  };

  const loadPreviousData = async () => {
    try {
      const previousDate = new Date(selectedDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const prevDateStr = previousDate.toISOString().split('T')[0];

      const response = await productionAPI.getDateSummary(prevDateStr);
      const { dailyProductions } = response.data.data;

      if (!dailyProductions || dailyProductions.length === 0) {
        toast.info('No previous data found');
        return;
      }

      dailyProductions.forEach(daily => {
        if (productionData[daily.machine._id]) {
          updateDailyField(daily.machine._id, 'speed', daily.speed || 0);
          updateDailyField(daily.machine._id, 'cfm', daily.cfm || 0);
          updateDailyField(daily.machine._id, 'pik', daily.pik || 0);
        }
      });

      toast.success('Previous day data loaded (Speed, CFM, Pik)');
    } catch (error) {
      toast.error('Failed to load previous data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{t('production.title')}</h1>
          <p className="text-secondary-600 mt-1">{t('production.subtitle')}</p>
          
          {/* Auto-save status indicator */}
          {lastSaved && (
            <div className="flex items-center gap-2 mt-2 text-xs text-success-600">
              <FiCheck className="h-4 w-4" />
              <span>Auto-saved at {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          {hasUnsavedChanges && !lastSaved && (
            <div className="flex items-center gap-2 mt-2 text-xs text-warning-600">
              <FiClock className="h-4 w-4 animate-pulse" />
              <span>Unsaved changes - will auto-save in 30s</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={loadPreviousData} className="btn btn-secondary flex items-center">
            <FiRefreshCw className="mr-2" />
            Load Previous
          </button>
          <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary flex items-center">
            <FiSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Now'}
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="card">
        <div className="flex items-center gap-3">
          <FiCalendar className="text-primary-600 text-xl" />
          <label className="font-medium text-secondary-700">{t('production.productionDate')}:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-auto"
          />
        </div>
      </div>

      {/* Global Electricity Reading (For All Machines) */}
      <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          {t('production.electricityReading')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('production.electricityData')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">{t('production.previousReading')}</label>
            <input
              type="number"
              step="0.01"
              className="input bg-white"
              value={electricityData.previousReading}
              onChange={(e) => setElectricityData({ ...electricityData, previousReading: e.target.value })}
              placeholder={t('production.previousReading')}
            />
          </div>
          <div>
            <label className="label">{t('production.currentReading')}</label>
            <input
              type="number"
              step="0.01"
              className="input bg-white"
              value={electricityData.currentReading}
              onChange={(e) => {
                const current = parseFloat(e.target.value) || 0;
                const previous = parseFloat(electricityData.previousReading) || 0;
                const consumed = current && previous ? Math.max(0, current - previous).toFixed(2) : '';
                setElectricityData({
                  ...electricityData,
                  currentReading: e.target.value,
                  unitsConsumed: consumed
                });
              }}
              placeholder={t('production.currentReading')}
            />
          </div>
          <div>
            <label className="label">Units Consumed</label>
            <input
              type="number"
              step="0.01"
              className="input bg-gray-100"
              value={electricityData.unitsConsumed}
              readOnly
              placeholder="Auto-calculated"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated from readings</p>
          </div>
        </div>
      </div>

      {/* Machine Cards - Expandable */}
      <div className="space-y-3">
        {machines.map((machine) => {
          const data = productionData[machine._id] || {};
          const isExpanded = expandedMachine === machine._id;

          return (
            <div key={machine._id} className="card">
              {/* Machine Header - Always Visible */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedMachine(isExpanded ? null : machine._id)}
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold text-secondary-900">
                    Machine #{machine.machineNumber}
                  </h3>
                  <span className={`badge ${machine.type === 'double' ? 'badge-primary' : 'badge-secondary'}`}>
                    {machine.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary-500">Click to expand</span>
                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="mt-6 space-y-6">
                  {/* Daily Fields (24 Hours) */}
                  <div className="bg-primary-50 rounded-lg p-4 border-l-4 border-primary-500">
                    <h4 className="font-semibold text-primary-900 mb-3">📋 Daily Fields (Whole Day)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Speed</label>
                        <input
                          type="number"
                          className="input"
                          value={data.speed || ''}
                          onChange={(e) => updateDailyField(machine._id, 'speed', e.target.value)}
                          placeholder="Enter speed"
                        />
                      </div>
                      <div>
                        <label className="label">CFM (Cubic Feet/Min)</label>
                        <input
                          type="number"
                          className="input"
                          value={data.cfm || ''}
                          onChange={(e) => updateDailyField(machine._id, 'cfm', e.target.value)}
                          placeholder="Enter CFM"
                        />
                      </div>
                      <div>
                        <label className="label">Pik</label>
                        <input
                          type="number"
                          className="input"
                          value={data.pik || ''}
                          onChange={(e) => updateDailyField(machine._id, 'pik', e.target.value)}
                          placeholder="Enter pik"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day and Night Shift Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Day Shift */}
                    <div className="bg-warning-50 rounded-lg p-4 border-l-4 border-warning-500">
                      <h4 className="font-semibold text-warning-900 mb-3">☀️ Day Shift</h4>
                      
                      {/* Screenshot Uploader for Day Shift */}
                      <div className="mb-4">
                        <ScreenshotUploader
                          machineId={machine._id}
                          shift="day"
                          date={selectedDate}
                          onDataExtracted={(data) => handleScreenshotData(machine._id, 'day', data)}
                        />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="label">Worker</label>
                          <select
                            className="input"
                            value={data.day?.worker || ''}
                            onChange={(e) => updateField(machine._id, 'day', 'worker', e.target.value)}
                          >
                            <option value="">Select Worker</option>
                            {workers.map(worker => (
                              <option key={worker._id} value={worker._id}>{worker.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Runtime (minutes)</label>
                          <input
                            type="number"
                            className="input"
                            value={data.day?.runtime || ''}
                            onChange={(e) => updateField(machine._id, 'day', 'runtime', e.target.value)}
                            placeholder="Enter minutes (e.g., 660 for 11 hours)"
                          />
                          <p className="text-xs text-secondary-500 mt-1">
                            Current: {convertMinutesToHHMM(data.day?.runtime || 0)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Efficiency %</label>
                            <input
                              type="number"
                              className="input"
                              value={data.day?.efficiency || ''}
                              onChange={(e) => updateField(machine._id, 'day', 'efficiency', e.target.value)}
                              placeholder="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="label">WorPH</label>
                            <input
                              type="number"
                              className="input"
                              value={data.day?.worph || ''}
                              onChange={(e) => updateField(machine._id, 'day', 'worph', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">H1</label>
                            <input
                              type="number"
                              className="input"
                              value={data.day?.h1 || ''}
                              onChange={(e) => updateField(machine._id, 'day', 'h1', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="label">H2</label>
                            <input
                              type="number"
                              className="input"
                              value={data.day?.h2 || ''}
                              onChange={(e) => updateField(machine._id, 'day', 'h2', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Meter</label>
                            <input
                              type="number"
                              className="input"
                              value={data.day?.meter || ''}
                              onChange={(e) => updateField(machine._id, 'day', 'meter', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="label">Total Pick</label>
                            <input
                              type="number"
                              className="input"
                              value={data.day?.totalPick || ''}
                              onChange={(e) => updateField(machine._id, 'day', 'totalPick', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="label">Notes</label>
                          <input
                            type="text"
                            className="input"
                            value={data.day?.notes || ''}
                            onChange={(e) => updateField(machine._id, 'day', 'notes', e.target.value)}
                            placeholder="Optional notes"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Night Shift */}
                    <div className="bg-secondary-100 rounded-lg p-4 border-l-4 border-secondary-500">
                      <h4 className="font-semibold text-secondary-900 mb-3">🌙 Night Shift</h4>
                      
                      {/* Screenshot Uploader for Night Shift */}
                      <div className="mb-4">
                        <ScreenshotUploader
                          machineId={machine._id}
                          shift="night"
                          date={selectedDate}
                          onDataExtracted={(data) => handleScreenshotData(machine._id, 'night', data)}
                        />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="label">Worker</label>
                          <select
                            className="input"
                            value={data.night?.worker || ''}
                            onChange={(e) => updateField(machine._id, 'night', 'worker', e.target.value)}
                          >
                            <option value="">Select Worker</option>
                            {workers.map(worker => (
                              <option key={worker._id} value={worker._id}>{worker.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Runtime (minutes)</label>
                          <input
                            type="number"
                            className="input"
                            value={data.night?.runtime || ''}
                            onChange={(e) => updateField(machine._id, 'night', 'runtime', e.target.value)}
                            placeholder="Enter minutes (e.g., 780 for 13 hours)"
                          />
                          <p className="text-xs text-secondary-500 mt-1">
                            Current: {convertMinutesToHHMM(data.night?.runtime || 0)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Efficiency %</label>
                            <input
                              type="number"
                              className="input"
                              value={data.night?.efficiency || ''}
                              onChange={(e) => updateField(machine._id, 'night', 'efficiency', e.target.value)}
                              placeholder="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="label">WorPH</label>
                            <input
                              type="number"
                              className="input"
                              value={data.night?.worph || ''}
                              onChange={(e) => updateField(machine._id, 'night', 'worph', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">H1</label>
                            <input
                              type="number"
                              className="input"
                              value={data.night?.h1 || ''}
                              onChange={(e) => updateField(machine._id, 'night', 'h1', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="label">H2</label>
                            <input
                              type="number"
                              className="input"
                              value={data.night?.h2 || ''}
                              onChange={(e) => updateField(machine._id, 'night', 'h2', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Meter</label>
                            <input
                              type="number"
                              className="input"
                              value={data.night?.meter || ''}
                              onChange={(e) => updateField(machine._id, 'night', 'meter', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="label">Total Pick</label>
                            <input
                              type="number"
                              className="input"
                              value={data.night?.totalPick || ''}
                              onChange={(e) => updateField(machine._id, 'night', 'totalPick', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="label">Notes</label>
                          <input
                            type="text"
                            className="input"
                            value={data.night?.notes || ''}
                            onChange={(e) => updateField(machine._id, 'night', 'notes', e.target.value)}
                            placeholder="Optional notes"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="card bg-gradient-to-r from-success-50 to-primary-50 border-l-4 border-success-500">
          <h3 className="text-lg font-bold text-secondary-900 mb-4">📊 Daily Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Day Shift Summary */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-warning-700 mb-3">☀️ Day Shift</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Efficiency:</span>
                  <span className="font-medium">{summary.dayEfficiency.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Meter:</span>
                  <span className="font-medium">{summary.dayMeter.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Pick:</span>
                  <span className="font-medium">{summary.dayPick.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Runtime:</span>
                  <span className="font-medium">{convertMinutesToHHMM(summary.avgDayRuntime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Machines:</span>
                  <span className="font-medium">{summary.dayMachine}</span>
                </div>
              </div>
            </div>

            {/* Night Shift Summary */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-secondary-700 mb-3">🌙 Night Shift</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Efficiency:</span>
                  <span className="font-medium">{summary.nightEfficiency.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Meter:</span>
                  <span className="font-medium">{summary.nightMeter.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Pick:</span>
                  <span className="font-medium">{summary.nightPick.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Runtime:</span>
                  <span className="font-medium">{convertMinutesToHHMM(summary.avgNightRuntime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Machines:</span>
                  <span className="font-medium">{summary.nightMachine}</span>
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-success-500">
              <h4 className="font-semibold text-success-700 mb-3">🎯 Total (24 Hours)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Efficiency:</span>
                  <span className="font-bold text-success-700">{summary.totalEfficiency.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg CFM:</span>
                  <span className="font-bold text-primary-700">{(summary.avgCFM / 28.31).toFixed(2)} m³/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Meter:</span>
                  <span className="font-bold text-success-700">{summary.totalMeter.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Pick:</span>
                  <span className="font-bold text-success-700">{summary.totalPick.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Runtime:</span>
                  <span className="font-bold text-success-700">{convertMinutesToHHMM(summary.totalAvgRuntime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
