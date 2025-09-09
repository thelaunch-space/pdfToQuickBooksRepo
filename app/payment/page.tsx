// Payment page for PDF to QuickBooks application - placeholder for future payment integration
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Check, CreditCard, Shield, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

export default function PaymentPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) {
      return
    }

    if (!user) {
      router.push('/login')
    }
  }, [user, router, authLoading])

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // TODO: Integrate with actual payment provider (Stripe, Razorpay, etc.)
      // For now, simulate payment success
      
      // Update subscription status in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) {
        setError('Failed to update subscription status')
        return
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Payment processing failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user || authLoading) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">PDF to QuickBooks</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
          <p className="text-gray-600">Start saving 4.5+ hours weekly with automated receipt processing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span>Monthly Plan</span>
              </CardTitle>
              <CardDescription>Perfect for regular bookkeeping work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-4">$9<span className="text-lg text-gray-500">/month</span></div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>1,500 pages per month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Up to 10 files per batch</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>QuickBooks-ready CSV export</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Edit and review extracted data</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Email support</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>What You Get</span>
              </CardTitle>
              <CardDescription>Value proposition for bookkeepers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-semibold text-gray-900">4.5+ Hours Saved</div>
                    <div className="text-sm text-gray-600">Per week per bookkeeper</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="font-semibold text-gray-900">$250+ Recovered</div>
                    <div className="text-sm text-gray-600">Weekly billable time @$55/hr</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-semibold text-gray-900">QuickBooks Ready</div>
                    <div className="text-sm text-gray-600">Direct CSV import</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              Secure payment processing - your data is protected with bank-level security
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-600 text-lg">⚠️</div>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Payment Integration Pending</h4>
                  <p className="text-sm text-yellow-700">
                    This is a placeholder payment page. Payment provider integration (Stripe, Razorpay, etc.) will be added soon.
                    For now, clicking "Complete Payment" will simulate a successful payment and activate your subscription.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePayment}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Processing Payment...' : 'Complete Payment - $9/month'}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By completing payment, you agree to our Terms of Service and Privacy Policy.
              You can cancel your subscription at any time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
