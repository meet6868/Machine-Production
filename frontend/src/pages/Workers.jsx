import { useState, useEffect } from 'react';
import { workerAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit, FiTrash2, FiX, FiUser } from 'react-icons/fi';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    aadhaarNumber: '',
    phone: '',
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getAll();
      setWorkers(response.data.data);
    } catch (error) {
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await workerAPI.update(editingWorker._id, formData);
        toast.success('Worker updated successfully');
      } else {
        await workerAPI.create(formData);
        toast.success('Worker added successfully');
      }
      fetchWorkers();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await workerAPI.delete(id);
        toast.success('Worker deleted successfully');
        fetchWorkers();
      } catch (error) {
        toast.error('Failed to delete worker');
      }
    }
  };

  const openModal = (worker = null) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        name: worker.name,
        aadhaarNumber: worker.aadhaarNumber || '',
        phone: worker.phone || '',
      });
    } else {
      setEditingWorker(null);
      setFormData({
        name: '',
        aadhaarNumber: '',
        phone: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWorker(null);
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
          <h1 className="text-3xl font-bold text-secondary-900">Workers</h1>
          <p className="text-secondary-600 mt-2">Manage your production workers</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Worker
        </button>
      </div>

      {workers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-secondary-600 mb-4">No workers added yet</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add Your First Worker
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">
                    Aadhaar Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {workers.map((worker) => (
                  <tr key={worker._id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiUser className="h-5 w-5 text-primary-600" />
                        <div className="text-sm font-medium text-secondary-900">{worker.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-600">
                        {worker.aadhaarNumber || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {worker.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(worker)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <FiEdit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(worker._id)}
                        className="text-danger-600 hover:text-danger-900"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  {editingWorker ? 'Edit Worker' : 'Add New Worker'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="label">
                    Worker Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="aadhaarNumber" className="label">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    id="aadhaarNumber"
                    className="input"
                    placeholder="XXXX-XXXX-XXXX"
                    maxLength="12"
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingWorker ? 'Update' : 'Add'} Worker
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
