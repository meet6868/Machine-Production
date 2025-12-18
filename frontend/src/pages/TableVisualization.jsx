import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiDownload, FiCalendar, FiFilter, FiLayers, FiTool } from 'react-icons/fi';
import { productionAPI, machineAPI, workerAPI } from '../utils/api';

export default function TableVisualization() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('daywise'); // 'daywise' or 'machine'
  const [summaryData, setSummaryData] = useState([]);
  const [productionData, setProductionData] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    machineId: '',
    machineNumber: '',
    workerId: '',
    shift: ''
  });
  const [machines, setMachines] = useState([]);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetchMachines();
    fetchWorkers();
    if (viewMode === 'daywise') {
      fetchSummaryData();
    } else {
      fetchProductionData();
    }
  }, [viewMode]);

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      console.log('Machines API Response:', response.data);
      const machinesData = response.data.data || [];
      console.log('Setting machines to:', machinesData);
      setMachines(Array.isArray(machinesData) ? machinesData : []);
    } catch (error) {
      console.error('Error fetching machines:', error);
      setMachines([]);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getAll();
      console.log('Workers API Response:', response.data);
      const workersData = response.data.data || [];
      console.log('Setting workers to:', workersData);
      setWorkers(Array.isArray(workersData) ? workersData : []);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setWorkers([]);
    }
  };

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const response = await productionAPI.getSummaries({
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setSummaryData(response.data || []);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      const response = await productionAPI.getAll({
        startDate: filters.startDate,
        endDate: filters.endDate,
        machineId: filters.machineId || undefined,
        workerId: filters.workerId || undefined,
        shift: filters.shift || undefined
      });
      const data = response.data.data || [];
      setProductionData(data);
      
      // Group data by machine and date
      groupProductionData(data);
    } catch (error) {
      console.error('Error fetching production data:', error);
      setProductionData([]);
      setGroupedData([]);
    } finally {
      setLoading(false);
    }
  };

  const groupProductionData = (data) => {
    // Filter by machine number if specified
    let filteredData = data;
    if (filters.machineNumber) {
      filteredData = data.filter(item => 
        item.machine?.machineNumber?.toLowerCase() === filters.machineNumber.toLowerCase()
      );
    }

    // Group by machine number and date
    const grouped = {};
    
    filteredData.forEach(item => {
      const machineNum = item.machine?.machineNumber || 'Unknown';
      const date = new Date(item.productionDate).toLocaleDateString();
      const key = `${machineNum}-${date}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          machineNumber: machineNum,
          machineType: item.machine?.type,
          date: date,
          dateObj: new Date(item.productionDate),
          dayShift: null,
          nightShift: null
        };
      }
      
      if (item.shift === 'day') {
        grouped[key].dayShift = item;
      } else if (item.shift === 'night') {
        grouped[key].nightShift = item;
      }
    });
    
    // Convert to array and sort by date (newest first), then by machine number
    const groupedArray = Object.values(grouped).sort((a, b) => {
      const dateCompare = b.dateObj - a.dateObj;
      if (dateCompare !== 0) return dateCompare;
      return a.machineNumber.localeCompare(b.machineNumber);
    });
    
    setGroupedData(groupedArray);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    if (viewMode === 'daywise') {
      fetchSummaryData();
    } else {
      fetchProductionData();
    }
  };

  const handleMachineNumberFilter = () => {
    // Re-group the data with the new machine number filter
    groupProductionData(productionData);
  };

  const handleExportCSV = () => {
    if (viewMode === 'daywise') {
      exportSummaryCSV();
    } else {
      exportProductionCSV();
    }
  };

  const exportSummaryCSV = () => {
    if (summaryData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Date',
      'Day Efficiency (%)',
      'Day Meter',
      'Day Pick',
      'Day Machines',
      'Day Runtime (min)',
      'Day M/Hr',
      'Night Efficiency (%)',
      'Night Meter',
      'Night Pick',
      'Night Machines',
      'Night Runtime (min)',
      'Night M/Hr',
      'Total Efficiency (%)',
      'Total Meter',
      'Total Pick',
      'Total Machines',
      'Total Runtime (min)',
      'Avg CFM',
      'Units Consumed',
      'Units/Meter'
    ];

    const rows = summaryData.map(item => [
      new Date(item.date).toLocaleDateString(),
      (item.dayEfficiency || 0).toFixed(1),
      (item.dayMeter || 0).toFixed(2),
      item.dayPick || 0,
      item.dayMachine || 0,
      item.avgDayRuntime || 0,
      (item.dayMeterPerHour || 0).toFixed(2),
      (item.nightEfficiency || 0).toFixed(1),
      (item.nightMeter || 0).toFixed(2),
      item.nightPick || 0,
      item.nightMachine || 0,
      item.avgNightRuntime || 0,
      (item.nightMeterPerHour || 0).toFixed(2),
      (item.totalEfficiency || 0).toFixed(1),
      (item.totalMeter || 0).toFixed(2),
      item.totalPick || 0,
      (item.totalMachine || 0).toFixed(1),
      item.totalAvgRuntime || 0,
      (item.avgCFM || 0).toFixed(1),
      (item.totalUnitsConsumed || 0).toFixed(2),
      (item.unitsPerMeter || 0).toFixed(4)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    downloadCSV(csvContent, `day_wise_summary_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportProductionCSV = () => {
    if (productionData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Date',
      'Machine',
      'Machine Type',
      'Worker',
      'Shift',
      'Runtime (min)',
      'Efficiency (%)',
      'Meter',
      'Total Pick',
      'H1',
      'H2',
      'WorPH',
      'Speed',
      'CFM',
      'Pik'
    ];

    const rows = productionData.map(item => [
      new Date(item.productionDate).toLocaleDateString(),
      item.machine?.machineNumber || 'N/A',
      item.machine?.type || 'N/A',
      item.worker?.name || 'N/A',
      item.shift || 'N/A',
      item.runtime || 0,
      item.efficiency || 0,
      item.meter || 0,
      item.totalPick || 0,
      item.h1 || 0,
      item.h2 || 0,
      item.worph || 0,
      item.speed || 0,
      item.cfm || 0,
      item.pik || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    downloadCSV(csvContent, `production_data_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-secondary-900">Table Visualization</h1>
        <button
          onClick={handleExportCSV}
          disabled={(viewMode === 'daywise' ? summaryData.length === 0 : productionData.length === 0)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed transition-colors"
        >
          <FiDownload className="mr-2" />
          Export CSV
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-secondary-700">View Mode:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('daywise')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'daywise'
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              <FiLayers className="mr-2" />
              Day-wise Summary
            </button>
            <button
              onClick={() => setViewMode('machine')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'machine'
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              <FiTool className="mr-2" />
              Machine Details
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FiFilter className="text-secondary-600 mr-2" />
          <h2 className="text-lg font-semibold text-secondary-900">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {viewMode === 'machine' && (
            <>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Machine Number
                </label>
                <input
                  type="text"
                  name="machineNumber"
                  value={filters.machineNumber}
                  onChange={handleFilterChange}
                  placeholder="e.g., M1, M2"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Worker
                </label>
                <select
                  name="workerId"
                  value={filters.workerId}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Workers</option>
                  {Array.isArray(workers) && workers.map(worker => (
                    <option key={worker._id} value={worker._id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Shift
                </label>
                <select
                  name="shift"
                  value={filters.shift}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Shifts</option>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleApplyFilters}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : viewMode === 'daywise' ? (
            summaryData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-500">No summary data found for the selected date range.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider" rowSpan="2">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300" colSpan="6">Day Shift (14 hrs)</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300" colSpan="6">Night Shift (10 hrs)</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300" colSpan="7">Total (24 hrs)</th>
                  </tr>
                  <tr>
                    {/* Day Shift Columns */}
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300">Eff %</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Meter</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Pick</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Machines</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Runtime</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">M/Hr</th>
                    {/* Night Shift Columns */}
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300">Eff %</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Meter</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Pick</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Machines</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Runtime</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">M/Hr</th>
                    {/* Total Columns */}
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300">Eff %</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Meter</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Pick</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Machines</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Runtime</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Units</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Units/M</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {summaryData.map((item, index) => (
                    <tr key={item._id} className={index % 2 === 0 ? 'bg-white' : 'bg-secondary-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-900">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      {/* Day Shift Data */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right border-l border-secondary-200">
                        {(item.dayEfficiency || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right font-medium">
                        {(item.dayMeter || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                        {(item.dayPick || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                        {item.dayMachine || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                        {formatRuntime(item.avgDayRuntime || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                        {(item.dayMeterPerHour || 0).toFixed(2)}
                      </td>
                      {/* Night Shift Data */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right border-l border-secondary-200">
                        {(item.nightEfficiency || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right font-medium">
                        {(item.nightMeter || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                        {(item.nightPick || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                        {item.nightMachine || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                        {formatRuntime(item.avgNightRuntime || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                        {(item.nightMeterPerHour || 0).toFixed(2)}
                      </td>
                      {/* Total Data */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right border-l border-secondary-200 bg-primary-50">
                        {(item.totalEfficiency || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right font-semibold bg-primary-50">
                        {(item.totalMeter || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right bg-primary-50">
                        {(item.totalPick || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right bg-primary-50">
                        {(item.totalMachine || 0).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right bg-primary-50">
                        {formatRuntime(item.totalAvgRuntime || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right bg-primary-50">
                        {(item.totalUnitsConsumed || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right bg-primary-50">
                        {(item.unitsPerMeter || 0).toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            groupedData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-500">No production data found for the selected filters.</p>
              </div>
            ) : (
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider" rowSpan="2">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider" rowSpan="2">Machine</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider" rowSpan="2">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300" colSpan="7">Day Shift</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300" colSpan="7">Night Shift</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-primary-700 uppercase tracking-wider border-l border-primary-300 bg-primary-50" colSpan="6">Total (Machine-wise)</th>
                </tr>
                <tr>
                  {/* Day Shift Columns */}
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300">Worker</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Runtime</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Eff %</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Meter</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Pick</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">H1/H2</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">WorPH</th>
                  {/* Night Shift Columns */}
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider border-l border-secondary-300">Worker</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Runtime</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Eff %</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Meter</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">Pick</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">H1/H2</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">WorPH</th>
                  {/* Total Columns */}
                  <th className="px-4 py-2 text-right text-xs font-medium text-primary-700 uppercase tracking-wider border-l border-primary-300 bg-primary-50">Runtime</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-primary-700 uppercase tracking-wider bg-primary-50">Avg Eff %</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-primary-700 uppercase tracking-wider bg-primary-50">Meter</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-primary-700 uppercase tracking-wider bg-primary-50">Pick</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-primary-700 uppercase tracking-wider bg-primary-50">H1/H2</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-primary-700 uppercase tracking-wider bg-primary-50">Avg WorPH</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {groupedData.map((item, index) => (
                  <tr key={`${item.machineNumber}-${item.date}`} className={index % 2 === 0 ? 'bg-white' : 'bg-secondary-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-900">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-secondary-900">
                      {item.machineNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.machineType === 'single' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.machineType || 'N/A'}
                      </span>
                    </td>
                    
                    {/* Day Shift Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 border-l border-secondary-200">
                      {item.dayShift?.worker?.name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.dayShift ? formatRuntime(item.dayShift.runtime || 0) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.dayShift ? `${(item.dayShift.efficiency || 0).toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right font-medium">
                      {item.dayShift ? (item.dayShift.meter || 0).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.dayShift ? (item.dayShift.totalPick || 0).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.dayShift ? `${item.dayShift.h1 || 0}/${item.dayShift.h2 || 0}` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.dayShift ? (item.dayShift.worph || 0) : '-'}
                    </td>
                    
                    {/* Night Shift Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 border-l border-secondary-200">
                      {item.nightShift?.worker?.name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.nightShift ? formatRuntime(item.nightShift.runtime || 0) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.nightShift ? `${(item.nightShift.efficiency || 0).toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right font-medium">
                      {item.nightShift ? (item.nightShift.meter || 0).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.nightShift ? (item.nightShift.totalPick || 0).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.nightShift ? `${item.nightShift.h1 || 0}/${item.nightShift.h2 || 0}` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 text-right">
                      {item.nightShift ? (item.nightShift.worph || 0) : '-'}
                    </td>
                    
                    {/* Total Data (Machine-wise) */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary-900 text-right border-l border-primary-300 bg-primary-50 font-medium">
                      {formatRuntime((item.dayShift?.runtime || 0) + (item.nightShift?.runtime || 0))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary-900 text-right bg-primary-50 font-medium">
                      {(() => {
                        const dayEff = item.dayShift?.efficiency || 0;
                        const nightEff = item.nightShift?.efficiency || 0;
                        const dayRuntime = item.dayShift?.runtime || 0;
                        const nightRuntime = item.nightShift?.runtime || 0;
                        const totalRuntime = dayRuntime + nightRuntime;
                        
                        if (totalRuntime === 0) return '0.0%';
                        
                        // Weighted average efficiency based on runtime
                        const avgEff = (dayEff * dayRuntime + nightEff * nightRuntime) / totalRuntime;
                        return `${avgEff.toFixed(1)}%`;
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary-900 text-right bg-primary-50 font-semibold">
                      {(() => {
                        const multiplier = item.machineType === 'double' ? 2 : 1;
                        const totalMeter = ((item.dayShift?.meter || 0) + (item.nightShift?.meter || 0)) * multiplier;
                        return totalMeter.toFixed(2);
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary-900 text-right bg-primary-50 font-medium">
                      {(() => {
                        const multiplier = item.machineType === 'double' ? 2 : 1;
                        const totalPick = ((item.dayShift?.totalPick || 0) + (item.nightShift?.totalPick || 0)) * multiplier;
                        return totalPick.toLocaleString();
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary-900 text-right bg-primary-50 font-medium">
                      {(() => {
                        const dayH1 = item.dayShift?.h1 || 0;
                        const dayH2 = item.dayShift?.h2 || 0;
                        const nightH1 = item.nightShift?.h1 || 0;
                        const nightH2 = item.nightShift?.h2 || 0;
                        return `${dayH1 + nightH1}/${dayH2 + nightH2}`;
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary-900 text-right bg-primary-50 font-medium">
                      {(() => {
                        const dayWorph = item.dayShift?.worph || 0;
                        const nightWorph = item.nightShift?.worph || 0;
                        const count = (item.dayShift ? 1 : 0) + (item.nightShift ? 1 : 0);
                        
                        if (count === 0) return '-';
                        
                        const avgWorph = (dayWorph + nightWorph) / count;
                        return avgWorph.toFixed(1);
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )
          )}
        </div>

        {/* Summary Footer */}
        {!loading && (viewMode === 'daywise' ? summaryData.length > 0 : groupedData.length > 0) && (
          <div className="bg-secondary-100 px-4 py-3 border-t border-secondary-200">
            {viewMode === 'daywise' ? (
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary-700 font-medium">
                  Total Days: {summaryData.length}
                </span>
                <div className="flex space-x-6 text-secondary-700">
                  <span>
                    Total Meter: <span className="font-semibold text-secondary-900">
                      {summaryData.reduce((sum, item) => sum + (item.totalMeter || 0), 0).toFixed(2)}
                    </span>
                  </span>
                  <span>
                    Total Pick: <span className="font-semibold text-secondary-900">
                      {summaryData.reduce((sum, item) => sum + (item.totalPick || 0), 0).toLocaleString()}
                    </span>
                  </span>
                  <span>
                    Total Units: <span className="font-semibold text-secondary-900">
                      {summaryData.reduce((sum, item) => sum + (item.totalUnitsConsumed || 0), 0).toFixed(2)} kWh
                    </span>
                  </span>
                  <span>
                    Avg Efficiency: <span className="font-semibold text-secondary-900">
                      {(summaryData.reduce((sum, item) => sum + (item.totalEfficiency || 0), 0) / summaryData.length).toFixed(1)}%
                    </span>
                  </span>
                </div>
              </div>
            ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary-700 font-medium">
                  Total Records: {groupedData.length} (Machine-Date combinations)
                </span>
              </div>
              
              {/* Day Shift Totals */}
              <div className="flex items-center text-sm border-t border-secondary-200 pt-2">
                <span className="text-secondary-700 font-semibold w-32">Day Shift:</span>
                <div className="flex space-x-6 text-secondary-700">
                  <span>
                    Runtime: <span className="font-semibold text-secondary-900">
                      {formatRuntime(groupedData.reduce((sum, item) => sum + (item.dayShift?.runtime || 0), 0))}
                    </span>
                  </span>
                  <span>
                    Avg Eff: <span className="font-semibold text-secondary-900">
                      {(() => {
                        const dayShifts = groupedData.filter(item => item.dayShift);
                        const avgEff = dayShifts.length > 0 
                          ? dayShifts.reduce((sum, item) => sum + (item.dayShift?.efficiency || 0), 0) / dayShifts.length 
                          : 0;
                        return avgEff.toFixed(1);
                      })()}%
                    </span>
                  </span>
                  <span>
                    Meter: <span className="font-semibold text-secondary-900">
                      {groupedData.reduce((sum, item) => {
                        const multiplier = item.machineType === 'double' ? 2 : 1;
                        return sum + (item.dayShift?.meter || 0) * multiplier;
                      }, 0).toFixed(2)}
                    </span>
                  </span>
                  <span>
                    Pick: <span className="font-semibold text-secondary-900">
                      {groupedData.reduce((sum, item) => {
                        const multiplier = item.machineType === 'double' ? 2 : 1;
                        return sum + (item.dayShift?.totalPick || 0) * multiplier;
                      }, 0).toLocaleString()}
                    </span>
                  </span>
                  <span>
                    H1/H2: <span className="font-semibold text-secondary-900">
                      {groupedData.reduce((sum, item) => sum + (item.dayShift?.h1 || 0), 0)}/
                      {groupedData.reduce((sum, item) => sum + (item.dayShift?.h2 || 0), 0)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Night Shift Totals */}
              <div className="flex items-center text-sm border-t border-secondary-200 pt-2">
                <span className="text-secondary-700 font-semibold w-32">Night Shift:</span>
                <div className="flex space-x-6 text-secondary-700">
                  <span>
                    Runtime: <span className="font-semibold text-secondary-900">
                      {formatRuntime(groupedData.reduce((sum, item) => sum + (item.nightShift?.runtime || 0), 0))}
                    </span>
                  </span>
                  <span>
                    Avg Eff: <span className="font-semibold text-secondary-900">
                      {(() => {
                        const nightShifts = groupedData.filter(item => item.nightShift);
                        const avgEff = nightShifts.length > 0 
                          ? nightShifts.reduce((sum, item) => sum + (item.nightShift?.efficiency || 0), 0) / nightShifts.length 
                          : 0;
                        return avgEff.toFixed(1);
                      })()}%
                    </span>
                  </span>
                  <span>
                    Meter: <span className="font-semibold text-secondary-900">
                      {groupedData.reduce((sum, item) => {
                        const multiplier = item.machineType === 'double' ? 2 : 1;
                        return sum + (item.nightShift?.meter || 0) * multiplier;
                      }, 0).toFixed(2)}
                    </span>
                  </span>
                  <span>
                    Pick: <span className="font-semibold text-secondary-900">
                      {groupedData.reduce((sum, item) => {
                        const multiplier = item.machineType === 'double' ? 2 : 1;
                        return sum + (item.nightShift?.totalPick || 0) * multiplier;
                      }, 0).toLocaleString()}
                    </span>
                  </span>
                  <span>
                    H1/H2: <span className="font-semibold text-secondary-900">
                      {groupedData.reduce((sum, item) => sum + (item.nightShift?.h1 || 0), 0)}/
                      {groupedData.reduce((sum, item) => sum + (item.nightShift?.h2 || 0), 0)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Total Shift Totals */}
              <div className="flex items-center text-sm border-t border-secondary-200 pt-2 bg-secondary-200 -mx-4 px-4 py-2">
                <span className="text-secondary-900 font-bold w-32">Total:</span>
                <div className="flex space-x-6 text-secondary-700">
                  <span>
                    Runtime: <span className="font-bold text-secondary-900">
                      {formatRuntime(groupedData.reduce((sum, item) => {
                        return sum + (item.dayShift?.runtime || 0) + (item.nightShift?.runtime || 0);
                      }, 0))}
                    </span>
                  </span>
                  <span>
                    Avg Eff: <span className="font-bold text-secondary-900">
                      {(() => {
                        const allShifts = [];
                        groupedData.forEach(item => {
                          if (item.dayShift) allShifts.push(item.dayShift.efficiency || 0);
                          if (item.nightShift) allShifts.push(item.nightShift.efficiency || 0);
                        });
                        const avgEff = allShifts.length > 0 
                          ? allShifts.reduce((sum, eff) => sum + eff, 0) / allShifts.length 
                          : 0;
                        return avgEff.toFixed(1);
                      })()}%
                    </span>
                  </span>
                  <span>
                    Meter: <span className="font-bold text-secondary-900">
                      {groupedData.reduce((sum, item) => {
                        const multiplier = item.machineType === 'double' ? 2 : 1;
                        return sum + ((item.dayShift?.meter || 0) + (item.nightShift?.meter || 0)) * multiplier;
                      }, 0).toFixed(2)}
                    </span>
                  </span>
                  <span>
                    Pick: <span className="font-bold text-secondary-900">
                      {groupedData.reduce((sum, item) => {
                        const multiplier = item.machineType === 'double' ? 2 : 1;
                        return sum + ((item.dayShift?.totalPick || 0) + (item.nightShift?.totalPick || 0)) * multiplier;
                      }, 0).toLocaleString()}
                    </span>
                  </span>
                  <span>
                    H1/H2: <span className="font-bold text-secondary-900">
                      {groupedData.reduce((sum, item) => sum + (item.dayShift?.h1 || 0) + (item.nightShift?.h1 || 0), 0)}/
                      {groupedData.reduce((sum, item) => sum + (item.dayShift?.h2 || 0) + (item.nightShift?.h2 || 0), 0)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
