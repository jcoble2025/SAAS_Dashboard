import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { CheckIcon } from '@heroicons/react/24/outline'

interface Plan {
  id: string
  name: string
  amount: number
  currency: string
  interval: string
  features: string[]
  isActive: boolean
}

export default function Plans() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await axios.get('/plans')
      return response.data.data as Plan[]
    },
  })

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <p className="text-gray-600">Available subscription plans</p>
      </div>

      {!plans || plans.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No plans available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no subscription plans configured yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="card relative">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(plan.amount, plan.currency)}
                  </span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
              </div>

              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className="w-full btn-primary"
                onClick={() => {
                  // This would typically open a subscription creation flow
                  alert('Subscription creation would be implemented here with Stripe Elements')
                }}
              >
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
