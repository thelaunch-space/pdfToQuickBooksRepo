// Trial widget component for landing page - handles PDF upload, processing, and results display for anonymous users
"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Download, Lock, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface ExtractedData {
  date: string
  vendor: string
  amount: string
  description: string
  confidence: number
}

interface ProcessingResult {
  success: boolean
  data?: ExtractedData
  error?: string
}

type WidgetState = 'upload' | 'processing' | 'results' | 'error'

export default function TrialWidget() {
  const [state, setState] = useState<WidgetState>('upload')
  const [selectedFormat, setSelectedFormat] = useState<'3-column' | '4-column'>('3-column')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [result, setResult] = useState<ProcessingResult | null>(null)

  const processFile = useCallback(async (file: File) => {
    console.log('🚀 Starting file processing:', file.name)
    try {
      setProcessingProgress(0)
      
      // Start the API call
      const formData = new FormData()
      formData.append('file', file)
      formData.append('format', selectedFormat)

      console.log('📤 Sending request to API...')
      const apiPromise = fetch('/api/process-pdf', {
        method: 'POST',
        body: formData
      })

      // Update progress while API call is running
      const progressSteps = [20, 40, 60, 80]
      let currentStep = 0

      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setProcessingProgress(progressSteps[currentStep])
          currentStep++
        }
      }, 1000)

      // Wait for API response
      console.log('⏳ Waiting for API response...')
      const response = await apiPromise
      
      // Clear progress interval and set to 100%
      clearInterval(progressInterval)
      setProcessingProgress(100)
      
      console.log('📥 API response received:', response.status)
      const result = await response.json()
      console.log('📄 API result:', result)

      if (!response.ok || !result.success) {
        console.log('❌ API error:', result.error)
        throw new Error(result.error || 'Failed to process PDF')
      }

      console.log('✅ Processing successful:', result.data)
      setResult({
        success: true,
        data: result.data
      })
      setState('results')
    } catch (error) {
      console.error('💥 Processing error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process PDF. Please try again.'
      })
      setState('error')
    }
  }, [selectedFormat])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.')
      return
    }

    setUploadedFile(file)
    setState('processing')
    processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only.')
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.')
        return
      }

      setUploadedFile(file)
      setState('processing')
      processFile(file)
    }
  }, [processFile])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />
    if (confidence >= 0.6) return <AlertCircle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <div className="lg:pl-8">
      <div className="mb-6">
        <div className="flex items-center space-x-3 text-purple-700 font-medium">
          <FileText className="h-5 w-5" />
          <span>Free Demo: Try 1 PDF • No signup</span>
        </div>
      </div>

      <div className="widget-premium rounded-3xl p-12 text-center floating border-2 border-purple-100/50 bg-gradient-to-br from-white via-purple-50/30 to-white shadow-[0_20px_70px_-10px_rgba(139,92,246,0.3)] backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-600/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-300/30 to-transparent"></div>

        <div className="relative z-10">
          {state === 'upload' && (
            <>
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-purple-100/50">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-3">Try with your receipt PDF</div>
                <div className="text-gray-600 text-lg">Drop 1 PDF here to see the magic • No sign-up required</div>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">QuickBooks Format</Label>
                <RadioGroup value={selectedFormat} onValueChange={(value: '3-column' | '4-column') => setSelectedFormat(value)} className="flex justify-center space-x-6">
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
                  {selectedFormat === '3-column' ? 'Date, Description, Amount' : 'Date, Description, Credit, Debit'}
                </div>
              </div>

              <div
                className="border-2 border-dashed border-purple-300 rounded-2xl p-8 mb-4 hover:border-purple-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                <div className="text-lg font-medium text-gray-700 mb-2">Click to upload or drag & drop</div>
                <div className="text-sm text-gray-500">PDF files only • Max 10MB</div>
              </div>

              <div className="text-sm text-gray-500">See exactly how your receipts will be processed</div>
            </>
          )}

          {state === 'processing' && (
            <>
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-purple-100/50">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-3">Processing your PDF...</div>
                <div className="text-gray-600 text-lg">AI is extracting data from your receipt</div>
              </div>

              <div className="mb-6">
                <Progress value={processingProgress} className="h-3 mb-4" />
                <div className="text-sm text-gray-600">{processingProgress}% complete</div>
              </div>

              <div className="text-sm text-gray-500">This usually takes 10-30 seconds</div>
            </>
          )}

          {state === 'results' && result?.data && (
            <>
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-green-100/50">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-3">Data Extracted Successfully!</div>
                <div className="text-gray-600 text-lg">Here's what we found in your receipt</div>
              </div>

              {/* Results Table */}
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700 mb-1">Sign up to edit data</div>
                    <div className="text-xs text-gray-500">Free users can view only</div>
                  </div>
                </div>
                
                <Table className="border rounded-lg">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Date</TableCell>
                      <TableCell>{result.data.date}</TableCell>
                      <TableCell>
                        <Badge className={`${getConfidenceColor(result.data.confidence)} flex items-center space-x-1 w-fit`}>
                          {getConfidenceIcon(result.data.confidence)}
                          <span>{Math.round(result.data.confidence * 100)}%</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Vendor</TableCell>
                      <TableCell>{result.data.vendor}</TableCell>
                      <TableCell>
                        <Badge className={`${getConfidenceColor(result.data.confidence)} flex items-center space-x-1 w-fit`}>
                          {getConfidenceIcon(result.data.confidence)}
                          <span>{Math.round(result.data.confidence * 100)}%</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Amount</TableCell>
                      <TableCell>${result.data.amount}</TableCell>
                      <TableCell>
                        <Badge className={`${getConfidenceColor(result.data.confidence)} flex items-center space-x-1 w-fit`}>
                          {getConfidenceIcon(result.data.confidence)}
                          <span>{Math.round(result.data.confidence * 100)}%</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Description</TableCell>
                      <TableCell>{result.data.description}</TableCell>
                      <TableCell>
                        <Badge className={`${getConfidenceColor(result.data.confidence)} flex items-center space-x-1 w-fit`}>
                          {getConfidenceIcon(result.data.confidence)}
                          <span>{Math.round(result.data.confidence * 100)}%</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Conversion Gates */}
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="btn-premium text-white font-semibold px-10 py-4 text-lg w-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Lock className="h-6 w-6 mr-3" />
                  Sign up to download CSV
                </Button>
                
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">Want to process 10 receipts at once?</div>
                  <div className="text-lg font-semibold text-purple-700 mb-4">$9/month for 1500 pages</div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-2xl border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    Sign up to get started
                  </Button>
                </div>
              </div>
            </>
          )}

          {state === 'error' && result?.error && (
            <>
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-red-100/50">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-3">Processing Failed</div>
                <div className="text-gray-600 text-lg">{result.error}</div>
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="btn-premium text-white font-semibold px-10 py-4 text-lg w-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setState('upload')}
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-2xl border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => {
                    setState('upload')
                    setResult(null)
                    setUploadedFile(null)
                    setProcessingProgress(0)
                  }}
                >
                  Start Over
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Secondary CTA Options */}
      {state === 'upload' && (
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 mt-6">
          <button className="flex items-center space-x-2 hover:text-purple-600 transition-all duration-300 hover:scale-105">
            <span>Skip Demo - Sign Up</span>
            <Download className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-gray-300"></div>
          <span>Already have an account?</span>
        </div>
      )}
    </div>
  )
}
