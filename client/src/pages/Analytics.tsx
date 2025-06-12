import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d')

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await axios.get(`/analytics/dashboard?timeRange=${timeRange}`)
      return response.data.data
    },
  })

  const { data: customerAnalytics } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: async () => {
      const response = await axios.get('/analytics/customers')
      return response.data.data
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Revenue trend chart
  const revenueChartData = {
    labels: analytics?.charts?.revenueTrend?.map((item: any) => 
      new Date(item.date).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: 'Revenue',
        data: analytics?.charts?.revenueTrend?.map((item: any) => item.revenue / 100) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  }

  // Customer growth chart
  const customerGrowthData = {
    labels: customerAnalytics?.customerGrowth?.map((item: any) => 
      new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'New Customers',
        data: customerAnalytics?.customerGrowth?.map((item: any) => item.new_customers) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  }

  // Customer segments chart
  const segmentsData = {
    labels: customerAnalytics?.segments?.map((item: any) => item.segment) || [],
    datasets: [
      {
        data: customerAnalytics?.segments?.map((item: any) => item.customer_count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  }

  const kpiCards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(analytics?.overview?.totalRevenue || 0),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Active Subscriptions',
      value: analytics?.overview?.activeSubscriptions || 0,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Monthly Recurring Revenue',
      value: formatCurrency(analytics?.overview?.mrr || 0),
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Churn Rate',
      value: `${analytics?.overview?.churnRate || 0}%`,
      icon: ChartBarIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights into your business performance</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input-field w-auto"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => (
          <div key={kpi.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{kpi.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64">
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Customer Growth */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Growth</h3>
          <div className="h-64">
            {customerAnalytics?.customerGrowth?.length > 0 ? (
              <Bar
                data={customerGrowthData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No customer growth data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Segments */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Segments</h3>
          <div className="h-64">
            {customerAnalytics?.segments?.length > 0 ? (
              <Doughnut
                data={segmentsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No segment data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {customerAnalytics?.topCustomers?.slice(0, 5).map((customer: any) => (
              <div key={customer.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(customer.total_spent || 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {customer.payment_count} payments
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No customer data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Status Distribution */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Status Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {analytics?.charts?.subscriptionsByStatus?.map((status: any) => (
            <div key={status.status} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{status._count.status}</div>
              <div className="text-sm text-gray-500 capitalize">{status.status.toLowerCase()}</div>
            </div>
          )) || (
            <div className="col-span-4 text-center text-gray-500 py-8">
              No subscription data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
