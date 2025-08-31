import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Check if Google AI API key is configured
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    
    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" })
    
    // Create prompt for financial data extraction
    const prompt = `
    Analise esta imagem de recibo/nota fiscal e extraia as seguintes informações financeiras:
    
    1. Valor total (apenas números, sem símbolos)
    2. Descrição/estabelecimento
    3. Data (se visível)
    4. Categoria sugerida (Alimentação, Transporte, Compras, Saúde, etc.)
    
    Retorne APENAS um JSON válido no formato:
    {
      "amount": 0.00,
      "description": "Nome do estabelecimento ou descrição",
      "date": "YYYY-MM-DD ou null",
      "category": "Categoria sugerida",
      "confidence": 0.95
    }
    
    Se não conseguir extrair alguma informação, use null para esse campo.
    `
    
    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      }
    ])
    
    const response = await result.response
    const text = response.text()
    
    // Try to parse JSON from response
    let structuredData = null
    const extractedText = text
    
    try {
      // Look for JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.warn('Could not parse structured data from Gemini response:', parseError)
    }
    
    // Fallback: extract basic info from text
    if (!structuredData) {
      const lines = text.split('\n').filter(line => line.trim())
      let amount = 0
      let description = 'Transação via OCR'
      
      // Simple amount extraction
      const amountMatch = text.match(/\d+[.,]?\d*/g)
      if (amountMatch) {
        const amounts = amountMatch.map(a => parseFloat(a.replace(',', '.')))
        amount = Math.max(...amounts.filter(a => !isNaN(a)))
      }
      
      // Use first meaningful line as description
      const meaningfulLine = lines.find(line => 
        line.length > 3 && 
        !line.match(/^\d+[.,]?\d*$/) && 
        !line.match(/^[\d\s\-\/]+$/)
      )
      if (meaningfulLine) {
        description = meaningfulLine.substring(0, 100)
      }
      
      structuredData = {
        amount: amount || 0,
        description,
        date: null,
        category: 'Outros',
        confidence: 0.7
      }
    }
    
    return NextResponse.json({
      extracted_text: extractedText,
      structured_data: structuredData,
      success: true
    })
    
  } catch (error) {
    console.error('OCR processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OCR endpoint is working. Use POST to upload images.',
    supported_formats: ['image/jpeg', 'image/png', 'image/webp'],
    max_size: '10MB'
  })
}
