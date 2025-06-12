import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

interface ProfileForm {
  firstName: string
  lastName: string
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    }
  })

  const { data: activities } = useQuery({
    queryKey: ['user-activities'],
    queryFn: async () => {
      const response = await axios.get('/users/activities?limit=10')
      return response.data.data
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await axios.put('/users/profile', data)
      return response.data.data
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    },
  })

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data)
  }

  const tabs = [
    { id: 'profile', name: 'Profile' },
    { id: 'activity', name: 'Activity Log' },
    { id: 'billing', name: 'Billing' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  type="text"
                  className="input-field"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  type="text"
                  className="input-field"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            {user?.company && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={user.company.name}
                  disabled
                  className="input-field bg-gray-50 text-gray-500"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities && activities.length > 0 ? (
              activities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3 py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Billing information is managed through Stripe. You can update your payment methods
                and billing details in your subscription settings.
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Current Subscriptions</h4>
              {user?.subscriptions && user.subscriptions.length > 0 ? (
                <div className="space-y-2">
                  {user.subscriptions.map((subscription: any) => (
                    <div key={subscription.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{subscription.plan?.name}</p>
                        <p className="text-sm text-gray-500">Status: {subscription.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(subscription.plan?.amount / 100).toFixed(2)}/{subscription.plan?.interval}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active subscriptions</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
