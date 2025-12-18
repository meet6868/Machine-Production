import { useState, useEffect, useRef } from 'react';
import { screenshotAPI } from '../utils/api';

const ScreenshotMappingConfig = () => {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [sampleImage, setSampleImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fieldMappings, setFieldMappings] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [machineDisplayType, setMachineDisplayType] = useState('standard');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const fieldOptions = [
    { value: 'machineName', label: 'Machine Name', hint: 'text' },
    { value: 'productionLength', label: 'Production Length (Meter)', hint: 'number' },
    { value: 'totalPick', label: 'Total Pick', hint: 'number' },
    { value: 'speed', label: 'Speed', hint: 'number' },
    { value: 'h1', label: 'H1', hint: 'number' },
    { value: 'h2', label: 'H2', hint: 'number' },
    { value: 'worph', label: 'WorPH', hint: 'number' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await screenshotAPI.getTemplates();
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to fetch templates');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSampleImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!selectedField) {
      setError('Please select a field to map first');
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setStartPos({ x, y });
    setDrawing(true);
  };

  const handleCanvasMouseMove = (e) => {
    if (!drawing || !startPos) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setCurrentBox({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    });

    drawCanvas();
  };

  const handleCanvasMouseUp = (e) => {
    if (!drawing || !currentBox) return;

    const canvas = canvasRef.current;
    const imgWidth = imageRef.current.width;
    const imgHeight = imageRef.current.height;

    // Convert pixel coordinates to percentages
    const mapping = {
      fieldName: selectedField,
      x: (currentBox.x / imgWidth) * 100,
      y: (currentBox.y / imgHeight) * 100,
      width: (currentBox.width / imgWidth) * 100,
      height: (currentBox.height / imgHeight) * 100,
      preprocessingHint: fieldOptions.find(f => f.value === selectedField)?.hint || 'text',
    };

    // Remove existing mapping for this field if any
    const updatedMappings = fieldMappings.filter(m => m.fieldName !== selectedField);
    setFieldMappings([...updatedMappings, mapping]);

    setDrawing(false);
    setStartPos(null);
    setCurrentBox(null);
    setSelectedField(null);
    setSuccess(`Field "${selectedField}" mapped successfully`);
    setTimeout(() => setSuccess(''), 3000);

    drawCanvas();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!img || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw existing mappings
    fieldMappings.forEach((mapping) => {
      const x = (mapping.x / 100) * canvas.width;
      const y = (mapping.y / 100) * canvas.height;
      const width = (mapping.width / 100) * canvas.width;
      const height = (mapping.height / 100) * canvas.height;

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x, y - 20, width, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(mapping.fieldName, x + 5, y - 5);
    });

    // Draw current box being drawn
    if (drawing && currentBox) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    if (imagePreview) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        drawCanvas();
      };
      img.src = imagePreview;
    }
  }, [imagePreview, fieldMappings, currentBox]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    if (fieldMappings.length === 0) {
      setError('Please map at least one field');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        templateName,
        description,
        machineDisplayType,
        fieldMappings,
        isDefault,
      };

      if (currentTemplate) {
        await screenshotAPI.updateTemplate(currentTemplate._id, data);
        setSuccess('Template updated successfully');
      } else {
        await screenshotAPI.createTemplate(data);
        setSuccess('Template created successfully');
      }

      await fetchTemplates();
      handleReset();
    } catch (error) {
      console.error('Error saving template:', error);
      setError(error.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = async (templateId) => {
    try {
      const response = await screenshotAPI.getTemplate(templateId);
      const template = response.data.data;

      setCurrentTemplate(template);
      setTemplateName(template.templateName);
      setDescription(template.description || '');
      setMachineDisplayType(template.machineDisplayType);
      setFieldMappings(template.fieldMappings || []);
      setIsDefault(template.isDefault);
    } catch (error) {
      console.error('Error loading template:', error);
      setError('Failed to load template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await screenshotAPI.deleteTemplate(templateId);
      setSuccess('Template deleted successfully');
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    }
  };

  const handleRemoveMapping = (fieldName) => {
    setFieldMappings(fieldMappings.filter(m => m.fieldName !== fieldName));
    drawCanvas();
  };

  const handleReset = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setDescription('');
    setMachineDisplayType('standard');
    setFieldMappings([]);
    setIsDefault(false);
    setSampleImage(null);
    setImagePreview(null);
    setSelectedField(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Screenshot Field Mapping Configuration</h1>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Template List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Saved Templates</h2>
            
            <button
              onClick={handleReset}
              className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Create New Template
            </button>

            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template._id}
                  className={`p-3 border rounded-lg ${
                    currentTemplate?._id === template._id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{template.templateName}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.fieldMappings?.length || 0} fields mapped
                      </p>
                      {template.isDefault && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadTemplate(template._id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No templates created yet</p>
              )}
            </div>
          </div>

          {/* Middle Panel - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Details */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Template Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Standard Machine Display"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Type
                    </label>
                    <input
                      type="text"
                      value={machineDisplayType}
                      onChange={(e) => setMachineDisplayType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., standard, advanced"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Set as Default Template</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload and Mapping */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Field Mapping</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Sample Screenshot *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a clear screenshot of your machine display
                </p>
              </div>

              {imagePreview && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Field to Map
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {fieldOptions.map((field) => {
                        const isMapped = fieldMappings.some(m => m.fieldName === field.value);
                        return (
                          <button
                            key={field.value}
                            onClick={() => setSelectedField(field.value)}
                            disabled={isMapped}
                            className={`px-3 py-2 rounded-lg border ${
                              selectedField === field.value
                                ? 'bg-blue-600 text-white border-blue-600'
                                : isMapped
                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {field.label} {isMapped && '✓'}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedField ? (
                        <span className="text-blue-600">
                          Click and drag on the image to mark the "{fieldOptions.find(f => f.value === selectedField)?.label}" field
                        </span>
                      ) : (
                        'Select a field above, then draw a box around it in the image'
                      )}
                    </p>
                  </div>

                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      className="w-full cursor-crosshair"
                      style={{ maxHeight: '600px' }}
                    />
                  </div>

                  {/* Mapped Fields List */}
                  {fieldMappings.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Mapped Fields:</h3>
                      <div className="space-y-2">
                        {fieldMappings.map((mapping) => (
                          <div
                            key={mapping.fieldName}
                            className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {fieldOptions.find(f => f.value === mapping.fieldName)?.label}
                            </span>
                            <button
                              onClick={() => handleRemoveMapping(mapping.fieldName)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove mapping"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveTemplate}
                  disabled={loading || !templateName || fieldMappings.length === 0}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : currentTemplate ? 'Update Template' : 'Save Template'}
                </button>
                {currentTemplate && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotMappingConfig;
