// Dashboard page for PDF to QuickBooks application - Main interface with account management and usage tracking
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { FileText, LogOut, User, CreditCard, BarChart3, Plus, Building2, AlertTriangle, Calendar, History } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchProfile()
    fetchAccounts()
  }, [user, router])

  useEffect(() => {
    if (selectedAccount) {
      fetchBatches(selectedAccount)
    }
  }, [selectedAccount])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching accounts:', error)
        toast({
          title: "Error",
          description: "Failed to load client accounts",
          variant: "destructive"
        })
      } else {
        setAccounts(data || [])
        // Auto-select first account if available
        if (data && data.length > 0 && !selectedAccount) {
          setSelectedAccount(data[0].id)
        }
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "Error",
        description: "Failed to load client accounts",
        variant: "destructive"
      })
    }
  }

  const fetchBatches = async (accountId: string) => {
    if (!accountId) return

    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('account_id', accountId)
        .order('processed_at', { ascending: false })

      if (error) {
        console.error('Error fetching batches:', error)
        toast({
          title: "Error",
          description: "Failed to load batch history",
          variant: "destructive"
        })
      } else {
        setBatches(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "Error",
        description: "Failed to load batch history",
        variant: "destructive"
      })
    }
  }

  const createAccount = async () => {
    if (!user || !newAccountName.trim()) return

    setCreatingAccount(true)
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: newAccountName.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating account:', error)
        toast({
          title: "Error",
          description: "Failed to create client account",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Client account created successfully"
        })
        setNewAccountName('')
        setCreateAccountOpen(false)
        fetchAccounts() // Refresh accounts list
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "Error",
        description: "Failed to create client account",
        variant: "destructive"
      })
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-gray-900">PDF to QuickBooks</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-700 hover:text-purple-600 hover:bg-purple-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your receipt processing and subscription</p>
        </div>

        {/* Usage Tracking Display */}
        <div className="mb-8">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Usage Tracking
              </CardTitle>
              <CardDescription>
                Monitor your monthly page processing limit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {profile ? `${profile.monthly_usage} / 1,500` : 'Loading...'}
                    </div>
                    <p className="text-sm text-gray-500">Pages processed this month</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      profile && (profile.monthly_usage / 1500) >= 0.9 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {profile ? `${Math.round((profile.monthly_usage / 1500) * 100)}%` : '0%'}
                    </div>
                    <p className="text-sm text-gray-500">of monthly limit</p>
                  </div>
                </div>
                
                <Progress 
                  value={profile ? (profile.monthly_usage / 1500) * 100 : 0} 
                  className="h-3"
                />
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Resets: {profile?.usage_reset_date ? new Date(profile.usage_reset_date).toLocaleDateString() : 'Loading...'}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    profile?.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium capitalize">
                      {profile ? profile.subscription_status : 'Loading...'}
                    </span>
                  </div>
                </div>

                {/* Warning notification at 90% usage */}
                {profile && (profile.monthly_usage / 1500) >= 0.9 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      You're approaching your monthly limit. Consider upgrading your plan for more processing capacity.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Management System */}
        <div className="mb-8">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Client Account Management
              </CardTitle>
              <CardDescription>
                Organize your work by client organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="account-select" className="text-sm font-medium text-gray-700">
                      Select Client Account
                    </Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a client account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
                    <DialogTrigger asChild>
                      <Button className="mt-6">
                        <Plus className="h-4 w-4 mr-2" />
                        New Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Client Account</DialogTitle>
                        <DialogDescription>
                          Add a new client organization to organize your receipt processing work.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="account-name">Account Name</Label>
                          <Input
                            id="account-name"
                            placeholder="e.g., Restaurant ABC, Office Client XYZ"
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            maxLength={100}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {newAccountName.length}/100 characters
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setCreateAccountOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createAccount}
                          disabled={!newAccountName.trim() || creatingAccount}
                        >
                          {creatingAccount ? 'Creating...' : 'Create Account'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {accounts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No client accounts yet</p>
                    <p className="text-sm">Create your first client account to start organizing your receipt processing work.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Batch History */}
        {selectedAccount && (
          <div className="mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-600" />
                  Processing History
                </CardTitle>
                <CardDescription>
                  View past batch processing sessions for {accounts.find(acc => acc.id === selectedAccount)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No processing history</p>
                    <p className="text-sm">Start processing receipts to see your batch history here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {batches.map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {batch.file_count} file{batch.file_count !== 1 ? 's' : ''} processed
                            </p>
                            <p className="text-sm text-gray-500">
                              {batch.total_pages} pages • {batch.csv_format} format
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(batch.processed_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(batch.processed_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Action Card */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Start Processing Receipts</CardTitle>
            <CardDescription>
              {selectedAccount 
                ? `Upload PDF receipts for ${accounts.find(acc => acc.id === selectedAccount)?.name} and convert them to QuickBooks-ready CSV files`
                : 'Select a client account above to start processing receipts'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="h-12 w-12" />
              </div>
              {selectedAccount ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Ready to Process Receipts
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Upload up to 10 PDF receipts at once, review the extracted data, 
                    and download QuickBooks-ready CSV files for {accounts.find(acc => acc.id === selectedAccount)?.name}.
                  </p>
                  <Button 
                    disabled
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-8 py-3"
                  >
                    Upload PDF Receipts (Coming Soon)
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Select a Client Account
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Choose a client account from the dropdown above to start processing receipts. 
                    If you don't have any accounts yet, create your first one to get started.
                  </p>
                  <Button 
                    disabled
                    className="bg-gray-400 text-white font-semibold px-8 py-3 cursor-not-allowed"
                  >
                    Select Account First
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
