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
import { FileText, LogOut, User, CreditCard, BarChart3, Plus, Building2, AlertTriangle, Calendar, History, Download, Eye, Pencil } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import BatchProcessingWidget from '@/components/batch-processing-widget'
import Logo from '@/components/logo'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalBatches, setTotalBatches] = useState(0)
  const batchesPerPage = 10
  const { user, signOut, loading: authLoading } = useAuth()

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) {
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    fetchProfile()
    fetchAccounts()
  }, [user, router, authLoading])

  useEffect(() => {
    if (selectedAccount) {
      setCurrentPage(1)
      fetchBatches(selectedAccount, 1)
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

  const fetchBatches = async (accountId: string, page: number = 1) => {
    if (!accountId) return

    try {
      const from = (page - 1) * batchesPerPage
      const to = from + batchesPerPage - 1

      // Verify the account belongs to the current user
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', user?.id)
        .single()

      if (accountError || !account) {
        console.error('Error: Account not found or access denied:', accountError)
        setBatches([])
        setTotalBatches(0)
        return
      }

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('batches')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)

      if (countError) {
        console.error('Error fetching batch count:', countError)
        return
      }

      setTotalBatches(count || 0)

      // Get paginated batches
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('account_id', accountId)
        .order('processed_at', { ascending: false })
        .range(from, to)

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

  const handleDownloadCSV = async (batchId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      const response = await fetch(`/api/batches/${batchId}/export-csv`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export CSV')
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `QuickBooks_Export_${new Date().toISOString().split('T')[0]}.csv`

      // Create blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "CSV file downloaded successfully",
      })
    } catch (error) {
      console.error('Error downloading CSV:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download CSV",
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
    try {
      await signOut()
      // Small delay to ensure auth state is fully cleared
      setTimeout(() => {
        router.push('/')
      }, 100)
    } catch (error) {
      console.error('Sign out error:', error)
      // Still redirect even if there's an error
      router.push('/')
    }
  }

  if (!user || loading || authLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header */}
      <header className="header-dashboard">
        <div className="header-container">
          <div className="header-content">
            <div className="flex items-center space-x-6">
              <Logo size="md" />
              <nav className="hidden md:flex items-center space-x-1">
                <div className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm">
                  Dashboard
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/history')}
                  className="px-3 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50/80 transition-all duration-200"
                >
                  Processing History
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-slate-600 hidden sm:block font-medium">
                {user.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-600 hover:text-purple-600 hover:bg-purple-50/80 h-8 px-3 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline font-medium">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Compact Cards Stacked Vertically */}
          <div className="space-y-6">
            {/* Usage Tracking - Compact */}
            <Card className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/25">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Usage</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                    <CreditCard className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Free</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">
                      {profile ? profile.monthly_usage : '0'}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">/ 1,500 pages</span>
                  </div>
                  <div className="space-y-1">
                    <Progress 
                      value={profile ? (profile.monthly_usage / 1500) * 100 : 0} 
                      className="h-1.5 bg-slate-100"
                    />
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>{profile ? `${Math.round((profile.monthly_usage / 1500) * 100)}%` : '0%'}</span>
                      <span>Resets {profile?.usage_reset_date ? new Date(profile.usage_reset_date).toLocaleDateString() : 'Loading...'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Selection - Compact */}
            <Card className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/25">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Client Account</span>
                </div>
                <div className="space-y-3">
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 hover:bg-slate-50 transition-colors duration-200">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full h-9 bg-white/50 hover:bg-white border-slate-200 hover:border-slate-300 transition-all duration-200">
                        <Plus className="h-3 w-3 mr-2" />
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
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Batch Processing Widget (Wider) */}
          <div className="lg:col-span-2">
            {/* Warning notification at 90% usage */}
            {profile && (profile.monthly_usage / 1500) >= 0.9 && (
              <Alert className="border-orange-200 bg-orange-50 mb-6">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  You're approaching your monthly limit. Consider upgrading your plan for more processing capacity.
                </AlertDescription>
              </Alert>
            )}

            {selectedAccount ? (
              <div id="batch-processing-widget" className="transform transition-all duration-300 hover:scale-[1.01]">
                <BatchProcessingWidget
                  selectedAccountId={selectedAccount}
                  selectedAccountName={accounts.find(acc => acc.id === selectedAccount)?.name || ''}
                  userProfile={profile}
                  onBatchComplete={() => {
                    fetchBatches(selectedAccount)
                    fetchProfile() // Refresh usage tracking
                  }}
                />
              </div>
            ) : (
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 via-white to-purple-50/50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative text-center pb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/25 group-hover:shadow-3xl group-hover:shadow-purple-500/30 transition-all duration-500">
                    <FileText className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Start Processing Receipts</CardTitle>
                  <CardDescription className="text-slate-600 text-lg font-medium mt-2">
                    Select a client account above to begin processing your PDF receipts
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative text-center">
                  <div className="space-y-6">
                    <div className="text-sm text-slate-500 space-y-2 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <p>Upload up to 10 PDF receipts at once</p>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <p>Automatic data extraction with AI</p>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <p>Export to QuickBooks format</p>
                      </div>
                    </div>
                    <Button 
                      disabled
                      className="bg-slate-200 text-slate-400 font-semibold px-8 py-3 cursor-not-allowed rounded-xl"
                    >
                      Select Account First
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
