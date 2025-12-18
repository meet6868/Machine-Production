import { useState, useEffect } from 'react';
import { screenshotAPI, workerAPI } from '../utils/api';

const WorkerNameMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);

  const [formData, setFormData] = useState({
    displayName: '',
    systemName: '',
    workerId: '',
    aliases: [],
    isActive: true,
  });

  const [aliasInput, setAliasInput] = useState('');

  useEffect(() => {
    fetchMappings();
    fetchWorkers();
  }, []);

  const fetchMappings = async () => {
    try {
      const response = await screenshotAPI.getWorkerMappings();
      setMappings(response.data.data);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      setError('Failed to fetch worker name mappings');
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getAll();
      setWorkers(response.data.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.displayName.trim() || !formData.systemName.trim()) {
      setError('Display Name and System Name are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingMapping) {
        await screenshotAPI.updateWorkerMapping(editingMapping._id, formData);
        setSuccess('Worker name mapping updated successfully');
      } else {
        await screenshotAPI.createWorkerMapping(formData);
        setSuccess('Worker name mapping created successfully');
      }

      await fetchMappings();
      handleReset();
    } catch (error) {
      console.error('Error saving mapping:', error);
      setError(error.response?.data?.message || 'Failed to save worker name mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      displayName: mapping.displayName,
      systemName: mapping.systemName,
      workerId: mapping.workerId?._id || '',
      aliases: mapping.aliases || [],
      isActive: mapping.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (mappingId) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;

    try {
      await screenshotAPI.deleteWorkerMapping(mappingId);
      setSuccess('Worker name mapping deleted successfully');
      await fetchMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      setError('Failed to delete worker name mapping');
    }
  };

  const handleReset = () => {
    setFormData({
      displayName: '',
      systemName: '',
      workerId: '',
      aliases: [],
      isActive: true,
    });
    setAliasInput('');
    setEditingMapping(null);
    setShowForm(false);
  };

  const handleAddAlias = () => {
    if (aliasInput.trim() && !formData.aliases.includes(aliasInput.trim().toUpperCase())) {
      setFormData({
        ...formData,
        aliases: [...formData.aliases, aliasInput.trim().toUpperCase()],
      });
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (alias) => {
    setFormData({
      ...formData,
      aliases: formData.aliases.filter(a => a !== alias),
    });
  };

  const handleWorkerSelect = (workerId) => {
    const worker = workers.find(w => w._id === workerId);
    if (worker) {
      setFormData({
        ...formData,
        workerId,
        systemName: worker.name,
      });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Worker Name Mapping</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add New Mapping'}
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">About Worker Name Mapping</h3>
          <p className="text-sm text-blue-800">
            Map display names (as they appear on machine screens) to system worker names. 
            This ensures that extracted screenshot data matches your worker records. 
            You can also add aliases for variations like "JOHN", "J.SMITH", etc.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name (as shown on machine) *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., JOHN, J.SMITH"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Will be stored in uppercase</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Worker from System
                  </label>
                  <select
                    value={formData.workerId}
                    onChange={(e) => handleWorkerSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Worker --</option>
                    {workers.map((worker) => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Name *
                  </label>
                  <input
                    type="text"
                    value={formData.systemName}
                    onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John Smith"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is how the worker name will appear in the system
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aliases (alternative display names)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAlias())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add alternative names (e.g., J.S, JOHNSMITH)"
                    />
                    <button
                      type="button"
                      onClick={handleAddAlias}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Add
                    </button>
                  </div>

                  {formData.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.aliases.map((alias, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {alias}
                          <button
                            type="button"
                            onClick={() => handleRemoveAlias(alias)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingMapping ? 'Update Mapping' : 'Create Mapping'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mappings List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aliases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mappings.map((mapping) => (
                <tr key={mapping._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mapping.displayName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mapping.systemName}</div>
                    {mapping.workerId && (
                      <div className="text-xs text-gray-500">
                        Linked to: {mapping.workerId.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {mapping.aliases && mapping.aliases.length > 0 ? (
                        mapping.aliases.map((alias, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {alias}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No aliases</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        mapping.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {mapping.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(mapping)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(mapping._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {mappings.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No worker name mappings found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkerNameMapping;
