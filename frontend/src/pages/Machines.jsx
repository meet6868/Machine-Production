import { useState, useEffect } from 'react';
import { machineAPI, productionAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit, FiTrash2, FiX, FiActivity, FiClock, FiTrendingUp, FiZap } from 'react-icons/fi';

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [yesterdaySummaries, setYesterdaySummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [formData, setFormData] = useState({
    machineNumber: '',
    type: 'single',
    description: '',
  });

  useEffect(() => {
    fetchMachines();
    fetchYesterdaySummaries();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      setMachines(response.data.data);
    } catch (error) {
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  const fetchYesterdaySummaries = async () => {
    try {
      const response = await productionAPI.getYesterdaySummaryByMachine();
      // Convert array to object with machine ID as key
      const summariesMap = {};
      response.data.data.forEach(item => {
        summariesMap[item.machine._id] = item.summary;
      });
      setYesterdaySummaries(summariesMap);
    } catch (error) {
      console.error('Failed to load yesterday summaries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMachine) {
        await machineAPI.update(editingMachine._id, formData);
        toast.success('Machine updated successfully');
      } else {
        await machineAPI.create(formData);
        toast.success('Machine added successfully');
      }
      fetchMachines();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
        await machineAPI.delete(id);
        toast.success('Machine deleted successfully');
        fetchMachines();
      } catch (error) {
        toast.error('Failed to delete machine');
      }
    }
  };

  const openModal = (machine = null) => {
    if (machine) {
      setEditingMachine(machine);
      setFormData({
        machineNumber: machine.machineNumber,
        type: machine.type,
        description: machine.description || '',
      });
    } else {
      setEditingMachine(null);
      setFormData({
        machineNumber: '',
        type: 'single',
        description: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMachine(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Machines</h1>
          <p className="text-secondary-600 mt-2">Manage your production machines</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Machine
        </button>
      </div>

      {machines.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-secondary-600 mb-4">No machines added yet</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add Your First Machine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => {
            const yesterdaySummary = yesterdaySummaries[machine._id];
            
            return (
              <div key={machine._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-secondary-900">
                      Machine {machine.machineNumber}
                    </h3>
                    <span
                      className={`badge mt-2 ${
                        machine.type === 'single' ? 'badge-primary' : 'badge-success'
                      }`}
                    >
                      {machine.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(machine)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <FiEdit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(machine._id)}
                      className="text-danger-600 hover:text-danger-800"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {machine.description && (
                  <div className="mb-4 pb-4 border-b border-secondary-200">
                    <p className="text-sm text-secondary-600">{machine.description}</p>
                  </div>
                )}

                {/* Yesterday's Summary */}
                {yesterdaySummary && yesterdaySummary.totalProductions > 0 ? (
                  <div className="bg-secondary-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
                        <FiActivity className="h-4 w-4" />
                        Yesterday's Summary
                      </h4>
                      <span className="text-xs text-secondary-500">
                        {new Date(yesterdaySummary.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Total Meter */}
                      <div className="bg-white rounded p-2">
                        <div className="flex items-center gap-1 text-xs text-secondary-600 mb-1">
                          <FiTrendingUp className="h-3 w-3" />
                          <span>Total Meter</span>
                        </div>
                        <div className="text-lg font-bold text-primary-600">
                          {yesterdaySummary.totalMeter.toLocaleString()}
                        </div>
                      </div>

                      {/* Total Runtime */}
                      <div className="bg-white rounded p-2">
                        <div className="flex items-center gap-1 text-xs text-secondary-600 mb-1">
                          <FiClock className="h-3 w-3" />
                          <span>Runtime</span>
                        </div>
                        <div className="text-lg font-bold text-secondary-900">
                          {yesterdaySummary.totalRuntime} min
                        </div>
                      </div>

                      {/* Average Efficiency */}
                      <div className="bg-white rounded p-2">
                        <div className="text-xs text-secondary-600 mb-1">Avg Efficiency</div>
                        <div className="text-lg font-bold text-success-600">
                          {yesterdaySummary.avgEfficiency}%
                        </div>
                      </div>

                      {/* Total Productions */}
                      <div className="bg-white rounded p-2">
                        <div className="text-xs text-secondary-600 mb-1">Productions</div>
                        <div className="text-lg font-bold text-secondary-900">
                          {yesterdaySummary.totalProductions}
                        </div>
                      </div>
                    </div>

                    {/* Machine Settings */}
                    {(yesterdaySummary.speed > 0 || yesterdaySummary.cfm > 0 || yesterdaySummary.pik > 0) && (
                      <div className="pt-2 border-t border-secondary-200">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {yesterdaySummary.speed > 0 && (
                            <div>
                              <span className="text-secondary-600">Speed:</span>
                              <span className="ml-1 font-semibold">{yesterdaySummary.speed}</span>
                            </div>
                          )}
                          {yesterdaySummary.cfm > 0 && (
                            <div>
                              <span className="text-secondary-600">CFM:</span>
                              <span className="ml-1 font-semibold">{yesterdaySummary.cfm}</span>
                            </div>
                          )}
                          {yesterdaySummary.pik > 0 && (
                            <div>
                              <span className="text-secondary-600">PIK:</span>
                              <span className="ml-1 font-semibold">{yesterdaySummary.pik}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Electricity Consumption */}
                    {yesterdaySummary.unitsConsumed !== null && (
                      <div className="pt-2 border-t border-secondary-200">
                        <div className="flex items-center gap-2 text-xs">
                          <FiZap className="h-4 w-4 text-warning-500" />
                          <span className="text-secondary-600">Electricity:</span>
                          <span className="font-semibold text-warning-600">
                            {yesterdaySummary.unitsConsumed.toFixed(1)} units
                          </span>
                          <span className="text-secondary-500">
                            ({yesterdaySummary.previousReading} → {yesterdaySummary.currentReading})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-secondary-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-secondary-500">No production data for yesterday</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={closeModal}>
              <div className="absolute inset-0 bg-secondary-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={closeModal}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">
                  {editingMachine ? 'Edit Machine' : 'Add New Machine'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="machineNumber" className="label">
                    Machine Number *
                  </label>
                  <input
                    type="text"
                    id="machineNumber"
                    required
                    className="input"
                    value={formData.machineNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, machineNumber: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="type" className="label">
                    Type *
                  </label>
                  <select
                    id="type"
                    required
                    className="input"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                  </select>
                  <p className="mt-1 text-sm text-secondary-500">
                    Single: Standard fabric production | Double: Side-by-side double length
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows="4"
                    className="input"
                    placeholder="Add any notes or details about this machine..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingMachine ? 'Update' : 'Add'} Machine
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
