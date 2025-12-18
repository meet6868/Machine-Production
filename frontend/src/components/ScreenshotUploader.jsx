import { useState, useRef } from 'react';
import { screenshotAPI } from '../utils/api';
import { FiUpload, FiX, FiCheck, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const ScreenshotUploader = ({ machineId, shift, date, onDataExtracted }) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      // Get default template
      const templateResponse = await screenshotAPI.getDefaultTemplate();
      const template = templateResponse.data.data;

      if (!template) {
        setError('No default screenshot mapping template found. Please create one first.');
        setUploading(false);
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('screenshot', file);
      formData.append('templateId', template._id);
      formData.append('machineId', machineId);
      formData.append('shift', shift);
      formData.append('date', date);

      // Upload screenshot
      const uploadResponse = await screenshotAPI.uploadScreenshot(formData);
      const { recordId: newRecordId } = uploadResponse.data.data;
      setRecordId(newRecordId);
      setProcessing(true);

      // Poll for processing completion
      pollProcessingStatus(newRecordId);
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      setError(error.response?.data?.message || 'Failed to upload screenshot');
      setUploading(false);
    }
  };

  const pollProcessingStatus = async (id) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await screenshotAPI.getStatus(id);
        const record = response.data.data;

        if (record.status === 'completed' || record.status === 'manual_review') {
          clearInterval(interval);
          setUploading(false);
          setProcessing(false);
          setExtractedData(record.extractedData);
          setConfidence(record.confidenceScores);
          setShowPreview(true);

          if (record.status === 'manual_review') {
            setError('Low confidence detected. Please review and correct the extracted data.');
          } else {
            setSuccess('Screenshot processed successfully!');
          }
        } else if (record.status === 'failed') {
          clearInterval(interval);
          setUploading(false);
          setProcessing(false);
          setError(record.processingError || 'Screenshot processing failed');
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setUploading(false);
          setProcessing(false);
          setError('Processing timeout. Please try again.');
        }
      } catch (error) {
        clearInterval(interval);
        setUploading(false);
        setProcessing(false);
        setError('Failed to get processing status');
      }
    }, 1000);
  };

  const handleApplyData = () => {
    if (extractedData && onDataExtracted) {
      onDataExtracted(extractedData);
      setSuccess('Data applied to form!');
      setTimeout(() => {
        setShowPreview(false);
        setExtractedData(null);
        setConfidence(null);
      }, 1500);
    }
  };

  const handleEditData = (field, value) => {
    setExtractedData({
      ...extractedData,
      [field]: value,
    });
  };

  const handleVerifyAndApply = async () => {
    if (!recordId || !extractedData) return;

    try {
      await screenshotAPI.verifyData(recordId, { extractedData });
      handleApplyData();
    } catch (error) {
      console.error('Error verifying data:', error);
      setError('Failed to verify data');
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setExtractedData(null);
    setConfidence(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading || processing}
          className="hidden"
          id={`screenshot-upload-${machineId}-${shift}`}
        />
        <label
          htmlFor={`screenshot-upload-${machineId}-${shift}`}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${
            (uploading || processing) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading || processing ? (
            <>
              <FiRefreshCw className="animate-spin" />
              <span>{processing ? 'Processing...' : 'Uploading...'}</span>
            </>
          ) : (
            <>
              <FiUpload />
              <span>Upload Screenshot</span>
            </>
          )}
        </label>
        <span className="text-sm text-gray-600">
          Upload machine display screenshot to auto-fill data
        </span>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 rounded-lg">
          <FiAlertCircle />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-100 text-green-700 rounded-lg">
          <FiCheck />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Preview and Edit Extracted Data */}
      {showPreview && extractedData && (
        <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-800">Extracted Data</h4>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
              title="Close"
            >
              <FiX />
            </button>
          </div>

          {/* Overall Confidence */}
          {confidence && (
            <div className="mb-4 p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Confidence:</span>
                <span className={`text-sm font-medium ${getConfidenceColor(confidence.overall)}`}>
                  {confidence.overall.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Extracted Fields */}
          <div className="space-y-3">
            {extractedData.machineName && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Machine Name
                  {confidence && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceBadge(confidence.machineName)}`}>
                      {confidence.machineName.toFixed(0)}%
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={extractedData.machineName}
                  onChange={(e) => handleEditData('machineName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {extractedData.productionLength && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Production Length (Meter)
                  {confidence && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceBadge(confidence.productionLength)}`}>
                      {confidence.productionLength.toFixed(0)}%
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={extractedData.productionLength}
                  onChange={(e) => handleEditData('productionLength', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {extractedData.totalPick && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Total Pick
                  {confidence && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceBadge(confidence.totalPick)}`}>
                      {confidence.totalPick.toFixed(0)}%
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={extractedData.totalPick}
                  onChange={(e) => handleEditData('totalPick', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {extractedData.speed && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Speed
                  {confidence && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceBadge(confidence.speed)}`}>
                      {confidence.speed.toFixed(0)}%
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={extractedData.speed}
                  onChange={(e) => handleEditData('speed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {extractedData.h1 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  H1
                  {confidence && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceBadge(confidence.h1)}`}>
                      {confidence.h1.toFixed(0)}%
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={extractedData.h1}
                  onChange={(e) => handleEditData('h1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {extractedData.h2 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  H2
                  {confidence && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceBadge(confidence.h2)}`}>
                      {confidence.h2.toFixed(0)}%
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={extractedData.h2}
                  onChange={(e) => handleEditData('h2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {extractedData.worph && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  WorPH
                  {confidence && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConfidenceBadge(confidence.worph)}`}>
                      {confidence.worph.toFixed(0)}%
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={extractedData.worph}
                  onChange={(e) => handleEditData('worph', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleVerifyAndApply}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <FiCheck />
              Apply to Form
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Review and edit the extracted data before applying. Low confidence fields are highlighted.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScreenshotUploader;
