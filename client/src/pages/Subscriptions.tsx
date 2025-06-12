import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline'

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  plan: {
    name: string
    amount: number
    currency: string
    interval: string
    features: string[]
  }
}

export default function Subscriptions() {
  const queryClient = useQueryClient()

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await axios.get('/subscriptions')
      return response.data.data as Subscription[]
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await axios.post(`/subscriptions/${subscriptionId}/cancel`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Subscription canceled successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel subscription')
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await axios.post(`/subscriptions/${subscriptionId}/reactivate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Subscription reactivated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reactivate subscription')
    },
  })

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'CANCELED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'TRIALING':
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'CANCELED':
        return 'bg-red-100 text-red-800'
      case 'TRIALING':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600">Manage your active subscriptions</p>
        </div>
      </div>

      {!subscriptions || subscriptions.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any active subscriptions yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(subscription.status)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {subscription.plan.name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                      {subscription.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(subscription.plan.amount, subscription.plan.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    per {subscription.plan.interval}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Current Period</p>
                  <p className="text-sm font-medium">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Billing</p>
                  <p className="text-sm font-medium">
                    {subscription.cancelAtPeriodEnd 
                      ? 'Canceled at period end' 
                      : new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    }
                  </p>
                </div>
              </div>

              {subscription.plan.features && subscription.plan.features.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Features</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {subscription.plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-3">
                {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={() => cancelMutation.mutate(subscription.id)}
                    disabled={cancelMutation.isPending}
                    className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {cancelMutation.isPending ? 'Canceling...' : 'Cancel Subscription'}
                  </button>
                )}
                
                {subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={() => reactivateMutation.mutate(subscription.id)}
                    disabled={reactivateMutation.isPending}
                    className="btn-primary"
                  >
                    {reactivateMutation.isPending ? 'Reactivating...' : 'Reactivate Subscription'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
