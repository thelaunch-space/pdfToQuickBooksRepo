// Review and edit widget component - displays extracted data in an editable table with validation
"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Save, 
  Download,
  X,
  Loader2,
  FileText
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

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

interface ReviewEditWidgetProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
}

export default function ReviewEditWidget({ isOpen, onClose, batchId }: ReviewEditWidgetProps) {
  const [batch, setBatch] = useState<Batch | null>(null)
  const [extractions, setExtractions] = useState<Extraction[]>([])
  const [loading, setLoading] = useState(false)
  const [editingCell, setEditingCell] = useState<{ extractionId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [exporting, setExporting] = useState(false)

  // Fetch extractions when modal opens
  const fetchExtractions = useCallback(async () => {
    if (!batchId) return

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
  }, [batchId])

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
    if (!batchId) return

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

  // React to modal open/close
  React.useEffect(() => {
    if (isOpen) {
      fetchExtractions()
    } else {
      // Reset state when modal closes
      setBatch(null)
      setExtractions([])
      setEditingCell(null)
      setEditValue('')
      setErrors({})
    }
  }, [isOpen, fetchExtractions])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Review & Edit Data
          </DialogTitle>
          <DialogDescription>
            {batch ? `Review and edit extracted data for ${batch.account_name} (${batch.csv_format} format)` : 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
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
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No extractions found</p>
              <p className="text-sm">This batch doesn't contain any processed extractions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {extractions.length} Receipt{extractions.length !== 1 ? 's' : ''} Processed
                    </h3>
                    <p className="text-sm text-gray-600">
                      Click any field to edit • Changes are saved automatically
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      {batch?.csv_format}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
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
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="h-8 text-sm"
                                placeholder={batch?.csv_format === '4-column' ? 'DD/MM/YYYY' : 'MM/DD/YYYY'}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} disabled={saving}>
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-gray-100 p-1 rounded text-sm"
                              onClick={() => startEdit(extraction.id, 'date', extraction.extracted_data.date)}
                            >
                              {formatDateForDisplay(extraction.extracted_data.date)}
                            </div>
                          )}
                          {errors[`${extraction.id}-date`] && (
                            <div className="text-xs text-red-600 mt-1">{errors[`${extraction.id}-date`]}</div>
                          )}
                        </TableCell>

                        {/* Vendor Field */}
                        <TableCell>
                          {editingCell?.extractionId === extraction.id && editingCell?.field === 'vendor' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} disabled={saving}>
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-gray-100 p-1 rounded text-sm"
                              onClick={() => startEdit(extraction.id, 'vendor', extraction.extracted_data.vendor)}
                            >
                              {extraction.extracted_data.vendor}
                            </div>
                          )}
                          {errors[`${extraction.id}-vendor`] && (
                            <div className="text-xs text-red-600 mt-1">{errors[`${extraction.id}-vendor`]}</div>
                          )}
                        </TableCell>

                        {/* Amount Field */}
                        <TableCell>
                          {editingCell?.extractionId === extraction.id && editingCell?.field === 'amount' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="h-8 text-sm"
                                placeholder="Enter amount (no currency symbols)"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} disabled={saving}>
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-gray-100 p-1 rounded text-sm"
                              onClick={() => startEdit(extraction.id, 'amount', extraction.extracted_data.amount)}
                            >
                              {formatAmountForDisplay(extraction.extracted_data.amount)}
                            </div>
                          )}
                          {errors[`${extraction.id}-amount`] && (
                            <div className="text-xs text-red-600 mt-1">{errors[`${extraction.id}-amount`]}</div>
                          )}
                        </TableCell>

                        {/* Description Field */}
                        <TableCell>
                          {editingCell?.extractionId === extraction.id && editingCell?.field === 'description' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} disabled={saving}>
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-gray-100 p-1 rounded text-sm"
                              onClick={() => startEdit(extraction.id, 'description', extraction.extracted_data.description)}
                            >
                              {extraction.extracted_data.description}
                            </div>
                          )}
                          {errors[`${extraction.id}-description`] && (
                            <div className="text-xs text-red-600 mt-1">{errors[`${extraction.id}-description`]}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {extractions.length > 0 && (
              <>
                {extractions.filter(e => e.confidence_score < 0.7).length} low confidence extraction{extractions.filter(e => e.confidence_score < 0.7).length !== 1 ? 's' : ''} need{extractions.filter(e => e.confidence_score < 0.7).length === 1 ? 's' : ''} review
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
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
      </DialogContent>
    </Dialog>
  )
}
