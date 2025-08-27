import React, { useState, useCallback } from 'react';
import { TrendingUp, Activity, AlertTriangle, Clock, DollarSign, Shield, CheckCircle2, Target } from 'lucide-react';
import { 
  useSwapAnalytics, 
  useSecurityHardening,
  type SwapAnalytics 
} from './SwapEnterpriseFeatures';

/**
 * Comprehensive Analytics Dashboard Component
 * 
 * This component provides a comprehensive view of system performance, user
 * behavior, and platform health. It's designed to help platform operators
 * understand how their system is performing and identify optimization opportunities.
 */
export function SwapAnalyticsDashboard() {
  const { analytics, realTimeMetrics, trackSwapEvent } = useSwapAnalytics();
  const security = useSecurityHardening();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  /**
   * Simulate some analytics data for demonstration
   */
  const simulateAnalyticsEvent = useCallback((type: 'success' | 'failure') => {
    if (type === 'success') {
      trackSwapEvent({
        type: 'completed',
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: (Math.random() * 5).toFixed(4),
        priceImpact: Math.random() * 2,
        executionTime: 2000 + Math.random() * 3000,
        gasUsed: BigInt(Math.floor(150000 + Math.random() * 50000)),
        mevSavings: BigInt(Math.floor(Math.random() * 1000000000000000))
      });
    } else {
      trackSwapEvent({
        type: 'failed',
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: (Math.random() * 5).toFixed(4),
        errorCategory: ['insufficient_liquidity', 'signature_timeout', 'gas_estimation'][Math.floor(Math.random() * 3)]
      });
    }
  }, [trackSwapEvent]);

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Swap Analytics Dashboard</h2>
          <p className="text-slate-600 mt-1">Enterprise-grade monitoring and performance insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={() => simulateAnalyticsEvent('success')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Simulate Success
          </button>
          
          <button
            onClick={() => simulateAnalyticsEvent('failure')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Simulate Failure
          </button>
        </div>
      </div>

      {/* Real-Time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Success Rate"
          value={`${analytics.successRate.toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
          status={analytics.successRate > 95 ? 'Excellent' : 
                  analytics.successRate > 90 ? 'Good' : 
                  analytics.successRate > 80 ? 'Fair' : 'Needs Attention'}
          color="green"
        />

        <MetricCard
          title="Avg Execution Time"
          value={`${(analytics.averageExecutionTime / 1000).toFixed(1)}s`}
          icon={<Clock className="w-6 h-6 text-blue-500" />}
          status={analytics.averageExecutionTime < 3000 ? 'Fast' : 
                  analytics.averageExecutionTime < 5000 ? 'Normal' : 'Slow'}
          color="blue"
        />

        <MetricCard
          title="Backend Latency"
          value={`${realTimeMetrics.backendLatency}ms`}
          icon={<Activity className="w-6 h-6 text-orange-500" />}
          status={realTimeMetrics.backendLatency < 500 ? 'Excellent' : 
                  realTimeMetrics.backendLatency < 1000 ? 'Good' : 'High'}
          color="orange"
        />

        <MetricCard
          title="Error Rate"
          value={`${realTimeMetrics.errorRate.toFixed(1)}%`}
          icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
          status={realTimeMetrics.errorRate < 2 ? 'Excellent' : 
                  realTimeMetrics.errorRate < 5 ? 'Good' : 'High'}
          color="red"
        />
      </div>

      {/* Advanced Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PriceImpactDistribution analytics={analytics} />
        <ErrorCategoriesPanel analytics={analytics} />
      </div>

      {/* Security Metrics */}
      <SecurityMetricsPanel securityMetrics={security.securityMetrics} />

      {/* Platform Performance Summary */}
      <PlatformPerformanceSummary analytics={analytics} />
    </div>
  );
}

/**
 * Reusable Metric Card Component
 */
function MetricCard({ title, value, icon, status, color }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  status: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {icon}
      </div>
      <div className={`text-3xl font-bold text-${color}-600`}>
        {value}
      </div>
      <div className="text-sm text-slate-500 mt-1">
        {status}
      </div>
    </div>
  );
}

/**
 * Price Impact Distribution Component
 */
function PriceImpactDistribution({ analytics }: { analytics: SwapAnalytics }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-6">Price Impact Distribution</h3>
      <div className="space-y-4">
        {[
          { label: 'Minimal (<0.5%)', value: analytics.priceImpactDistribution[0], color: 'bg-green-500' },
          { label: 'Low (0.5-1%)', value: analytics.priceImpactDistribution[1], color: 'bg-blue-500' },
          { label: 'Moderate (1-2%)', value: analytics.priceImpactDistribution[2], color: 'bg-yellow-500' },
          { label: 'High (2-5%)', value: analytics.priceImpactDistribution[3], color: 'bg-orange-500' },
          { label: 'Extreme (>5%)', value: analytics.priceImpactDistribution[4], color: 'bg-red-500' }
        ].map((item, index) => {
          const total = analytics.priceImpactDistribution.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-sm text-slate-600">{item.label}</div>
              <div className="flex-1 bg-slate-200 rounded-full h-4">
                <div 
                  className={`${item.color} h-4 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-sm font-medium text-slate-900">
                {percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Error Categories Panel Component
 */
function ErrorCategoriesPanel({ analytics }: { analytics: SwapAnalytics }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-6">Error Categories</h3>
      <div className="space-y-4">
        {Object.entries(analytics.errorCategories).length > 0 ? (
          Object.entries(analytics.errorCategories).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="font-medium text-slate-900 capitalize">
                {category.replace(/_/g, ' ')}
              </span>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                {count}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>No errors recorded in this time period</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Security Metrics Panel Component
 */
function SecurityMetricsPanel({ securityMetrics }: { securityMetrics: any }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-6">Security & Validation Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {securityMetrics.totalValidations}
          </div>
          <div className="text-sm text-slate-600">Total Validations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {securityMetrics.rejectedRequests}
          </div>
          <div className="text-sm text-slate-600">Rejected Requests</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {securityMetrics.suspiciousActivity}
          </div>
          <div className="text-sm text-slate-600">Suspicious Activity</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {securityMetrics.totalValidations > 0 
              ? ((securityMetrics.totalValidations - securityMetrics.rejectedRequests) / securityMetrics.totalValidations * 100).toFixed(1)
              : 100}%
          </div>
          <div className="text-sm text-slate-600">Security Score</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Platform Performance Summary Component
 */
function PlatformPerformanceSummary({ analytics }: { analytics: SwapAnalytics }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
      <h3 className="text-2xl font-semibold text-slate-900 mb-6">Platform Performance Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">MEV Protection Savings</h4>
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            ${(Number(analytics.mevSavings) / 1e18 * 2000).toFixed(2)}
          </div>
          <div className="text-sm text-slate-600">Estimated savings from MEV protection</div>
        </div>
        
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">Gas Optimization</h4>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {(Number(analytics.gasOptimizationSavings) / 1e9).toFixed(1)} Gwei
          </div>
          <div className="text-sm text-slate-600">Total gas saved through optimization</div>
        </div>
        
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">Total Volume</h4>
            <DollarSign className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            ${(Number(analytics.totalVolume) / 1e18 * 2000).toFixed(0)}
          </div>
          <div className="text-sm text-slate-600">Total swap volume processed</div>
        </div>
      </div>
    </div>
  );
}

export default SwapAnalyticsDashboard;
