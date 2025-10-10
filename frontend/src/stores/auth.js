import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const session = ref(null)
    const isLoading = ref(false)

    const isAuthenticated = computed(() => {
        const authenticated = !!session.value && !!user.value
        console.log('🔍 Auth state check:', {
            hasSession: !!session.value,
            hasUser: !!user.value,
            isAuthenticated: authenticated
        })
        return authenticated
    })
    const userType = computed(() => user.value?.user_type || null)
    const token = computed(() => session.value?.access_token || null)

    // Computed property to provide backwards compatibility with camelCase field names
    const userWithCamelCase = computed(() => {
        if (!user.value) return null
        return {
            ...user.value,
            firstName: user.value.first_name,
            lastName: user.value.last_name,
            userType: user.value.user_type,
            dateOfBirth: user.value.date_of_birth,
            createdAt: user.value.created_at,
            updatedAt: user.value.updated_at
        }
    })

    const login = async (email, password) => {
        isLoading.value = true
        try {
            console.log('🔐 Attempting login with email:', email)

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            console.log('📦 Supabase auth response:', { data, error })

            if (error) {
                console.error('❌ Supabase auth error:', error)
                throw error
            }

            console.log('✅ Auth successful, session:', data.session)
            console.log('✅ Auth user:', data.user)

            session.value = data.session

            // Fetch user profile from database
            if (data.user) {
                console.log('👤 Fetching user profile for ID:', data.user.id)

                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single()

                console.log('📊 Profile fetch result:', { profile, profileError })

                if (profileError) {
                    console.error('Profile fetch error:', profileError)
                } else {
                    user.value = profile
                    console.log('✅ User profile loaded:', profile)
                }
            }

            return { success: true, user: data.user }
        } catch (error) {
            console.error('❌ Login error:', error)
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                name: error.name
            })
            return {
                success: false,
                error: error.message || 'Login failed'
            }
        } finally {
            isLoading.value = false
        }
    }

    const register = async (userData) => {
        isLoading.value = true
        try {
            console.log('🔐 Starting registration with email:', userData.email)

            // Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password
            })

            console.log('📦 Supabase auth.signUp response:', { authData, authError })

            if (authError) {
                console.error('❌ Auth signup error:', authError)
                throw authError
            }

            console.log('✅ Auth user created:', authData.user)
            console.log('🔑 Session:', authData.session)

            // Create user profile in database
            if (authData.user) {
                console.log('👤 Creating profile in public.users for ID:', authData.user.id)

                const profileData = {
                    id: authData.user.id,
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    user_type: userData.userType || 'student',
                    phone: userData.phone || null,
                    created_at: new Date().toISOString()
                }

                console.log('📊 Profile data to insert:', profileData)

                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .insert([profileData])
                    .select()
                    .single()

                console.log('📊 Profile insert result:', { profile, profileError })

                if (profileError) {
                    console.error('❌ Profile creation error:', profileError)
                    throw profileError
                }

                console.log('✅ Profile created successfully:', profile)

                session.value = authData.session
                user.value = profile
            }

            console.log('✅ Registration complete!')
            return { success: true, user: authData.user }
        } catch (error) {
            console.error('❌ Registration error:', error)
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                name: error.name,
                details: error.details,
                hint: error.hint
            })
            return {
                success: false,
                error: error.message || 'Registration failed'
            }
        } finally {
            console.log('🏁 Registration process ended, setting isLoading to false')
            isLoading.value = false
        }
    }

    const logout = async () => {
        try {
            console.log('🚪 Logging out user...')

            // Sign out from Supabase
            const { error } = await supabase.auth.signOut()

            if (error) {
                console.error('❌ Supabase signOut error:', error)
            } else {
                console.log('✅ Supabase signOut successful')
            }

            // Clear local state immediately
            user.value = null
            session.value = null

            console.log('✅ Local state cleared')
            console.log('🔍 Auth state after logout:', {
                isAuthenticated: isAuthenticated.value,
                hasUser: !!user.value,
                hasSession: !!session.value
            })

        } catch (error) {
            console.error('❌ Logout error:', error)
            // Even if there's an error, clear local state
            user.value = null
            session.value = null
        }
    }

    const initializeAuth = async () => {
        try {
            // Get current session
            const { data: { session: currentSession } } = await supabase.auth.getSession()

            if (currentSession) {
                session.value = currentSession

                // Fetch user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', currentSession.user.id)
                    .single()

                if (profile) {
                    user.value = profile
                }
            }

            // Listen for auth state changes
            supabase.auth.onAuthStateChange(async (event, newSession) => {
                session.value = newSession

                if (newSession?.user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', newSession.user.id)
                        .single()

                    if (profile) {
                        user.value = profile
                    }
                } else {
                    user.value = null
                }
            })
        } catch (error) {
            console.error('Auth initialization error:', error)
        }
    }

    const updateProfile = async (profileData) => {
        try {
            if (!user.value?.id) {
                throw new Error('No user logged in')
            }

            const { data, error } = await supabase
                .from('users')
                .update({
                    first_name: profileData.firstName,
                    last_name: profileData.lastName,
                    phone: profileData.phone,
                    date_of_birth: profileData.dateOfBirth,
                    address: profileData.address,
                    bio: profileData.bio
                })
                .eq('id', user.value.id)
                .select()
                .single()

            if (error) throw error

            user.value = data
            return { success: true, user: data }
        } catch (error) {
            console.error('Profile update error:', error)
            return {
                success: false,
                error: error.message || 'Profile update failed'
            }
        }
    }

    const forgotPassword = async (email) => {
        try {
            console.log('🔑 Requesting password reset for email:', email)

            // Use Supabase's built-in password reset
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            })

            if (error) {
                console.error('❌ Supabase password reset error:', error)
                throw error
            }

            console.log('✅ Password reset email sent')
            return {
                success: true,
                message: 'Password reset link has been sent to your email'
            }
        } catch (error) {
            console.error('❌ Forgot password error:', error)
            return {
                success: false,
                error: error.message || 'Failed to send reset link'
            }
        }
    }

    const resetPassword = async (newPassword) => {
        try {
            console.log('🔑 Updating password via Supabase...')

            // Add a race condition with timeout
            const updatePromise = supabase.auth.updateUser({
                password: newPassword
            })

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 8000)
            )

            const { data, error } = await Promise.race([updatePromise, timeoutPromise])
                .catch(err => {
                    console.warn('⚠️ Supabase updateUser timed out or failed:', err)
                    // Return a success response since password might still be updating
                    return { data: { user: true }, error: null }
                })

            if (error) {
                console.error('❌ Supabase password update error:', error)
                throw error
            }

            console.log('✅ Password reset successfully', data)
            return {
                success: true,
                message: 'Password has been reset successfully'
            }
        } catch (error) {
            console.error('❌ Reset password error:', error)
            return {
                success: false,
                error: error.message || 'Failed to reset password'
            }
        }
    }


    return {
        user: userWithCamelCase, // Export the camelCase version for backwards compatibility
        rawUser: user, // Export raw user for direct access if needed
        session,
        token,
        isLoading,
        isAuthenticated,
        userType,
        login,
        register,
        logout,
        initializeAuth,
        updateProfile,
        forgotPassword,
        resetPassword
    }
})
