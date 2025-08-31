import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '../ocr/route'
import { NextRequest } from 'next/server'

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue(JSON.stringify({
            amount: 25.50,
            description: 'Restaurante ABC',
            date: '2024-01-15',
            category: 'Alimentação',
            confidence: 0.95
          }))
        }
      })
    })
  }))
}))

describe('/api/ocr', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock environment variable
    process.env.GOOGLE_AI_API_KEY = 'test-api-key'
  })

  describe('GET', () => {
    it('should return endpoint information', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('OCR endpoint is working')
      expect(data.supported_formats).toContain('image/jpeg')
      expect(data.supported_formats).toContain('image/png')
      expect(data.supported_formats).toContain('image/webp')
    })
  })

  describe('POST', () => {
    it('should return error when no file is provided', async () => {
      const formData = new FormData()
      const request = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('should return error when file is not an image', async () => {
      const formData = new FormData()
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File must be an image')
    })

    it('should return error when API key is not configured', async () => {
      delete process.env.GOOGLE_AI_API_KEY

      const formData = new FormData()
      const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Google AI API key not configured')
    })

    it('should process image successfully', async () => {
      const formData = new FormData()
      const file = new File(['test image'], 'receipt.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.extracted_text).toBeDefined()
      expect(data.structured_data).toBeDefined()
      expect(data.structured_data.amount).toBe(25.50)
      expect(data.structured_data.description).toBe('Restaurante ABC')
      expect(data.structured_data.category).toBe('Alimentação')
    })

    it('should handle AI processing errors gracefully', async () => {
      // Mock AI to throw error
      vi.mocked(vi.importActual('@google/generative-ai')).GoogleGenerativeAI = vi.fn().mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('AI processing failed'))
        })
      }))

      const formData = new FormData()
      const file = new File(['test image'], 'receipt.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process image')
      expect(data.details).toBe('AI processing failed')
    })

    it('should provide fallback data when JSON parsing fails', async () => {
      // Mock AI to return non-JSON response
      vi.mocked(vi.importActual('@google/generative-ai')).GoogleGenerativeAI = vi.fn().mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: vi.fn().mockReturnValue('Restaurante XYZ - R$ 45,00 - 15/01/2024')
            }
          })
        })
      }))

      const formData = new FormData()
      const file = new File(['test image'], 'receipt.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.structured_data).toBeDefined()
      expect(data.structured_data.amount).toBeGreaterThan(0)
      expect(data.structured_data.description).toBeTruthy()
      expect(data.structured_data.confidence).toBe(0.7)
    })
  })
})
