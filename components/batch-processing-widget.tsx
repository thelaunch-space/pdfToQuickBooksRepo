// Batch processing widget component for dashboard - handles multiple PDF uploads, processing, and batch management
"use client"

import React, { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  FileText, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  Building2,
  BarChart3
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { trackCSVDownload } from "@/components/google-analytics"

interface UploadedFile {
  file: File
  id: string
  pages?: number
}

interface BatchProcessingState {
  files: UploadedFile[]
  selectedFormat: '3-column' | '4-column'
  isProcessing: boolean
  processingProgress: number
  batchId: string | null
  error: string | null
}

interface BatchProcessingWidgetProps {
  selectedAccountId: string
  selectedAccountName: string
  userProfile: any
  onBatchComplete: () => void
}

export default function BatchProcessingWidget({ 
  selectedAccountId, 
  selectedAccountName, 
  userProfile,
  onBatchComplete 
}: BatchProcessingWidgetProps) {
  const [state, setState] = useState<BatchProcessingState>({
    files: [],
    selectedFormat: '3-column',
    isProcessing: false,
    processingProgress: 0,
    batchId: null,
    error: null
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, session } = useAuth()
  const router = useRouter()

  // Helper function to get fresh session token
  const getSessionToken = async () => {
    // Always try to get a fresh session to handle token refresh
    const { data: { session: freshSession }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      throw new Error('Session error: ' + error.message)
    }
    
    if (freshSession?.access_token) {
      console.log('✅ Fresh session token obtained')
      return freshSession.access_token
    }
    
    throw new Error('No valid session found. Please sign in again.')
  }

  // Helper function to refresh session periodically during long operations
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) {
        console.warn('Session refresh failed:', error)
        return false
      }
      console.log('✅ Session refreshed successfully')
      return true
    } catch (error) {
      console.warn('Session refresh error:', error)
      return false
    }
  }

  // Validate subscription status
  const isSubscriptionActive = userProfile?.subscription_status === 'active'
  
  // Calculate total pages (estimate 1 page per file for now)
  const totalPages = state.files.length
  const wouldExceedLimit = (userProfile?.monthly_usage || 0) + totalPages > 1500

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = []
    const errors: string[] = []

    Array.from(files).forEach((file, index) => {
      // Validate file type
      if (file.type !== 'application/pdf') {
        errors.push(`${file.name}: Must be a PDF file`)
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size must be less than 10MB`)
        return
      }

      // Check total file count (max 10)
      if (state.files.length + newFiles.length >= 10) {
        errors.push(`Maximum 10 files allowed per batch`)
        return
      }

      newFiles.push({
        file,
        id: `${Date.now()}-${index}`,
        pages: 1 // TODO: Implement actual page counting
      })
    })

    if (errors.length > 0) {
      toast({
        title: "Upload Errors",
        description: errors.join(', '),
        variant: "destructive"
      })
    }

    if (newFiles.length > 0) {
      setState(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles],
        error: null
      }))
    }
  }, [state.files.length])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeFile = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }))
  }, [])

  const processBatch = useCallback(async () => {
    if (!isSubscriptionActive) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to process batches",
        variant: "destructive"
      })
      return
    }

    if (wouldExceedLimit) {
      toast({
        title: "Usage Limit Exceeded",
        description: "This batch would exceed your monthly limit of 1500 pages",
        variant: "destructive"
      })
      return
    }

    if (state.files.length === 0) {
      toast({
        title: "No Files",
        description: "Please select at least one PDF file to process",
        variant: "destructive"
      })
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, processingProgress: 0, error: null }))

    try {
      // Create batch record
      console.log('🚀 Starting batch processing...')
      console.log('📋 Batch data:', {
        accountId: selectedAccountId,
        accountName: selectedAccountName,
        fileCount: state.files.length,
        totalPages: totalPages,
        csvFormat: state.selectedFormat
      })
      console.log('👤 Current user:', user?.id, user?.email)
      console.log('🔍 Account ID type:', typeof selectedAccountId)
      console.log('🔍 Account ID value:', selectedAccountId)

      // Get the current session token
      const token = await getSessionToken()

      const batchResponse = await fetch('/api/batch-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: selectedAccountId,
          fileCount: state.files.length,
          totalPages: totalPages,
          csvFormat: state.selectedFormat
        })
      })

      console.log('📥 Batch creation response:', {
        status: batchResponse.status,
        ok: batchResponse.ok
      })

      if (!batchResponse.ok) {
        const errorData = await batchResponse.json()
        console.error('❌ Batch creation failed:', errorData)
        
        // Show user-friendly error message
        if (errorData.error?.includes('Account not found')) {
          toast({
            title: "Account Error",
            description: "The selected account could not be found. Please refresh the page and try again.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Processing Error",
            description: errorData.error || 'Failed to create batch',
            variant: "destructive"
          })
        }
        
        throw new Error(errorData.error || 'Failed to create batch')
      }

      const { batchId } = await batchResponse.json()
      console.log('✅ Batch created with ID:', batchId)
      setState(prev => ({ ...prev, batchId }))

      // Process each file with queued processing (2 second delay between files)
      for (let i = 0; i < state.files.length; i++) {
        const file = state.files[i]
        const progress = Math.round(((i + 1) / state.files.length) * 100)
        setState(prev => ({ ...prev, processingProgress: progress }))

        // Refresh session every 3 files to prevent expiration during long processing
        if (i > 0 && i % 3 === 0) {
          console.log('🔄 Refreshing session to prevent expiration...')
          await refreshSession()
        }

        // Get fresh token for each file to handle session refresh
        let currentToken = token
        try {
          currentToken = await getSessionToken()
        } catch (tokenError) {
          console.warn('Failed to refresh token, using original token:', tokenError)
        }

        const formData = new FormData()
        formData.append('file', file.file)
        formData.append('batchId', batchId)
        formData.append('format', state.selectedFormat)

        const fileResponse = await fetch('/api/batch-processing/process-file', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          },
          body: formData
        })

        if (!fileResponse.ok) {
          const errorData = await fileResponse.json()
          
          // Handle session expiration specifically
          if (fileResponse.status === 401) {
            throw new Error('Your session has expired. Please sign in again.')
          }
          
          throw new Error(`Failed to process ${file.file.name}: ${errorData.error}`)
        }

        // Show progress for each file
        toast({
          title: "Processing File",
          description: `Completed ${i + 1} of ${state.files.length}: ${file.file.name}`
        })
      }

      // Mark batch as completed - refresh session and get fresh token
      console.log('🔄 Final session refresh before batch completion...')
      await refreshSession()
      
      let finalToken = token
      try {
        finalToken = await getSessionToken()
      } catch (tokenError) {
        console.warn('Failed to refresh token for completion, using original token:', tokenError)
      }

      const completeResponse = await fetch('/api/batch-processing/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalToken}`
        },
        body: JSON.stringify({ batchId })
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        
        // Handle session expiration specifically
        if (completeResponse.status === 401) {
          throw new Error('Your session has expired. Please sign in again.')
        }
        
        throw new Error(errorData.error || 'Failed to complete batch')
      }

      toast({
        title: "Batch Processing Complete",
        description: `Successfully processed ${state.files.length} files. Usage updated: +${totalPages} pages.`
      })

      // Reset state and refresh
      setState({
        files: [],
        selectedFormat: '3-column',
        isProcessing: false,
        processingProgress: 0,
        batchId: null,
        error: null
      })

      onBatchComplete()

      // Redirect to review page after a short delay
      setTimeout(() => {
        router.push(`/review/${batchId}`)
      }, 1500)

    } catch (error) {
      console.error('Batch processing error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process batch'
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }))
      
      // Handle session expiration specifically
      if (errorMessage.includes('session has expired') || errorMessage.includes('Please sign in again')) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Redirecting to login...",
          variant: "destructive"
        })
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        return
      }
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [isSubscriptionActive, wouldExceedLimit, state.files, state.selectedFormat, selectedAccountId, totalPages, onBatchComplete, router])

  const canProcess = isSubscriptionActive && !wouldExceedLimit && state.files.length > 0 && !state.isProcessing

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          Batch Processing
        </CardTitle>
        <CardDescription>
          Upload up to 10 PDF receipts for {selectedAccountName} and convert them to QuickBooks-ready CSV files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Warning */}
        {wouldExceedLimit && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This batch would exceed your monthly limit of 1,500 pages. 
              Current usage: {userProfile?.monthly_usage || 0}/1,500 pages.
            </AlertDescription>
          </Alert>
        )}

        {/* Format Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">QuickBooks Format</Label>
          <RadioGroup 
            value={state.selectedFormat} 
            onValueChange={(value: '3-column' | '4-column') => 
              setState(prev => ({ ...prev, selectedFormat: value }))
            } 
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3-column" id="3-column" />
              <Label htmlFor="3-column" className="text-sm">3-Column</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="4-column" id="4-column" />
              <Label htmlFor="4-column" className="text-sm">4-Column</Label>
            </div>
          </RadioGroup>
          <div className="text-xs text-gray-500 mt-2">
            {state.selectedFormat === '3-column' 
              ? 'Date (MM/DD/YYYY), Description (vendor + memo), Amount (negative for expenses)'
              : 'Date (DD/MM/YYYY), Description, Credit (blank), Debit (positive amounts)'
            }
          </div>
        </div>

        {/* File Upload Area */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Upload PDF Files ({state.files.length}/10)
          </Label>
          <div
            className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <div className="text-lg font-medium text-gray-700 mb-2">
              Click to upload or drag & drop PDF files
            </div>
            <div className="text-sm text-gray-500">
              Up to 10 files • 10MB max per file • PDF format only
            </div>
          </div>
        </div>

        {/* File List */}
        {state.files.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Selected Files ({state.files.length})
            </Label>
            <div className="space-y-2">
              {state.files.map((uploadedFile) => (
                <div key={uploadedFile.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">{uploadedFile.file.name}</div>
                      <div className="text-sm text-gray-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    disabled={state.isProcessing}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Status */}
        {state.isProcessing && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
              <span className="font-medium text-gray-900">Processing batch...</span>
            </div>
            <Progress value={state.processingProgress} className="h-3 mb-2" />
            <div className="text-sm text-gray-600">{state.processingProgress}% complete</div>
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={processBatch}
            disabled={!canProcess}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold"
          >
            {state.isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Process {state.files.length} File{state.files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
          
          {state.files.length > 0 && !state.isProcessing && (
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, files: [] }))}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Usage Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">This batch will use:</span>
            </div>
            <div className="font-medium text-gray-900">
              {totalPages} page{totalPages !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Account:</span>
            </div>
            <div className="font-medium text-gray-900">{selectedAccountName}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
