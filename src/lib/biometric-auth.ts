// Biometric Authentication using WebAuthn API
export interface BiometricCredential {
  id: string
  publicKey: ArrayBuffer
  counter: number
  createdAt: Date
  lastUsed: Date
  deviceInfo: {
    platform: string
    userAgent: string
    name: string
  }
}

export interface BiometricAuthOptions {
  challenge?: ArrayBuffer
  timeout?: number
  userVerification?: UserVerificationRequirement
  authenticatorSelection?: AuthenticatorSelectionCriteria
}

export interface BiometricAuthResult {
  success: boolean
  credential?: BiometricCredential
  error?: string
  fallbackToPin?: boolean
}

class BiometricAuthManager {
  private static instance: BiometricAuthManager
  private isSupported: boolean = false
  private credentials: Map<string, BiometricCredential> = new Map()

  private constructor() {
    this.checkSupport()
    this.loadCredentials()
  }

  static getInstance(): BiometricAuthManager {
    if (!BiometricAuthManager.instance) {
      BiometricAuthManager.instance = new BiometricAuthManager()
    }
    return BiometricAuthManager.instance
  }

  private checkSupport(): void {
    this.isSupported = !!(
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === 'function' &&
      typeof navigator.credentials.get === 'function'
    )
  }

  private loadCredentials(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('biometric_credentials')
      if (stored) {
        const parsed = JSON.parse(stored)
        Object.entries(parsed).forEach(([id, cred]: [string, any]) => {
          this.credentials.set(id, {
            ...cred,
            publicKey: this.base64ToArrayBuffer(cred.publicKey),
            createdAt: new Date(cred.createdAt),
            lastUsed: new Date(cred.lastUsed)
          })
        })
      }
    } catch (error) {
      console.error('Failed to load biometric credentials:', error)
    }
  }

  private saveCredentials(): void {
    if (typeof window === 'undefined') return

    try {
      const toSave: Record<string, any> = {}
      this.credentials.forEach((cred, id) => {
        toSave[id] = {
          ...cred,
          publicKey: this.arrayBufferToBase64(cred.publicKey),
          createdAt: cred.createdAt.toISOString(),
          lastUsed: cred.lastUsed.toISOString()
        }
      })
      localStorage.setItem('biometric_credentials', JSON.stringify(toSave))
    } catch (error) {
      console.error('Failed to save biometric credentials:', error)
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return array.buffer
  }

  private getDeviceInfo() {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      name: this.getDeviceName()
    }
  }

  private getDeviceName(): string {
    const userAgent = navigator.userAgent
    
    if (/iPhone/.test(userAgent)) return 'iPhone'
    if (/iPad/.test(userAgent)) return 'iPad'
    if (/Android/.test(userAgent)) return 'Android Device'
    if (/Windows/.test(userAgent)) return 'Windows PC'
    if (/Mac/.test(userAgent)) return 'Mac'
    if (/Linux/.test(userAgent)) return 'Linux PC'
    
    return 'Unknown Device'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isSupported) return false

    try {
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch (error) {
      console.error('Error checking biometric availability:', error)
      return false
    }
  }

  async register(userId: string, userName: string, options: BiometricAuthOptions = {}): Promise<BiometricAuthResult> {
    if (!this.isSupported) {
      return { success: false, error: 'Biometric authentication not supported', fallbackToPin: true }
    }

    try {
      const challenge = options.challenge || this.generateChallenge()
      
      const createOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: 'Gestor Financeiro',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userName,
            displayName: userName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: options.userVerification || 'required',
            requireResidentKey: false,
            ...options.authenticatorSelection
          },
          timeout: options.timeout || 60000,
          attestation: 'direct'
        }
      }

      const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential

      if (!credential) {
        return { success: false, error: 'Failed to create credential', fallbackToPin: true }
      }

      const response = credential.response as AuthenticatorAttestationResponse
      const biometricCred: BiometricCredential = {
        id: credential.id,
        publicKey: response.getPublicKey()!,
        counter: 0,
        createdAt: new Date(),
        lastUsed: new Date(),
        deviceInfo: this.getDeviceInfo()
      }

      this.credentials.set(credential.id, biometricCred)
      this.saveCredentials()

      return { success: true, credential: biometricCred }

    } catch (error: any) {
      console.error('Biometric registration failed:', error)
      
      let errorMessage = 'Registration failed'
      let fallbackToPin = true

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled or not allowed'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication not supported on this device'
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error during biometric registration'
      } else if (error.name === 'AbortError') {
        errorMessage = 'Biometric registration was aborted'
        fallbackToPin = false
      }

      return { success: false, error: errorMessage, fallbackToPin }
    }
  }

  async authenticate(options: BiometricAuthOptions = {}): Promise<BiometricAuthResult> {
    if (!this.isSupported) {
      return { success: false, error: 'Biometric authentication not supported', fallbackToPin: true }
    }

    if (this.credentials.size === 0) {
      return { success: false, error: 'No biometric credentials registered', fallbackToPin: true }
    }

    try {
      const challenge = options.challenge || this.generateChallenge()
      const allowCredentials = Array.from(this.credentials.keys()).map(id => ({
        id: new TextEncoder().encode(id),
        type: 'public-key' as const
      }))

      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials,
          userVerification: options.userVerification || 'required',
          timeout: options.timeout || 60000
        }
      }

      const credential = await navigator.credentials.get(getOptions) as PublicKeyCredential

      if (!credential) {
        return { success: false, error: 'Authentication failed', fallbackToPin: true }
      }

      // Update last used timestamp
      const storedCred = this.credentials.get(credential.id)
      if (storedCred) {
        storedCred.lastUsed = new Date()
        this.credentials.set(credential.id, storedCred)
        this.saveCredentials()
      }

      return { success: true, credential: storedCred }

    } catch (error: any) {
      console.error('Biometric authentication failed:', error)
      
      let errorMessage = 'Authentication failed'
      let fallbackToPin = true

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled or failed'
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error during authentication'
      } else if (error.name === 'AbortError') {
        errorMessage = 'Authentication was aborted'
        fallbackToPin = false
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Invalid authentication state'
      }

      return { success: false, error: errorMessage, fallbackToPin }
    }
  }

  async removeCredential(credentialId: string): Promise<boolean> {
    try {
      this.credentials.delete(credentialId)
      this.saveCredentials()
      return true
    } catch (error) {
      console.error('Failed to remove credential:', error)
      return false
    }
  }

  async removeAllCredentials(): Promise<boolean> {
    try {
      this.credentials.clear()
      localStorage.removeItem('biometric_credentials')
      return true
    } catch (error) {
      console.error('Failed to remove all credentials:', error)
      return false
    }
  }

  getRegisteredCredentials(): BiometricCredential[] {
    return Array.from(this.credentials.values())
  }

  hasRegisteredCredentials(): boolean {
    return this.credentials.size > 0
  }

  getSupport(): {
    isSupported: boolean
    features: {
      webauthn: boolean
      platformAuthenticator: boolean
      userVerification: boolean
    }
  } {
    return {
      isSupported: this.isSupported,
      features: {
        webauthn: !!(window.PublicKeyCredential),
        platformAuthenticator: !!(window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable),
        userVerification: true // Assume supported if WebAuthn is available
      }
    }
  }
}

// Export singleton instance
export const biometricAuth = BiometricAuthManager.getInstance()

// PIN fallback system
export class PinAuthManager {
  private static instance: PinAuthManager
  private pinHash: string | null = null

  private constructor() {
    this.loadPin()
  }

  static getInstance(): PinAuthManager {
    if (!PinAuthManager.instance) {
      PinAuthManager.instance = new PinAuthManager()
    }
    return PinAuthManager.instance
  }

  private loadPin(): void {
    if (typeof window === 'undefined') return
    this.pinHash = localStorage.getItem('pin_hash')
  }

  private async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin + 'gestor_financeiro_salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async setPin(pin: string): Promise<boolean> {
    if (pin.length < 4 || pin.length > 8) {
      return false
    }

    try {
      this.pinHash = await this.hashPin(pin)
      localStorage.setItem('pin_hash', this.pinHash)
      return true
    } catch (error) {
      console.error('Failed to set PIN:', error)
      return false
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    if (!this.pinHash) return false

    try {
      const inputHash = await this.hashPin(pin)
      return inputHash === this.pinHash
    } catch (error) {
      console.error('Failed to verify PIN:', error)
      return false
    }
  }

  hasPin(): boolean {
    return !!this.pinHash
  }

  removePin(): boolean {
    try {
      this.pinHash = null
      localStorage.removeItem('pin_hash')
      return true
    } catch (error) {
      console.error('Failed to remove PIN:', error)
      return false
    }
  }
}

export const pinAuth = PinAuthManager.getInstance()
