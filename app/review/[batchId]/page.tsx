// Review and edit page for batch extractions - dedicated page for better data review experience
"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Save, 
  Download,
  X,
  Loader2,
  FileText,
  ArrowLeft,
  Home,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface ExtractedData {
  date: string
  vendor: string
  amount: string
  description: string
  transaction_type?: 'income' | 'expense'
  classification_confidence?: number
  classification_reasoning?: string
}

interface Extraction {
  id: string
  filename: string
  extracted_data: ExtractedData
  confidence_score: number
  engine_used: string
  created_at: string
}

interface Batch {
  id: string
  status: string
  csv_format: string
  account_name: string
}

export default function ReviewEditPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const batchId = params.batchId as string

  const [batch, setBatch] = useState<Batch | null>(null)
  const [extractions, setExtractions] = useState<Extraction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ extractionId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [exporting, setExporting] = useState(false)
  const [isViewOnly, setIsViewOnly] = useState(false) // Start in edit mode by default

  // Fetch extractions when page loads
  const fetchExtractions = useCallback(async () => {
    if (!batchId || !user) return

    setLoading(true)
    setErrors({})
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      const response = await fetch(`/api/batches/${batchId}/extractions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setBatch(result.batch)
        setExtractions(result.extractions)
      } else {
        throw new Error(result.error || 'Failed to fetch extractions')
      }
    } catch (error) {
      console.error('Error fetching extractions:', error)
      setErrors({ fetch: error instanceof Error ? error.message : 'Failed to fetch extractions' })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch extractions',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [batchId, user])

  // Update extraction data
  const updateExtraction = useCallback(async (extractionId: string, field: string, value: string) => {
    setSaving(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      const response = await fetch(`/api/extractions/${extractionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ field, value })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // Update local state
        setExtractions(prev => prev.map(extraction => 
          extraction.id === extractionId 
            ? { ...extraction, extracted_data: { ...extraction.extracted_data, [field]: value } }
            : extraction
        ))
        
        // Clear any field-specific errors
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[`${extractionId}-${field}`]
          return newErrors
        })
        
        toast({
          title: "Saved",
          description: `${field} updated successfully`
        })
      } else {
        throw new Error(result.error || 'Failed to update extraction')
      }
    } catch (error) {
      console.error('Error updating extraction:', error)
      const errorKey = `${extractionId}-${field}`
      setErrors(prev => ({ ...prev, [errorKey]: error instanceof Error ? error.message : 'Update failed' }))
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update extraction',
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }, [])

  // Handle cell edit start
  const startEdit = (extractionId: string, field: string, currentValue: string) => {
    setEditingCell({ extractionId, field })
    setEditValue(currentValue)
  }

  // Handle cell edit save
  const saveEdit = async () => {
    if (!editingCell) return
    
    const { extractionId, field } = editingCell
    await updateExtraction(extractionId, field, editValue)
    setEditingCell(null)
    setEditValue('')
  }

  // Handle cell edit cancel
  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // Handle key press in edit mode
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  // Handle CSV export
  const handleExportCSV = async () => {
    if (!batchId || !user) return

    setExporting(true)
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
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Successful",
        description: `CSV file "${filename}" has been downloaded`
      })
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'Failed to export CSV',
        variant: "destructive"
      })
    } finally {
      setExporting(false)
    }
  }

  // Get confidence indicator
  const getConfidenceIndicator = (score: number) => {
    if (score >= 0.9) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else if (score >= 0.7) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    } else {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString || dateString === 'Unknown') return dateString
    return dateString
  }

  // Format amount for display
  const formatAmountForDisplay = (amount: string) => {
    if (!amount || amount === '0' || amount === 'Unknown') return amount
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    return num.toLocaleString()
  }

  // Get transaction type indicator
  const getTransactionTypeIndicator = (transactionType?: string, confidence?: number) => {
    // Default to expense if no type is specified (clean UX - no "failed" messages)
    const type = transactionType || 'expense'
    const isHighConfidence = (confidence || 0) >= 0.7
    
    if (type === 'income') {
      return (
        <Badge 
          variant="outline" 
          className={`text-green-700 border-green-200 ${isHighConfidence ? 'bg-green-50' : 'bg-yellow-50'}`}
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Income
        </Badge>
      )
    } else {
      return (
        <Badge 
          variant="outline" 
          className={`text-red-700 border-red-200 ${isHighConfidence ? 'bg-red-50' : 'bg-yellow-50'}`}
        >
          <TrendingDown className="h-3 w-3 mr-1" />
          Expense
        </Badge>
      )
    }
  }

  // Load data on mount
  useEffect(() => {
    if (user && batchId) {
      fetchExtractions()
    }
  }, [user, batchId, fetchExtractions])

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
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
              <div className="header-logo">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-lg font-semibold text-slate-900 tracking-tight">PDF to QuickBooks</span>
              </div>
              <nav className="hidden md:flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="text-slate-600 hover:text-purple-600 hover:bg-purple-50/80 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  Dashboard
                </Button>
                <div className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm">
                  {isViewOnly ? 'View Data' : 'Review & Edit'}
                </div>
              </nav>
              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={!isViewOnly ? "default" : "ghost"}
                  onClick={() => setIsViewOnly(false)}
                  className={`h-7 px-3 text-xs font-medium transition-all duration-200 ${
                    !isViewOnly 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant={isViewOnly ? "default" : "ghost"}
                  onClick={() => setIsViewOnly(true)}
                  className={`h-7 px-3 text-xs font-medium transition-all duration-200 ${
                    isViewOnly 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  View
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-purple-600 hover:bg-purple-50/80 h-8 px-3 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline font-medium">Back</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
              <p className="text-slate-600 font-medium">Loading extractions...</p>
            </div>
          </div>
        ) : errors.fetch ? (
          <Card className="border-red-200 bg-red-50/50 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
              <p className="text-red-700">{errors.fetch}</p>
            </CardContent>
          </Card>
        ) : extractions.length === 0 ? (
          <Card className="group relative overflow-hidden border-0 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Extractions Found</h3>
              <p className="text-slate-600">This batch doesn't contain any processed extractions.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Batch Summary Header */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-slate-200/60 shadow-lg shadow-slate-200/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Batch Summary</h2>
                  <p className="text-slate-600 font-medium">
                    {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()} • Account: {batch?.account_name} • {extractions.length} receipt{extractions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50/50 font-semibold">
                    {batch?.csv_format}
                  </Badge>
                  {isViewOnly && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 font-semibold">
                      View Only
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Data Table */}
            <Card className="group relative overflow-hidden border-0 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 tracking-tight">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center shadow-md shadow-slate-500/25">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      Extracted Data
                    </CardTitle>
                    <CardDescription className="text-slate-600 font-medium">
                      {isViewOnly ? 'View the extracted data below' : 'Review and edit the extracted data. Fields with low confidence are highlighted for your attention.'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/dashboard')}
                      className="border-slate-200 hover:border-slate-300 bg-white/50 hover:bg-white transition-all duration-200"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                      onClick={handleExportCSV}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {exporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative p-0">
                <div className="overflow-x-auto max-h-[70vh]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="w-12 bg-white">Confidence</TableHead>
                        <TableHead className="w-48 bg-white">Filename</TableHead>
                        <TableHead className="w-32 bg-white">Date</TableHead>
                        <TableHead className="w-48 bg-white">Vendor</TableHead>
                        <TableHead className="w-32 bg-white">Amount</TableHead>
                        <TableHead className="w-32 bg-white">Type</TableHead>
                        <TableHead className="bg-white">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractions.map((extraction) => (
                        <TableRow key={extraction.id}>
                          <TableCell>
                            {getConfidenceIndicator(extraction.confidence_score)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 truncate" title={extraction.filename}>
                              {extraction.filename}
                            </div>
                          </TableCell>
                          
                          {/* Date Field */}
                          <TableCell>
                            {editingCell?.extractionId === extraction.id && editingCell?.field === 'date' ? (
                              <div className="space-y-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  className="h-10 text-base border-2 border-purple-300 focus:border-purple-500"
                                  placeholder={batch?.csv_format === '4-column' ? 'DD/MM/YYYY' : 'MM/DD/YYYY'}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span className="ml-1">Save</span>
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    <X className="h-4 w-4" />
                                    <span className="ml-1">Cancel</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`p-2 rounded border border-transparent transition-colors ${
                                  isViewOnly 
                                    ? 'cursor-default bg-gray-50' 
                                    : 'cursor-pointer hover:bg-purple-50 hover:border-purple-200'
                                }`}
                                onClick={() => !isViewOnly && startEdit(extraction.id, 'date', extraction.extracted_data.date)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDateForDisplay(extraction.extracted_data.date)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {isViewOnly ? 'View only' : 'Click to edit'}
                                </div>
                              </div>
                            )}
                            {errors[`${extraction.id}-date`] && (
                              <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">{errors[`${extraction.id}-date`]}</div>
                            )}
                          </TableCell>

                          {/* Vendor Field */}
                          <TableCell>
                            {editingCell?.extractionId === extraction.id && editingCell?.field === 'vendor' ? (
                              <div className="space-y-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  className="h-10 text-base border-2 border-purple-300 focus:border-purple-500"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span className="ml-1">Save</span>
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    <X className="h-4 w-4" />
                                    <span className="ml-1">Cancel</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`p-2 rounded border border-transparent transition-colors ${
                                  isViewOnly 
                                    ? 'cursor-default bg-gray-50' 
                                    : 'cursor-pointer hover:bg-purple-50 hover:border-purple-200'
                                }`}
                                onClick={() => !isViewOnly && startEdit(extraction.id, 'vendor', extraction.extracted_data.vendor)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {extraction.extracted_data.vendor}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {isViewOnly ? 'View only' : 'Click to edit'}
                                </div>
                              </div>
                            )}
                            {errors[`${extraction.id}-vendor`] && (
                              <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">{errors[`${extraction.id}-vendor`]}</div>
                            )}
                          </TableCell>

                          {/* Amount Field */}
                          <TableCell>
                            {editingCell?.extractionId === extraction.id && editingCell?.field === 'amount' ? (
                              <div className="space-y-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  className="h-10 text-base border-2 border-purple-300 focus:border-purple-500"
                                  placeholder="Enter amount (no currency symbols)"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span className="ml-1">Save</span>
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    <X className="h-4 w-4" />
                                    <span className="ml-1">Cancel</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`p-2 rounded border border-transparent transition-colors ${
                                  isViewOnly 
                                    ? 'cursor-default bg-gray-50' 
                                    : 'cursor-pointer hover:bg-purple-50 hover:border-purple-200'
                                }`}
                                onClick={() => !isViewOnly && startEdit(extraction.id, 'amount', extraction.extracted_data.amount)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {formatAmountForDisplay(extraction.extracted_data.amount)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {isViewOnly ? 'View only' : 'Click to edit'}
                                </div>
                              </div>
                            )}
                            {errors[`${extraction.id}-amount`] && (
                              <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">{errors[`${extraction.id}-amount`]}</div>
                            )}
                          </TableCell>

                          {/* Transaction Type Field */}
                          <TableCell>
                            {editingCell?.extractionId === extraction.id && editingCell?.field === 'transaction_type' ? (
                              <div className="space-y-2">
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-10 text-base border-2 border-purple-300 focus:border-purple-500 rounded px-3 w-full"
                                  autoFocus
                                >
                                  <option value="expense">Expense</option>
                                  <option value="income">Income</option>
                                </select>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span className="ml-1">Save</span>
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    <X className="h-4 w-4" />
                                    <span className="ml-1">Cancel</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`p-2 rounded border border-transparent transition-colors ${
                                  isViewOnly 
                                    ? 'cursor-default bg-gray-50' 
                                    : 'cursor-pointer hover:bg-purple-50 hover:border-purple-200'
                                }`}
                                onClick={() => !isViewOnly && startEdit(extraction.id, 'transaction_type', extraction.extracted_data.transaction_type || 'expense')}
                              >
                                {getTransactionTypeIndicator(
                                  extraction.extracted_data.transaction_type, 
                                  extraction.extracted_data.classification_confidence
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  {isViewOnly ? 'View only' : 'Click to edit'}
                                </div>
                              </div>
                            )}
                            {errors[`${extraction.id}-transaction_type`] && (
                              <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">{errors[`${extraction.id}-transaction_type`]}</div>
                            )}
                          </TableCell>

                          {/* Description Field */}
                          <TableCell>
                            {editingCell?.extractionId === extraction.id && editingCell?.field === 'description' ? (
                              <div className="space-y-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  className="h-10 text-base border-2 border-purple-300 focus:border-purple-500"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span className="ml-1">Save</span>
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    <X className="h-4 w-4" />
                                    <span className="ml-1">Cancel</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`p-2 rounded border border-transparent transition-colors ${
                                  isViewOnly 
                                    ? 'cursor-default bg-gray-50' 
                                    : 'cursor-pointer hover:bg-purple-50 hover:border-purple-200'
                                }`}
                                onClick={() => !isViewOnly && startEdit(extraction.id, 'description', extraction.extracted_data.description)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {extraction.extracted_data.description}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {isViewOnly ? 'View only' : 'Click to edit'}
                                </div>
                              </div>
                            )}
                            {errors[`${extraction.id}-description`] && (
                              <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">{errors[`${extraction.id}-description`]}</div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Low Confidence Warning */}
            {extractions.filter(e => e.confidence_score < 0.7).length > 0 && (
              <Card className="group relative overflow-hidden border-0 bg-amber-50/50 backdrop-blur-xl shadow-lg shadow-amber-200/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-sm text-amber-800 font-medium">
                      {extractions.filter(e => e.confidence_score < 0.7).length} low confidence extraction{extractions.filter(e => e.confidence_score < 0.7).length !== 1 ? 's' : ''} need{extractions.filter(e => e.confidence_score < 0.7).length === 1 ? 's' : ''} review
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
