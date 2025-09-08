// API route for updating extraction data - handles validation and auto-save functionality
import { NextRequest, NextResponse } from 'next/server'
import { createAPIClient, createUserClient, authenticateAPIRequest } from '@/lib/supabase-api'

// Validation functions
function validateDate(dateString: string, csvFormat: string): { isValid: boolean; error?: string } {
  if (!dateString || dateString.trim() === '') {
    return { isValid: false, error: 'Date is required' }
  }

  // Expected format based on CSV format
  const expectedFormat = csvFormat === '4-column' ? 'DD/MM/YYYY' : 'MM/DD/YYYY'
  const dateRegex = csvFormat === '4-column' 
    ? /^(\d{2})\/(\d{2})\/(\d{4})$/
    : /^(\d{2})\/(\d{2})\/(\d{4})$/

  if (!dateRegex.test(dateString)) {
    return { isValid: false, error: `Date must be in ${expectedFormat} format` }
  }

  // Parse and validate the date
  const [, dayOrMonth, monthOrDay, year] = dateString.match(dateRegex)!
  const month = csvFormat === '4-column' ? parseInt(monthOrDay) : parseInt(dayOrMonth)
  const day = csvFormat === '4-column' ? parseInt(dayOrMonth) : parseInt(monthOrDay)
  const yearNum = parseInt(year)

  // Basic date validation
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month' }
  }
  if (day < 1 || day > 31) {
    return { isValid: false, error: 'Invalid day' }
  }
  if (yearNum < 1900 || yearNum > 2100) {
    return { isValid: false, error: 'Invalid year' }
  }

  // Check if date is valid (handles leap years, etc.)
  const date = new Date(yearNum, month - 1, day)
  if (date.getFullYear() !== yearNum || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { isValid: false, error: 'Invalid date' }
  }

  return { isValid: true }
}

function validateAmount(amountString: string): { isValid: boolean; error?: string; cleanedAmount?: string } {
  if (!amountString || amountString.trim() === '') {
    return { isValid: false, error: 'Amount is required' }
  }

  // Remove currency symbols, commas, and whitespace
  const cleaned = amountString.replace(/[$,\s]/g, '')
  
  // Check if it's a valid number
  const num = parseFloat(cleaned)
  if (isNaN(num)) {
    return { isValid: false, error: 'Amount must be a valid number' }
  }

  // Check for reasonable range
  if (num < 0) {
    return { isValid: false, error: 'Amount cannot be negative' }
  }
  if (num > 999999999999) {
    return { isValid: false, error: 'Amount too large (max 999 billion)' }
  }

  return { isValid: true, cleanedAmount: num.toString() }
}

function validateVendor(vendor: string): { isValid: boolean; error?: string } {
  if (!vendor || vendor.trim() === '') {
    return { isValid: false, error: 'Vendor is required' }
  }
  if (vendor.length > 100) {
    return { isValid: false, error: 'Vendor name too long (max 100 characters)' }
  }
  return { isValid: true }
}

function validateDescription(description: string): { isValid: boolean; error?: string } {
  if (!description || description.trim() === '') {
    return { isValid: false, error: 'Description is required' }
  }
  if (description.length > 200) {
    return { isValid: false, error: 'Description too long (max 200 characters)' }
  }
  return { isValid: true }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { extractionId: string } }
) {
  console.log('🚀 Update Extraction API called')
  console.log('📋 Extraction ID:', params.extractionId)
  
  try {
    const extractionId = params.extractionId
    const { field, value } = await request.json()

    if (!extractionId) {
      return NextResponse.json({ 
        error: 'Missing extractionId parameter' 
      }, { status: 400 })
    }

    if (!field || value === undefined) {
      return NextResponse.json({ 
        error: 'Missing field or value in request body' 
      }, { status: 400 })
    }

    // Validate field name
    const validFields = ['date', 'vendor', 'amount', 'description']
    if (!validFields.includes(field)) {
      return NextResponse.json({ 
        error: `Invalid field: ${field}. Must be one of: ${validFields.join(', ')}` 
      }, { status: 400 })
    }

    // Get user from Authorization header
    console.log('🔐 Getting user from Authorization header...')
    const authHeader = request.headers.get('Authorization')
    
    const { user, error: authError } = await authenticateAPIRequest(authHeader)
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create supabase instance for database operations using service role
    // We'll manually validate user access to ensure security
    const supabase = createAPIClient()

    // Get the extraction with batch and account info for validation
    const { data: extraction, error: extractionError } = await supabase
      .from('extractions')
      .select(`
        id,
        extracted_data,
        batch_id,
        batches!inner(
          id,
          csv_format,
          status,
          account_id,
          accounts!inner(
            id,
            user_id
          )
        )
      `)
      .eq('id', extractionId)
      .single()

    if (extractionError || !extraction) {
      console.log('❌ Extraction not found:', extractionError)
      return NextResponse.json({ 
        error: 'Extraction not found' 
      }, { status: 404 })
    }

    // Verify user owns this extraction through batch -> account relationship
    if (!extraction.batches) {
      return NextResponse.json({ 
        error: 'Batch not found for this extraction' 
      }, { status: 404 })
    }

    const batch = (extraction.batches as any)
    const accounts = Array.isArray(batch.accounts) ? batch.accounts[0] : batch.accounts
    if (!accounts || accounts.user_id !== user.id) {
      console.log('❌ Access denied - user does not own this extraction')
      return NextResponse.json({ 
        error: 'Access denied - you do not own this extraction' 
      }, { status: 403 })
    }

    // Only allow editing of completed batches
    if (batch.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Cannot edit extractions from incomplete batches' 
      }, { status: 400 })
    }

    // Validate the field value
    let validation: { isValid: boolean; error?: string; cleanedValue?: string } = { isValid: true }

    switch (field) {
      case 'date':
        validation = validateDate(value, batch.csv_format)
        break
      case 'amount':
        const amountValidation = validateAmount(value)
        validation = amountValidation
        if (amountValidation.isValid && amountValidation.cleanedAmount) {
          validation.cleanedValue = amountValidation.cleanedAmount
        }
        break
      case 'vendor':
        validation = validateVendor(value)
        break
      case 'description':
        validation = validateDescription(value)
        break
    }

    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error,
        field: field,
        value: value
      }, { status: 400 })
    }

    // Update the extracted_data JSONB field
    const updatedData = {
      ...extraction.extracted_data,
      [field]: validation.cleanedValue || value
    }

    const { data: updatedExtraction, error: updateError } = await supabase
      .from('extractions')
      .update({ 
        extracted_data: updatedData
      })
      .eq('id', extractionId)
      .select('id, extracted_data')
      .single()

    if (updateError) {
      console.error('❌ Error updating extraction:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update extraction' 
      }, { status: 500 })
    }

    console.log('✅ Successfully updated extraction:', {
      extractionId,
      field,
      oldValue: extraction.extracted_data[field],
      newValue: updatedData[field]
    })

    return NextResponse.json({
      success: true,
      extraction: updatedExtraction,
      field: field,
      value: updatedData[field]
    })

  } catch (error) {
    console.error('💥 Update extraction error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
