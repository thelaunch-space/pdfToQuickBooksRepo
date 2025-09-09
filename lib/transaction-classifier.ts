// Transaction classification utility - uses AI to determine if a transaction is income or expense
import { createAPIClient } from './supabase-api'

export interface ClassificationResult {
  transaction_type: 'income' | 'expense'
  confidence: number
  reasoning: string
}

export interface TransactionData {
  vendor: string
  description: string
  amount: string
  accountName: string
}

/**
 * Classifies a transaction as income or expense using AI analysis
 * Considers account context, vendor matching, and transaction details
 */
export async function classifyTransaction(
  transactionData: TransactionData
): Promise<ClassificationResult> {
  const { vendor, description, amount, accountName } = transactionData

  console.log('🔍 Classifying transaction:', {
    vendor,
    description,
    amount,
    accountName
  })

  try {
    // Use a cost-effective model for classification
    const model = 'deepseek/deepseek-chat' // Free/very cheap model
    const prompt = `Analyze this transaction and determine if it's INCOME or EXPENSE.

Account Name: ${accountName}
Vendor: ${vendor}
Description: ${description}
Amount: ${amount}

Context: This transaction is being processed under the account "${accountName}".

Important:
- Vendor names may not match exactly (e.g., "Amazon" vs "Amazon.com Inc" vs "AMZN")
- Consider if this is money coming IN (income) or going OUT (expense)
- If vendor is similar to account name, it's likely income (client paying us)
- If vendor is different from account name, it's likely expense (us paying vendor)
- Look for keywords: "payment received", "invoice", "deposit" (income) vs "purchase", "bill", "expense" (expense)

Return a JSON object with this exact structure:
{
  "transaction_type": "income" or "expense",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.1
    }

    console.log('🤖 Sending classification request to OpenRouter...')
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pdf-to-quickbooks.vercel.app',
        'X-Title': 'PDF to QuickBooks'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OpenRouter API error:', response.status, errorText)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content received from AI')
    }

    console.log('📥 AI response:', content)

    // Parse JSON response
    let result: ClassificationResult
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      result = JSON.parse(jsonMatch[0])
      
      // Validate response structure
      if (!result.transaction_type || !['income', 'expense'].includes(result.transaction_type)) {
        throw new Error('Invalid transaction_type in response')
      }
      
      if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
        result.confidence = 0.5 // Default confidence if invalid
      }
      
      if (!result.reasoning) {
        result.reasoning = 'AI classification'
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
      console.log('Raw response:', content)
      
      // Fallback classification based on simple rules
      result = fallbackClassification(vendor, description, accountName)
    }

    console.log('✅ Classification result:', result)
    return result

  } catch (error) {
    console.error('💥 Classification error:', error)
    
    // Fallback to rule-based classification
    return fallbackClassification(vendor, description, accountName)
  }
}

/**
 * Fallback classification using simple rules when AI fails
 */
function fallbackClassification(
  vendor: string,
  description: string,
  accountName: string
): ClassificationResult {
  console.log('🔄 Using fallback classification')
  
  const vendorLower = vendor.toLowerCase()
  const descriptionLower = description.toLowerCase()
  const accountLower = accountName.toLowerCase()
  
  // Check if vendor matches account name (likely income)
  const vendorMatchesAccount = vendorLower.includes(accountLower) || 
                              accountLower.includes(vendorLower) ||
                              vendorLower === accountLower
  
  if (vendorMatchesAccount) {
    return {
      transaction_type: 'income',
      confidence: 0.7,
      reasoning: 'Vendor name matches account name - likely client payment'
    }
  }
  
  // Check for income keywords
  const incomeKeywords = ['payment received', 'invoice', 'deposit', 'revenue', 'sale', 'income']
  const hasIncomeKeywords = incomeKeywords.some(keyword => 
    descriptionLower.includes(keyword) || vendorLower.includes(keyword)
  )
  
  if (hasIncomeKeywords) {
    return {
      transaction_type: 'income',
      confidence: 0.6,
      reasoning: 'Contains income-related keywords'
    }
  }
  
  // Check for expense keywords
  const expenseKeywords = ['purchase', 'payment to', 'bill', 'expense', 'cost', 'fee']
  const hasExpenseKeywords = expenseKeywords.some(keyword => 
    descriptionLower.includes(keyword) || vendorLower.includes(keyword)
  )
  
  if (hasExpenseKeywords) {
    return {
      transaction_type: 'expense',
      confidence: 0.6,
      reasoning: 'Contains expense-related keywords'
    }
  }
  
  // Default to expense (most common case)
  return {
    transaction_type: 'expense',
    confidence: 0.3,
    reasoning: 'Default classification - no clear indicators found'
  }
}
