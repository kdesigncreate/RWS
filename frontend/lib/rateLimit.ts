// Supabase-based Rate Limiting for Serverless Environment
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface RateLimitRecord {
  id?: string
  ip: string
  endpoint: string
  requests: number
  window_start: string
  created_at?: string
  updated_at?: string
}

// Type for Supabase error responses
interface SupabaseError {
  code?: string
  message?: string
}

// Type for Supabase query responses
interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (ip: string, endpoint: string) => string
}

export class SupabaseRateLimit {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async isRateLimited(ip: string, endpoint: string): Promise<{
    isLimited: boolean
    remaining: number
    resetTime: Date
  }> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.windowMs)
    
    try {
      // Get or create rate limit record
      const response = await supabase
        .from('rate_limits')
        .select('*')
        .eq('ip', ip)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .maybeSingle() as SupabaseResponse<RateLimitRecord>

      const { data: existing, error: selectError } = response

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Rate limit check error:', selectError)
        // Fail open - allow request if database error
        return {
          isLimited: false,
          remaining: this.config.maxRequests,
          resetTime: new Date(now.getTime() + this.config.windowMs)
        }
      }

      if (!existing) {
        // Create new record
        const newRecord: RateLimitRecord = {
          ip,
          endpoint,
          requests: 1,
          window_start: now.toISOString()
        }

        const { error: insertError } = await supabase
          .from('rate_limits')
          .insert([newRecord])

        if (insertError) {
          console.error('Rate limit insert error:', insertError)
          // Fail open
          return {
            isLimited: false,
            remaining: this.config.maxRequests - 1,
            resetTime: new Date(now.getTime() + this.config.windowMs)
          }
        }

        return {
          isLimited: false,
          remaining: this.config.maxRequests - 1,
          resetTime: new Date(now.getTime() + this.config.windowMs)
        }
      }

      // Check if limit exceeded
      if (existing.requests >= this.config.maxRequests) {
        return {
          isLimited: true,
          remaining: 0,
          resetTime: new Date(new Date(existing.window_start).getTime() + this.config.windowMs)
        }
      }

      // Increment counter
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ 
          requests: existing.requests + 1,
          updated_at: now.toISOString()
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Rate limit update error:', updateError)
        // Fail open
        return {
          isLimited: false,
          remaining: this.config.maxRequests - existing.requests - 1,
          resetTime: new Date(new Date(existing.window_start).getTime() + this.config.windowMs)
        }
      }

      return {
        isLimited: false,
        remaining: this.config.maxRequests - existing.requests - 1,
        resetTime: new Date(new Date(existing.window_start).getTime() + this.config.windowMs)
      }

    } catch (error) {
      console.error('Rate limit error:', error)
      
      // Check if the error is due to missing table
      if (error instanceof Error && error.message.includes('relation "rate_limits" does not exist')) {
        console.warn('Rate limits table does not exist. Consider creating it for production use.')
        console.warn('SQL: CREATE TABLE rate_limits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ip VARCHAR(45) NOT NULL, endpoint VARCHAR(255) NOT NULL, requests INTEGER NOT NULL DEFAULT 0, window_start TIMESTAMP WITH TIME ZONE NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());')
      }
      
      // Fail open on any error
      return {
        isLimited: false,
        remaining: this.config.maxRequests,
        resetTime: new Date(now.getTime() + this.config.windowMs)
      }
    }
  }

  async cleanupExpired(): Promise<void> {
    const cutoff = new Date(Date.now() - this.config.windowMs)
    
    try {
      await supabase
        .from('rate_limits')
        .delete()
        .lt('window_start', cutoff.toISOString())
    } catch (error) {
      console.error('Rate limit cleanup error:', error)
    }
  }
}

// Default configurations
export const apiRateLimit = new SupabaseRateLimit({
  maxRequests: 200,
  windowMs: 60000 // 1 minute
})

export const adminRateLimit = new SupabaseRateLimit({
  maxRequests: 50,
  windowMs: 60000 // 1 minute
})