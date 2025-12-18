import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FiSettings, FiUsers, FiCheckCircle } from 'react-icons/fi';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Machine Production Tracker',
      description: 'This system helps you track machine production, workers, and fabric output efficiently.',
      icon: <FiCheckCircle className="w-16 h-16 text-primary-600 mx-auto mb-4" />,
      content: (
        <div className="space-y-4 text-secondary-700">
          <p>With this application, you can:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Manage multiple machines with different configurations</li>
            <li>Track worker assignments and shifts</li>
            <li>Record daily production data</li>
            <li>Generate reports and analytics</li>
            <li>Collaborate with team members from your company</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Step 1: Add Your Machines',
      description: 'First, add details about your production machines.',
      icon: <FiSettings className="w-16 h-16 text-primary-600 mx-auto mb-4" />,
      content: (
        <div className="space-y-4 text-secondary-700">
          <p>For each machine, you will need to provide:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Machine Number:</strong> A unique identifier for the machine</li>
            <li><strong>Type:</strong> Single or Double (for fabric production)</li>
            <li>
              <strong>Single:</strong> Produces fabric in one length
              <br />
              <strong>Double:</strong> Produces fabric side-by-side, double the length
            </li>
            <li><strong>Description:</strong> (Optional) Any notes or details about the machine</li>
          </ul>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4">
            <p className="text-sm">
              <strong>Tip:</strong> You can add machines later from the Machines page.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Step 2: Add Your Workers',
      description: 'Next, register workers who operate the machines.',
      icon: <FiUsers className="w-16 h-16 text-primary-600 mx-auto mb-4" />,
      content: (
        <div className="space-y-4 text-secondary-700">
          <p>For each worker, you will provide:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Name:</strong> Worker&apos;s full name</li>
            <li><strong>Aadhaar Number:</strong> Unique identification number</li>
            <li><strong>Phone Number:</strong> Contact number</li>
          </ul>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4">
            <p className="text-sm">
              <strong>Tip:</strong> Workers can operate different machines on different shifts. Shift is selected when recording production data.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Ready to Start!',
      description: 'You are all set to begin tracking production.',
      icon: <FiCheckCircle className="w-16 h-16 text-success-600 mx-auto mb-4" />,
      content: (
        <div className="space-y-4 text-secondary-700">
          <p>Once you have added machines and workers, you can:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Record daily production entries</li>
            <li>Assign workers to specific machines</li>
            <li>Track fabric quantity and length produced</li>
            <li>View production statistics and trends</li>
          </ul>
          <div className="bg-success-50 border border-success-200 rounded-lg p-4 mt-4">
            <p className="text-sm">
              <strong>Note:</strong> All data is isolated to your company - users from different companies cannot see your data.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await authAPI.updateFirstLogin();
      toast.success('Setup complete! Welcome to the dashboard.');
      navigate('/');
    } catch (error) {
      toast.error('Failed to complete setup');
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="card">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 mx-1 rounded-full transition-all ${
                    index <= currentStep ? 'bg-primary-600' : 'bg-secondary-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-secondary-600 text-center">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            {currentStepData.icon}
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-secondary-600">{currentStepData.description}</p>
          </div>

          <div className="mb-8">{currentStepData.content}</div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`btn-secondary ${
                currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button onClick={handleNext} className="btn-primary">
                Next
              </button>
            ) : (
              <button onClick={handleFinish} className="btn-success">
                Get Started
              </button>
            )}
          </div>

          {/* Skip Option */}
          <div className="mt-4 text-center">
            <button
              onClick={handleFinish}
              className="text-sm text-secondary-500 hover:text-secondary-700"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
