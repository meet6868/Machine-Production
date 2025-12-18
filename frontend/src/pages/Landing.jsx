import { Link } from 'react-router-dom';
import { FiSettings, FiUsers, FiBarChart2, FiCheckCircle, FiClock, FiTrendingUp, FiShield, FiZap } from 'react-icons/fi';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FiSettings className="text-primary-600 text-3xl mr-3" />
              <span className="text-2xl font-bold text-secondary-900">Production Tracker</span>
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link to="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-secondary-900 mb-6">
              Streamline Your Machine Production
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Track machines, manage workers, and monitor production in real-time. 
              Built for fabric manufacturers who demand efficiency and accuracy.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/signup" className="btn-primary text-lg px-8 py-3">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
            
            {/* Feature Icons */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-card p-6">
                <FiSettings className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Machine Management</h3>
                <p className="text-secondary-600">
                  Track single and double-width machines with detailed specifications
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-card p-6">
                <FiUsers className="h-12 w-12 text-success-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Worker Tracking</h3>
                <p className="text-secondary-600">
                  Manage workers across different shifts and machine assignments
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-card p-6">
                <FiBarChart2 className="h-12 w-12 text-warning-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Production Analytics</h3>
                <p className="text-secondary-600">
                  Monitor daily production, fabric output, and performance metrics
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 mb-4">
              Everything You Need to Manage Production
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Powerful features designed specifically for fabric manufacturing operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-start">
              <div className="bg-primary-100 rounded-lg p-3 mb-4">
                <FiCheckCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Multi-Machine Support
              </h3>
              <p className="text-secondary-600">
                Manage unlimited machines with single and double fabric production configurations
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-start">
              <div className="bg-success-100 rounded-lg p-3 mb-4">
                <FiClock className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Shift Management
              </h3>
              <p className="text-secondary-600">
                Track morning, afternoon, and night shifts with worker assignments
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-start">
              <div className="bg-warning-100 rounded-lg p-3 mb-4">
                <FiTrendingUp className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Real-time Analytics
              </h3>
              <p className="text-secondary-600">
                Get instant insights into production metrics and performance trends
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-start">
              <div className="bg-purple-100 rounded-lg p-3 mb-4">
                <FiShield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Company Isolation
              </h3>
              <p className="text-secondary-600">
                Your data is completely isolated and secure from other companies
              </p>
            </div>

            {/* Feature 5 */}
            <div className="flex flex-col items-start">
              <div className="bg-blue-100 rounded-lg p-3 mb-4">
                <FiUsers className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Multi-User Access
              </h3>
              <p className="text-secondary-600">
                Team members from the same company can collaborate seamlessly
              </p>
            </div>

            {/* Feature 6 */}
            <div className="flex flex-col items-start">
              <div className="bg-green-100 rounded-lg p-3 mb-4">
                <FiZap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Easy to Use
              </h3>
              <p className="text-secondary-600">
                Intuitive interface with step-by-step onboarding for quick setup
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Create Account
              </h3>
              <p className="text-secondary-600">
                Sign up with your company name and create your account in seconds
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Add Machines & Workers
              </h3>
              <p className="text-secondary-600">
                Set up your machines and register workers with their shift details
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Track Production
              </h3>
              <p className="text-secondary-600">
                Record daily production data and monitor your performance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Production?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join manufacturers who trust Production Tracker for their daily operations
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/signup" 
              className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/login" 
              className="bg-primary-700 text-white hover:bg-primary-800 px-8 py-3 rounded-lg font-semibold text-lg border-2 border-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <FiSettings className="text-primary-400 text-2xl mr-2" />
              <span className="text-xl font-bold">Production Tracker</span>
            </div>
            <p className="text-secondary-400">
              © 2025 Production Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
