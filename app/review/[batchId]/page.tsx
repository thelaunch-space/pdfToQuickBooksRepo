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
  Home
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface ExtractedData {
  date: string
  vendor: string
  amount: string
  description: string
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-purple-600 hover:bg-purple-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Review & Edit Data</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-purple-600 hover:bg-purple-50"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Review & Edit Data</h1>
          <p className="text-gray-600">
            {batch ? `Review and edit extracted data for ${batch.account_name} (${batch.csv_format} format)` : 'Loading...'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading extractions...</span>
          </div>
        ) : errors.fetch ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{errors.fetch}</AlertDescription>
          </Alert>
        ) : extractions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No extractions found</p>
              <p className="text-sm text-gray-500">This batch doesn't contain any processed extractions.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Batch Summary
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    {batch?.csv_format}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {extractions.length} Receipt{extractions.length !== 1 ? 's' : ''} Processed • Click any field to edit • Changes are saved automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{extractions.length}</div>
                    <div className="text-sm text-gray-600">Total Receipts</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {extractions.filter(e => e.confidence_score >= 0.9).length}
                    </div>
                    <div className="text-sm text-gray-600">High Confidence</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {extractions.filter(e => e.confidence_score < 0.7).length}
                    </div>
                    <div className="text-sm text-gray-600">Need Review</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Extracted Data</CardTitle>
                <CardDescription>
                  Review and edit the extracted data. Fields with low confidence are highlighted for your attention.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Confidence</TableHead>
                        <TableHead className="w-48">Filename</TableHead>
                        <TableHead className="w-32">Date</TableHead>
                        <TableHead className="w-48">Vendor</TableHead>
                        <TableHead className="w-32">Amount</TableHead>
                        <TableHead>Description</TableHead>
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
                                className="cursor-pointer hover:bg-purple-50 p-2 rounded border border-transparent hover:border-purple-200 transition-colors"
                                onClick={() => startEdit(extraction.id, 'date', extraction.extracted_data.date)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDateForDisplay(extraction.extracted_data.date)}
                                </div>
                                <div className="text-xs text-gray-500">Click to edit</div>
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
                                className="cursor-pointer hover:bg-purple-50 p-2 rounded border border-transparent hover:border-purple-200 transition-colors"
                                onClick={() => startEdit(extraction.id, 'vendor', extraction.extracted_data.vendor)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {extraction.extracted_data.vendor}
                                </div>
                                <div className="text-xs text-gray-500">Click to edit</div>
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
                                className="cursor-pointer hover:bg-purple-50 p-2 rounded border border-transparent hover:border-purple-200 transition-colors"
                                onClick={() => startEdit(extraction.id, 'amount', extraction.extracted_data.amount)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {formatAmountForDisplay(extraction.extracted_data.amount)}
                                </div>
                                <div className="text-xs text-gray-500">Click to edit</div>
                              </div>
                            )}
                            {errors[`${extraction.id}-amount`] && (
                              <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">{errors[`${extraction.id}-amount`]}</div>
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
                                className="cursor-pointer hover:bg-purple-50 p-2 rounded border border-transparent hover:border-purple-200 transition-colors"
                                onClick={() => startEdit(extraction.id, 'description', extraction.extracted_data.description)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {extraction.extracted_data.description}
                                </div>
                                <div className="text-xs text-gray-500">Click to edit</div>
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

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {extractions.filter(e => e.confidence_score < 0.7).length > 0 && (
                  <>
                    {extractions.filter(e => e.confidence_score < 0.7).length} low confidence extraction{extractions.filter(e => e.confidence_score < 0.7).length !== 1 ? 's' : ''} need{extractions.filter(e => e.confidence_score < 0.7).length === 1 ? 's' : ''} review
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
