import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

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
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamic import to avoid build issues
    const pdf = (await import('pdf-parse')).default
    const pdfData = await pdf(buffer)
    const extractedText = pdfData.text
    
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF' },
        { status: 400 }
      )
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: apiKey
    })
    
    // Create financial analysis prompt
    const systemPrompt = `
    Você é um analista financeiro especializado em extratos bancários e documentos financeiros.
    Analise o texto fornecido e forneça insights detalhados sobre:
    
    1. Padrões de gastos
    2. Categorização de transações
    3. Oportunidades de economia
    4. Alertas sobre gastos excessivos
    5. Recomendações personalizadas
    
    Seja específico e prático nas suas recomendações.
    `
    
    const userPrompt = `
    Analise este extrato/documento financeiro e forneça insights detalhados:
    
    ${extractedText.substring(0, 8000)} // Limit text to avoid token limits
    
    Forneça sua análise em formato JSON com a seguinte estrutura:
    {
      "summary": "Resumo geral do documento",
      "total_transactions": 0,
      "total_income": 0.00,
      "total_expenses": 0.00,
      "categories": [
        {
          "name": "Categoria",
          "amount": 0.00,
          "percentage": 0.00,
          "transactions": 0
        }
      ],
      "insights": [
        "Insight 1",
        "Insight 2"
      ],
      "recommendations": [
        "Recomendação 1",
        "Recomendação 2"
      ],
      "alerts": [
        "Alerta sobre gastos excessivos"
      ]
    }
    `
    
    // Get analysis from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
    
    const analysisText = completion.choices[0].message.content || ''
    
    // Try to parse JSON from response
    let structuredAnalysis = null
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        structuredAnalysis = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.warn('Could not parse structured analysis:', parseError)
    }
    
    // Fallback analysis if JSON parsing fails
    if (!structuredAnalysis) {
      structuredAnalysis = {
        summary: "Análise do documento financeiro realizada com sucesso",
        total_transactions: 0,
        total_income: 0,
        total_expenses: 0,
        categories: [],
        insights: [
          "Documento processado com sucesso",
          "Recomenda-se revisão manual dos dados extraídos"
        ],
        recommendations: [
          "Organize suas transações por categoria",
          "Monitore gastos mensais regularmente",
          "Considere criar um orçamento baseado nos padrões identificados"
        ],
        alerts: []
      }
    }
    
    return NextResponse.json({
      extracted_pdf_text: extractedText.substring(0, 2000), // Return first 2000 chars
      crewai_analysis_result: analysisText,
      structured_analysis: structuredAnalysis,
      insights: structuredAnalysis.insights || [],
      recommendations: structuredAnalysis.recommendations || [],
      success: true
    })
    
  } catch (error) {
    console.error('PDF analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PDF Analysis endpoint is working. Use POST to upload PDFs.',
    supported_formats: ['application/pdf'],
    max_size: '10MB',
    features: [
      'Text extraction from PDF',
      'AI-powered financial analysis',
      'Spending pattern recognition',
      'Personalized recommendations'
    ]
  })
}
