// Processing History page for PDF to QuickBooks application - Dedicated page for viewing and managing batch history
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, LogOut, Building2, History, Download, Eye, Pencil, Calendar, Clock, AlertTriangle, ArrowLeft, Filter, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import Logo from '@/components/logo'

interface Batch {
  id: string
  file_count: number
  total_pages: number
  csv_format: string
  status: string
  processed_at: string
  last_edited_at?: string
  last_downloaded_at?: string
  edit_count?: number
  download_count?: number
  accounts: {
    name: string
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<any[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalBatches, setTotalBatches] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const batchesPerPage = 20
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

    fetchAccounts()
  }, [user, router, authLoading])

  useEffect(() => {
    if (selectedAccount) {
      setCurrentPage(1)
      fetchBatches(selectedAccount, 1, statusFilter)
    }
  }, [selectedAccount, statusFilter])

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
        setLoading(false)
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "Error",
        description: "Failed to load client accounts",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  const fetchBatches = async (accountId: string, page: number = 1, status: string = 'all') => {
    try {
      const from = (page - 1) * batchesPerPage
      const to = from + batchesPerPage - 1

      // First, get user's account IDs to ensure we only query their batches
      const { data: userAccounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user?.id)


      if (accountsError) {
        console.error('Error fetching user accounts:', accountsError)
        return
      }

      const userAccountIds = userAccounts?.map(acc => acc.id) || []
      if (userAccountIds.length === 0) {
        setBatches([])
        setTotalBatches(0)
        return
      }

      // Build query with proper user filtering using account IDs
      let query = supabase
        .from('batches')
        .select(`
          id,
          file_count,
          total_pages,
          csv_format,
          status,
          processed_at,
          last_edited_at,
          last_downloaded_at,
          edit_count,
          download_count,
          account_id,
          accounts!inner(name)
        `, { count: 'exact' })
        .in('account_id', userAccountIds) // Filter by user's account IDs

      // Filter by specific account
      if (accountId !== 'all') {
        query = query.eq('account_id', accountId)
      }

      // Filter by status
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      // Get total count
      const { count, error: countError } = await query

      if (countError) {
        console.error('Error fetching batch count:', countError)
        return
      }

      setTotalBatches(count || 0)

      // Get paginated results
      const { data, error } = await query
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
        // Transform the data to handle the accounts array properly
        const transformedBatches = (data || []).map((batch: any) => ({
          ...batch,
          accounts: Array.isArray(batch.accounts) ? batch.accounts[0] : batch.accounts
        }))
        setBatches(transformedBatches)
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

      // Update download tracking
      await updateBatchAction(batchId, 'download')

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

  const updateBatchAction = async (batchId: string, action: 'edit' | 'download') => {
    try {
      const updateField = action === 'edit' ? 'last_edited_at' : 'last_downloaded_at'
      const countField = action === 'edit' ? 'edit_count' : 'download_count'

      const { error } = await supabase
        .from('batches')
        .update({
          [updateField]: new Date().toISOString(),
        })
        .eq('id', batchId)

      if (error) {
        console.error(`Error updating ${action} tracking:`, error)
      }
    } catch (err) {
      console.error(`Error updating ${action} tracking:`, err)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setTimeout(() => {
        router.push('/')
      }, 100)
    } catch (error) {
      console.error('Sign out error:', error)
      router.push('/')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      processing: 'bg-amber-100 text-amber-700 border-amber-200',
      failed: 'bg-red-100 text-red-700 border-red-200'
    }
    
    return (
      <Badge className={`${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-700 border-gray-200'} border`}>
        {status}
      </Badge>
    )
  }

  const getContextualBatchName = (batch: any) => {
    const accountName = batch.accounts?.name || 'Unknown Account'
    const processedDate = new Date(batch.processed_at)
    const dateStr = processedDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
    const timeStr = processedDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    const fileCount = batch.file_count
    
    return `${accountName} - ${dateStr} - ${fileCount} file${fileCount !== 1 ? 's' : ''}`
  }

  if (!user || loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading processing history...</p>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="px-3 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50/80 transition-all duration-200"
                >
                  Dashboard
                </Button>
                <div className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm">
                  Processing History
                </div>
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-slate-600 hover:text-purple-600 hover:bg-purple-50/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Processing History</h1>
          <p className="text-slate-600 mt-2">View and manage all your batch processing history across all client accounts.</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Client Account</label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {batches.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No processing history found</h3>
              <p className="text-slate-600 mb-6">
                {selectedAccount === 'all' 
                  ? "You haven't processed any batches yet. Start by uploading some PDF receipts."
                  : "No batches found for the selected account and filters."
                }
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                Start Processing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => {
              const processedDate = formatDate(batch.processed_at)
              const hasBeenEdited = batch.last_edited_at
              const hasBeenDownloaded = batch.last_downloaded_at
              
              return (
                <Card key={batch.id} className="group border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/25">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {getContextualBatchName(batch)}
                            </h3>
                            {getStatusBadge(batch.status)}
                          </div>
                          <div className="text-sm text-slate-500 mb-2">
                            {batch.total_pages} pages • {batch.csv_format} format
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              <span>{batch.accounts.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{processedDate.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{processedDate.time}</span>
                            </div>
                            {hasBeenEdited && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Pencil className="h-4 w-4" />
                                <span className="text-xs font-medium">Edited</span>
                              </div>
                            )}
                            {hasBeenDownloaded && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Reviewed</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {hasBeenEdited && (
                              <div className="flex items-center gap-1">
                                <Pencil className="h-3 w-3" />
                                <span>Edited {batch.edit_count} time{batch.edit_count !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {hasBeenDownloaded && (
                              <div className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                <span>Downloaded {batch.download_count} time{batch.download_count !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {batch.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCSV(batch.id)}
                              className="bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download CSV
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                updateBatchAction(batch.id, 'edit')
                                router.push(`/review/${batch.id}`)
                              }}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Data
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/review/${batch.id}`)}
                          className="bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300"
                        >
                          {batch.status === 'completed' ? (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View Data
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              View Progress
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalBatches > batchesPerPage && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1))
                  fetchBatches(selectedAccount, Math.max(1, currentPage - 1), statusFilter)
                }}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600 px-4">
                Page {currentPage} of {Math.ceil(totalBatches / batchesPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(prev => prev + 1)
                  fetchBatches(selectedAccount, currentPage + 1, statusFilter)
                }}
                disabled={currentPage >= Math.ceil(totalBatches / batchesPerPage)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
