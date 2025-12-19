import { useState, useEffect } from 'react';
import { productionAPI, machineAPI, workerAPI } from '../utils/api';
import { FiSettings, FiUsers, FiTrendingUp, FiActivity, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const { t } = useTranslation();
  const [machines, setMachines] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRangeDays, setDateRangeDays] = useState(7);
  
  // Analytics states
  const [selectedWorker, setSelectedWorker] = useState('');
  const [workerAnalytics, setWorkerAnalytics] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [machineAnalytics, setMachineAnalytics] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [mhrView, setMhrView] = useState('total'); // 'day', 'night', or 'total'
  const [electricityAnalytics, setElectricityAnalytics] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDailySummary();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedWorker) {
      fetchWorkerAnalytics();
    }
  }, [selectedWorker, dateRangeDays]);

  useEffect(() => {
    if (selectedMachine) {
      fetchMachineAnalytics();
    }
  }, [selectedMachine, dateRangeDays]);

  useEffect(() => {
    fetchElectricityAnalytics();
  }, [dateRangeDays]);

  const fetchInitialData = async () => {
    try {
      const [machinesRes, workersRes] = await Promise.all([
        machineAPI.getAll(),
        workerAPI.getAll(),
      ]);

      setMachines(machinesRes.data.data);
      setWorkers(workersRes.data.data);
      
      // Auto-select first worker and machine for analytics
      if (workersRes.data.data.length > 0) {
        setSelectedWorker(workersRes.data.data[0]._id);
      }
      if (machinesRes.data.data.length > 0) {
        setSelectedMachine(machinesRes.data.data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await productionAPI.getDateSummary(selectedDate);
      setDailySummary(response.data.data);
    } catch (error) {
      console.error('Failed to load daily summary:', error);
      setDailySummary(null);
    }
  };

  const fetchWorkerAnalytics = async () => {
    try {
      const response = await productionAPI.getWorkerAnalytics(selectedWorker, { days: dateRangeDays });
      setWorkerAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to load worker analytics:', error);
      setWorkerAnalytics(null);
    }
  };

  const fetchMachineAnalytics = async () => {
    try {
      const response = await productionAPI.getMachineAnalytics(selectedMachine, { days: dateRangeDays });
      setMachineAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to load machine analytics:', error);
      setMachineAnalytics(null);
    }
  };

  const fetchElectricityAnalytics = async () => {
    try {
      const response = await productionAPI.getElectricityAnalytics({ days: dateRangeDays });
      setElectricityAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to load electricity analytics:', error);
      setElectricityAnalytics(null);
    }
  };

  const convertMinutesToHHMM = (minutes) => {
    if (!minutes) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">{t('dashboard.title')}</h1>
        <p className="text-secondary-600 mt-2">{t('dashboard.subtitle')}</p>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <FiCalendar className="h-5 w-5 text-secondary-600" />
            <span className="text-sm font-medium text-secondary-700">{t('dashboard.dateRange')}:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDateRangeDays(7)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRangeDays === 7
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {t('dashboard.last7Days')}
            </button>
            <button
              onClick={() => setDateRangeDays(30)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRangeDays === 30
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {t('dashboard.last30Days')}
            </button>
            <button
              onClick={() => setDateRangeDays(60)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRangeDays === 60
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {t('dashboard.last60Days')}
            </button>
            <button
              onClick={() => setDateRangeDays(120)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRangeDays === 120
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {t('dashboard.last120Days')}
            </button>
            <button
              onClick={() => setDateRangeDays(180)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRangeDays === 180
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {t('dashboard.last180Days')}
            </button>
            <button
              onClick={() => setDateRangeDays(365)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRangeDays === 365
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {t('dashboard.last365Days')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">{t('dashboard.activeMachines')}</p>
              <p className="text-3xl font-bold mt-2">{machines.length}</p>
            </div>
            <FiSettings className="h-12 w-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">{t('dashboard.activeWorkers')}</p>
              <p className="text-3xl font-bold mt-2">{workers.length}</p>
            </div>
            <FiUsers className="h-12 w-12 text-success-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm font-medium">{t('dashboard.totalProduction')}</p>
              <p className="text-3xl font-bold mt-2">
                {dailySummary?.total?.totalMeter?.toFixed(0) || 0} {t('dashboard.meters')}
              </p>
            </div>
            <FiTrendingUp className="h-12 w-12 text-warning-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">{t('dashboard.avgEfficiency')}</p>
              <p className="text-3xl font-bold mt-2">
                {dailySummary?.total?.avgEfficiency?.toFixed(1) || 0}%
              </p>
            </div>
            <FiActivity className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Daily Summary Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">{t('reports.dailySummary')}</h2>
          <div className="flex items-center gap-3">
            <FiCalendar className="text-primary-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input w-auto"
            />
          </div>
        </div>

        {dailySummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Day Shift */}
            <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
              <h3 className="font-semibold text-yellow-900 mb-3">☀️ Day Shift</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Efficiency:</span>
                  <span className="font-semibold">{dailySummary.day?.avgEfficiency?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Meter:</span>
                  <span className="font-semibold">{dailySummary.day?.totalMeter?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Pick:</span>
                  <span className="font-semibold">{dailySummary.day?.totalPick?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Runtime:</span>
                  <span className="font-semibold">{convertMinutesToHHMM(dailySummary.day?.avgRuntime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg CFM:</span>
                  <span className="font-semibold">{dailySummary.day?.avgCFM?.toFixed(1) || 0}</span>
                </div>
              </div>
            </div>

            {/* Night Shift */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-500">
              <h3 className="font-semibold text-gray-900 mb-3">🌙 Night Shift</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Efficiency:</span>
                  <span className="font-semibold">{dailySummary.night?.avgEfficiency?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Meter:</span>
                  <span className="font-semibold">{dailySummary.night?.totalMeter?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Pick:</span>
                  <span className="font-semibold">{dailySummary.night?.totalPick?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Runtime:</span>
                  <span className="font-semibold">{convertMinutesToHHMM(dailySummary.night?.avgRuntime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg CFM:</span>
                  <span className="font-semibold">{dailySummary.night?.avgCFM?.toFixed(1) || 0}</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="bg-primary-50 rounded-lg p-4 border-l-4 border-primary-500">
              <h3 className="font-semibold text-primary-900 mb-3">📊 Total (24 Hours)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Efficiency:</span>
                  <span className="font-semibold">{dailySummary.total?.avgEfficiency?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Meter:</span>
                  <span className="font-semibold">{dailySummary.total?.totalMeter?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Pick:</span>
                  <span className="font-semibold">{dailySummary.total?.totalPick?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Runtime:</span>
                  <span className="font-semibold">{convertMinutesToHHMM(dailySummary.total?.avgRuntime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg CFM:</span>
                  <span className="font-semibold">{dailySummary.total?.avgCFM?.toFixed(1) || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            No production data available for selected date
          </div>
        )}
      </div>

      {/* Worker Analytics Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-semibold text-secondary-900">Worker Performance Analytics</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dateRangeDays}
              onChange={(e) => setDateRangeDays(Number(e.target.value))}
              className="input w-auto"
            >
              <option value={7}>Last 7 Days</option>
              <option value={15}>Last 15 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="input min-w-[200px]"
            >
              {workers.map((worker) => (
                <option key={worker._id} value={worker._id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {workerAnalytics ? (
          <div className="space-y-6">
            {/* Worker Overall Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Avg Efficiency</p>
                <p className="text-2xl font-bold text-primary-600">
                  {workerAnalytics.overall.avgEfficiency.toFixed(1)}%
                </p>
              </div>
              <div className="bg-success-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Total Meter</p>
                <p className="text-2xl font-bold text-success-600">
                  {workerAnalytics.overall.totalMeter.toFixed(0)}
                </p>
              </div>
              <div className="bg-warning-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Total Pick</p>
                <p className="text-2xl font-bold text-warning-600">
                  {workerAnalytics.overall.totalPick.toFixed(0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Total Shifts</p>
                <p className="text-2xl font-bold text-purple-600">
                  {workerAnalytics.overall.totalShifts}
                </p>
              </div>
            </div>

            {/* Worker Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Efficiency Trend */}
              <div>
                <h3 className="font-semibold text-secondary-900 mb-4">Efficiency Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={workerAnalytics.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="dayShift.avgEfficiency" 
                      stroke="#F59E0B" 
                      name="Day Shift"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nightShift.avgEfficiency" 
                      stroke="#6B7280" 
                      name="Night Shift"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Production Output */}
              <div>
                <h3 className="font-semibold text-secondary-900 mb-4">Production Output (Meter)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workerAnalytics.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Bar dataKey="dayShift.meter" fill="#F59E0B" name="Day Shift" />
                    <Bar dataKey="nightShift.meter" fill="#6B7280" name="Night Shift" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            Loading worker analytics...
          </div>
        )}
      </div>

      {/* Machine Analytics Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-semibold text-secondary-900">Machine Performance Analytics</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dateRangeDays}
              onChange={(e) => setDateRangeDays(Number(e.target.value))}
              className="input w-auto"
            >
              <option value={7}>Last 7 Days</option>
              <option value={15}>Last 15 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="input min-w-[200px]"
            >
              {machines.map((machine) => (
                <option key={machine._id} value={machine._id}>
                  Machine {machine.machineNumber} ({machine.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {machineAnalytics ? (
          <div className="space-y-6">
            {/* Machine Overall Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Avg Efficiency</p>
                <p className="text-2xl font-bold text-primary-600">
                  {machineAnalytics.overall.avgEfficiency.toFixed(1)}%
                </p>
              </div>
              <div className="bg-success-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Total Meter</p>
                <p className="text-2xl font-bold text-success-600">
                  {machineAnalytics.overall.totalMeter.toFixed(0)}
                </p>
              </div>
              <div className="bg-warning-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Total Pick</p>
                <p className="text-2xl font-bold text-warning-600">
                  {machineAnalytics.overall.totalPick.toFixed(0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Overall M/Hr</p>
                <p className="text-2xl font-bold text-purple-600">
                  {machineAnalytics.overall.overallMeterPerHour?.toFixed(1) || 0}
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Total Shifts</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {machineAnalytics.overall.totalShifts}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  D:{machineAnalytics.overall.dayShifts} N:{machineAnalytics.overall.nightShifts}
                </p>
              </div>
            </div>

            {/* M/Hr Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">☀️ Day Shift M/Hr</h4>
                <p className="text-3xl font-bold text-yellow-700">
                  {machineAnalytics.overall.dayMeterPerHour?.toFixed(2) || 0}
                </p>
                <p className="text-xs text-secondary-600 mt-1">14 hours per shift</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-500">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">🌙 Night Shift M/Hr</h4>
                <p className="text-3xl font-bold text-gray-700">
                  {machineAnalytics.overall.nightMeterPerHour?.toFixed(2) || 0}
                </p>
                <p className="text-xs text-secondary-600 mt-1">10 hours per shift</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📊 Overall M/Hr</h4>
                <p className="text-3xl font-bold text-blue-700">
                  {machineAnalytics.overall.overallMeterPerHour?.toFixed(2) || 0}
                </p>
                <p className="text-xs text-secondary-600 mt-1">24 hours combined</p>
              </div>
            </div>

            {/* Machine Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Efficiency Trend */}
              <div>
                <h3 className="font-semibold text-secondary-900 mb-4">Efficiency Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={machineAnalytics.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="dayShift.avgEfficiency" 
                      stroke="#F59E0B" 
                      name="Day Shift"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nightShift.avgEfficiency" 
                      stroke="#6B7280" 
                      name="Night Shift"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Worker Performance on this Machine */}
              <div>
                <h3 className="font-semibold text-secondary-900 mb-4">Worker Performance Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={machineAnalytics.workerPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="workerName"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgEfficiency" fill="#3B82F6" name="Avg Efficiency %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Meter Per Hour (M/Hr) Chart */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-900">Meter Per Hour (M/Hr) Trend</h3>
                <select
                  value={mhrView}
                  onChange={(e) => setMhrView(e.target.value)}
                  className="input w-auto"
                >
                  <option value="total">Overall (24 hrs)</option>
                  <option value="day">Day Shift (14 hrs)</option>
                  <option value="night">Night Shift (10 hrs)</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={machineAnalytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis label={{ value: 'Meters/Hour', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => value ? value.toFixed(2) : '0.00'}
                  />
                  <Legend />
                  {mhrView === 'day' && (
                    <Line 
                      type="monotone" 
                      dataKey="dayShift.meterPerHour" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      name="Day Shift M/Hr (14 hrs)"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {mhrView === 'night' && (
                    <Line 
                      type="monotone" 
                      dataKey="nightShift.meterPerHour" 
                      stroke="#6B7280" 
                      strokeWidth={3}
                      name="Night Shift M/Hr (10 hrs)"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {mhrView === 'total' && (
                    <Line 
                      type="monotone" 
                      dataKey="totalMeterPerHour" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Overall M/Hr (24 hrs)"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-secondary-700">
                  <strong>Note:</strong> M/Hr (Meters per Hour) shows production efficiency over time. 
                  Day shift: 14 hours, Night shift: 10 hours.
                  {machineAnalytics.machine.type === 'double' && ' Double machine values are multiplied by 2.'}
                </p>
              </div>
            </div>

            {/* Worker Performance Table */}
            {machineAnalytics.workerPerformance.length > 0 && (
              <div>
                <h3 className="font-semibold text-secondary-900 mb-4">Worker Performance Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                          Worker
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                          Avg Efficiency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                          Total Meter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                          Total Pick
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                          Avg Runtime
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase">
                          Shifts Worked
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {machineAnalytics.workerPerformance.map((worker, index) => (
                        <tr key={index} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                            {worker.workerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">
                            {worker.avgEfficiency.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">
                            {worker.meter.toFixed(0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">
                            {worker.pick.toFixed(0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">
                            {convertMinutesToHHMM(worker.avgRuntime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">
                            {worker.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            Loading machine analytics...
          </div>
        )}
      </div>

      {/* Electricity Consumption Analytics */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">⚡ Electricity Consumption Analytics</h2>
          <select
            value={dateRangeDays}
            onChange={(e) => setDateRangeDays(Number(e.target.value))}
            className="input w-auto"
          >
            <option value={7}>Last 7 Days</option>
            <option value={15}>Last 15 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>

        {electricityAnalytics ? (
          <div className="space-y-6">
            {/* Overall Electricity Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Total Units</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {electricityAnalytics.overall.totalUnits.toFixed(0)}
                </p>
                <p className="text-xs text-secondary-500 mt-1">kWh consumed</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Total Meter</p>
                <p className="text-2xl font-bold text-green-600">
                  {electricityAnalytics.overall.totalMeter.toFixed(0)}
                </p>
                <p className="text-xs text-secondary-500 mt-1">meters produced</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Units per Meter</p>
                <p className="text-2xl font-bold text-orange-600">
                  {electricityAnalytics.overall.avgUnitsPerMeter.toFixed(2)}
                </p>
                <p className="text-xs text-secondary-500 mt-1">kWh/meter</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-secondary-600 mb-1">Avg Daily Units</p>
                <p className="text-2xl font-bold text-blue-600">
                  {electricityAnalytics.overall.avgDailyUnits.toFixed(0)}
                </p>
                <p className="text-xs text-secondary-500 mt-1">kWh/day</p>
              </div>
            </div>

            {/* Electricity Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Units Consumption Trend */}
              <div>
                <h3 className="font-semibold text-secondary-900 mb-4">Daily Units Consumption Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={electricityAnalytics.dateWiseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis label={{ value: 'Units (kWh)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => value.toFixed(2) + ' kWh'}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalUnits" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      name="Units Consumed"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Units per Meter Trend */}
              <div>
                <h3 className="font-semibold text-secondary-900 mb-4">Units per Meter Efficiency</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={electricityAnalytics.dateWiseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis label={{ value: 'kWh/meter', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => value.toFixed(3) + ' kWh/m'}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="unitsPerMeter" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Units/Meter"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-secondary-700">
                <strong>Note:</strong> Units per meter shows electricity efficiency. 
                Lower values indicate better energy efficiency in production.
                Track consumption daily at 12:00 AM for accurate readings.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            {electricityAnalytics === null ? 'Loading electricity analytics...' : 'No electricity data available'}
          </div>
        )}
      </div>
    </div>
  );
}
