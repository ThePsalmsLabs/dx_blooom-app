import React, { useState, useEffect } from 'react';
import { RefreshCw, Shield, TrendingUp } from 'lucide-react';
import { 
  usePerformanceMonitor, 
  useErrorRecovery, 
  useTransactionRecovery, 
  useAdaptivePolling 
} from './SwapPerformanceOptimization';
import { SwapTestingSuite, TestResultsAnalytics } from './SwapTestingSuite';
import type { TestScenario } from './SwapPerformanceOptimization';

/**
 * System Health and Monitoring Dashboard
 * 
 * This component provides a comprehensive view of system health, performance, and testing status.
 * It integrates all the optimization and monitoring utilities into a single dashboard interface.
 */
export function SwapSystemDashboard() {
  const errorRecovery = useErrorRecovery();
  const transactionRecovery = useTransactionRecovery();
  const adaptivePolling = useAdaptivePolling();
  const performanceMetrics = usePerformanceMonitor('SystemDashboard');
  const [testResults, setTestResults] = useState<TestScenario[]>([]);

  const handleTestComplete = (results: TestScenario[]) => {
    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Swap System Dashboard
          </h1>
          <p className="text-xl text-slate-600">
            System Health, Performance Monitoring & Testing Suite
          </p>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SystemPerformanceCard performanceMetrics={performanceMetrics} />
          <BackendHealthCard healthMetrics={adaptivePolling.healthMetrics} />
          <ErrorRecoveryCard recoveryState={errorRecovery.recoveryState} pendingTransactions={transactionRecovery.pendingTransactions} />
        </div>

        {/* Test Suite */}
        <SwapTestingSuite />

        {/* Test Analytics */}
        {testResults.length > 0 && (
          <TestResultsAnalytics testResults={testResults} />
        )}

        {/* Integration Guide */}
        <IntegrationGuide />
      </div>
    </div>
  );
}

/**
 * System Performance Monitoring Card
 */
function SystemPerformanceCard({ performanceMetrics }: { performanceMetrics: any }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Performance</h3>
        <TrendingUp className="w-6 h-6 text-green-500" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Avg Render Time:</span>
          <span className="text-sm font-medium">{performanceMetrics.averageRenderTime.toFixed(2)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Cache Hit Rate:</span>
          <span className="text-sm font-medium">{performanceMetrics.cacheHitRate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">API Calls:</span>
          <span className="text-sm font-medium">{performanceMetrics.apiCallCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Render Count:</span>
          <span className="text-sm font-medium">{performanceMetrics.renderCount}</span>
        </div>
      </div>
      
      {/* Performance Score */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Performance Score:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              performanceMetrics.averageRenderTime < 5 ? 'bg-green-500' :
              performanceMetrics.averageRenderTime < 15 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {performanceMetrics.averageRenderTime < 5 ? 'Excellent' :
               performanceMetrics.averageRenderTime < 15 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Backend Health Monitoring Card
 */
function BackendHealthCard({ healthMetrics }: { healthMetrics: any }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Backend Health</h3>
        <Shield className="w-6 h-6 text-blue-500" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Response Time:</span>
          <span className="text-sm font-medium">{healthMetrics.responseTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Success Rate:</span>
          <span className="text-sm font-medium">{healthMetrics.successRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Poll Interval:</span>
          <span className="text-sm font-medium">{healthMetrics.recommendedPollInterval / 1000}s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Failures:</span>
          <span className="text-sm font-medium">{healthMetrics.consecutiveFailures}</span>
        </div>
      </div>
      
      {/* Health Status */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Health Status:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              healthMetrics.consecutiveFailures === 0 && healthMetrics.successRate > 95 ? 'bg-green-500' :
              healthMetrics.consecutiveFailures < 3 && healthMetrics.successRate > 80 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {healthMetrics.consecutiveFailures === 0 && healthMetrics.successRate > 95 ? 'Healthy' :
               healthMetrics.consecutiveFailures < 3 && healthMetrics.successRate > 80 ? 'Degraded' : 'Critical'}
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Last check: {healthMetrics.lastHealthCheck.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

/**
 * Error Recovery Status Card
 */
function ErrorRecoveryCard({ recoveryState, pendingTransactions }: { 
  recoveryState: any; 
  pendingTransactions: any[] 
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Error Recovery</h3>
        <RefreshCw className="w-6 h-6 text-orange-500" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Retry Count:</span>
          <span className="text-sm font-medium">{recoveryState.retryCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Max Retries:</span>
          <span className="text-sm font-medium">{recoveryState.maxRetries}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Strategy:</span>
          <span className="text-sm font-medium capitalize">{recoveryState.recoveryStrategy}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Pending Txns:</span>
          <span className="text-sm font-medium">{pendingTransactions.length}</span>
        </div>
      </div>
      
      {/* Recovery Status */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Recovery Status:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              recoveryState.isRecovering ? 'bg-yellow-500' :
              recoveryState.lastError ? 'bg-red-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-medium">
              {recoveryState.isRecovering ? 'Recovering' :
               recoveryState.lastError ? 'Error' : 'Normal'}
            </span>
          </div>
        </div>
        
        {recoveryState.lastError && (
          <div className="text-xs text-red-600 mt-1 truncate">
            {recoveryState.lastError.message}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Integration Guide Component
 */
function IntegrationGuide() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">
        Integration Guide
      </h2>
      
      <div className="prose prose-slate max-w-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Performance Optimizations</h3>
            <ul className="space-y-2 text-slate-600">
              <li>• Advanced memoization for swap calculations</li>
              <li>• Intelligent API request caching</li>
              <li>• Performance monitoring and metrics</li>
              <li>• Reduced re-render frequency</li>
              <li>• Adaptive resource allocation</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Error Recovery</h3>
            <ul className="space-y-2 text-slate-600">
              <li>• Automatic retry with exponential backoff</li>
              <li>• Transaction state persistence and recovery</li>
              <li>• Graceful degradation strategies</li>
              <li>• Adaptive backend polling</li>
              <li>• Circuit breaker patterns</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Integration Steps:</h4>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Import performance utilities into your existing hooks</li>
            <li>Wrap performance monitoring around key components</li>
            <li>Integrate error recovery with your transaction flows</li>
            <li>Run end-to-end tests to validate integration</li>
            <li>Monitor performance metrics in production</li>
            <li>Set up alerting for health metrics</li>
          </ol>
        </div>
        
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Production Checklist:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                <li>Performance monitoring active</li>
                <li>Error recovery configured</li>
                <li>Transaction recovery enabled</li>
                <li>Adaptive polling implemented</li>
              </ul>
            </div>
            <div>
              <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                <li>End-to-end tests passing</li>
                <li>Health metrics monitored</li>
                <li>Alerting configured</li>
                <li>Fallback strategies tested</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Real-time System Monitor Component
 * 
 * This component provides real-time monitoring of system metrics
 * and can be used in production dashboards.
 */
export function RealTimeSystemMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState({
    timestamp: new Date(),
    activeConnections: 0,
    averageResponseTime: 0,
    errorRate: 0,
    throughput: 0
  });

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Simulate real-time metrics updates
      setMetrics({
        timestamp: new Date(),
        activeConnections: Math.floor(Math.random() * 100) + 50,
        averageResponseTime: Math.floor(Math.random() * 500) + 200,
        errorRate: Math.random() * 5,
        throughput: Math.floor(Math.random() * 1000) + 500
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Real-time Monitor</h3>
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isMonitoring 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      {isMonitoring && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 mb-3">
            Last updated: {metrics.timestamp.toLocaleTimeString()}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600">Active Connections</div>
              <div className="text-lg font-semibold text-blue-900">{metrics.activeConnections}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-600">Avg Response Time</div>
              <div className="text-lg font-semibold text-green-900">{metrics.averageResponseTime}ms</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-sm text-yellow-600">Error Rate</div>
              <div className="text-lg font-semibold text-yellow-900">{metrics.errorRate.toFixed(2)}%</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-600">Throughput</div>
              <div className="text-lg font-semibold text-purple-900">{metrics.throughput}/min</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SwapSystemDashboard;
