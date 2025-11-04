/**
 * Debug utility to check authentication status
 * Use this in browser console to diagnose RLS issues
 */

import { supabase } from '../lib/supabase'

export async function debugAuth() {
  console.group('🔍 Auth Debug Info')
  
  try {
    // Check session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('📋 Session:', sessionData.session ? '✅ Active' : '❌ No session')
    if (sessionError) {
      console.error('Session Error:', sessionError)
    }
    
    // Check user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('👤 User:', userData.user ? '✅ Authenticated' : '❌ Not authenticated')
    if (userData.user) {
      console.log('   User ID:', userData.user.id)
      console.log('   Email:', userData.user.email)
      console.log('   Username:', userData.user.user_metadata?.username)
    }
    if (userError) {
      console.error('User Error:', userError)
    }
    
    // Check if we can query decks
    console.log('\n📊 Testing deck query...')
    const { data: decksData, error: decksError } = await supabase
      .from('decks')
      .select('count')
      .limit(1)
    
    if (decksError) {
      console.error('❌ Deck query failed:', decksError.message)
    } else {
      console.log('✅ Deck query successful')
    }
    
    // Test insert (will rollback)
    console.log('\n📝 Testing deck creation...')
    if (userData.user) {
      const { data: insertData, error: insertError } = await supabase
        .from('decks')
        .insert({
          owner_id: userData.user.id,
          title: 'Debug Test Deck (will be deleted)',
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Insert failed:', insertError.message)
        console.error('   Error details:', insertError)
        
        if (insertError.message.includes('row-level security')) {
          console.log('\n⚠️  RLS Policy Issue Detected!')
          console.log('   Solutions:')
          console.log('   1. Run supabase_schema_fixed.sql in SQL Editor')
          console.log('   2. Sign out and sign back in')
          console.log('   3. Check RLS_FIX_GUIDE.md for more help')
        }
      } else {
        console.log('✅ Insert successful! Test deck created:', insertData?.id)
        // Clean up test deck
        if (insertData?.id) {
          await supabase.from('decks').delete().eq('id', insertData.id)
          console.log('✅ Test deck deleted')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
  
  console.groupEnd()
  console.log('\n📖 For more help, see RLS_FIX_GUIDE.md')
}

// Make it available globally in development
if (import.meta.env.DEV) {
  ;(window as any).debugAuth = debugAuth
  console.log('💡 Debug utility loaded! Run debugAuth() in console to diagnose issues.')
}

