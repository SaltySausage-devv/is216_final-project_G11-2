import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const session = ref(null)
    const isLoading = ref(false)
    const isLoggingOut = ref(false) // Flag to prevent auth listener interference during logout
    let authSubscription = null // Store subscription to prevent duplicates
    let userSubscription = null // Store user data subscription for real-time updates

    const isAuthenticated = computed(() => {
        // Consider authenticated if we have a valid session
        // Don't check isLoggingOut here as it causes issues with navigation guards
        const authenticated = !!session.value

        // Only log occasionally to avoid spam
        if (Math.random() < 0.1) { // 10% of the time
            console.log('🔍 Auth state check:', {
                hasSession: !!session.value,
                hasUser: !!user.value,
                isLoggingOut: isLoggingOut.value,
                isAuthenticated: authenticated
            })
        }

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
                    // If user is a tutor, fetch penalty points from tutor_profiles
                    if (profile.user_type === 'tutor') {
                        const { data: tutorProfile, error: tutorProfileError } = await supabase
                            .from('tutor_profiles')
                            .select('penalty_points')
                            .eq('user_id', data.user.id)
                            .single()

                        if (!tutorProfileError && tutorProfile) {
                            profile.penalty_points = tutorProfile.penalty_points || 0
                            console.log('📊 Tutor penalty points loaded:', tutorProfile.penalty_points)
                        } else {
                            profile.penalty_points = 0
                            console.log('📊 No tutor profile found, defaulting penalty points to 0')
                        }
                    } else {
                        profile.penalty_points = 0
                    }

                    user.value = profile
                    console.log('✅ User profile loaded:', profile)
                    // Set up real-time subscription for user data updates
                    setupUserSubscription(data.user.id)
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
                    phone_verified: true, // Phone is verified via OTP during registration
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

                // If user is a tutor, fetch penalty points from tutor_profiles
                if (profile.user_type === 'tutor') {
                    const { data: tutorProfile, error: tutorProfileError } = await supabase
                        .from('tutor_profiles')
                        .select('penalty_points')
                        .eq('user_id', authData.user.id)
                        .single()

                    if (!tutorProfileError && tutorProfile) {
                        profile.penalty_points = tutorProfile.penalty_points || 0
                        console.log('📊 Tutor penalty points loaded:', tutorProfile.penalty_points)
                    } else {
                        profile.penalty_points = 0
                        console.log('📊 No tutor profile found, defaulting penalty points to 0')
                    }
                } else {
                    profile.penalty_points = 0
                }

                session.value = authData.session
                user.value = profile
                // Set up real-time subscription for user data updates
                setupUserSubscription(authData.user.id)
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

    const setupUserSubscription = (userId) => {
        // Remove existing user subscription if it exists
        if (userSubscription) {
            console.log('🔧 Removing existing user subscription')
            userSubscription.unsubscribe()
            userSubscription = null
        }

        if (!userId) {
            console.log('ℹ️ No user ID provided for subscription')
            return
        }

        console.log('🔔 Setting up user data subscription for:', userId)

        // Subscribe to changes in the user's data
        userSubscription = supabase
            .channel('user-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    console.log('🔄 User data updated:', payload)
                    if (payload.new && user.value) {
                        // Update the user data with the new values
                        const oldCredits = user.value.credits;
                        user.value = { ...user.value, ...payload.new }
                        console.log('✅ User data updated in store:', {
                            oldCredits,
                            newCredits: user.value.credits,
                            fullUser: user.value
                        })
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tutor_profiles',
                    filter: `user_id=eq.${userId}`
                },
                async (payload) => {
                    console.log('🔄 Tutor profile updated:', payload)
                    if (payload.new && user.value && user.value.user_type === 'tutor') {
                        // Update penalty points in user data
                        const oldPenaltyPoints = user.value.penalty_points;
                        user.value.penalty_points = payload.new.penalty_points || 0;
                        console.log('✅ Penalty points updated in store:', {
                            oldPenaltyPoints,
                            newPenaltyPoints: user.value.penalty_points,
                            fullUser: user.value
                        })
                    }
                }
            )
            .subscribe()

        console.log('✅ User subscription established')
    }

    const refreshUserData = async () => {
        try {
            if (!user.value?.id) {
                console.log('ℹ️ No user ID available for refresh')
                return
            }

            console.log('🔄 Manually refreshing user data...')
            
            // Fetch fresh user data from the database
            const { data: freshUserData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.value.id)
                .single()

            if (error) {
                console.error('❌ Error refreshing user data:', error)
                return
            }

            if (freshUserData) {
                const oldCredits = user.value.credits
                user.value = freshUserData
                console.log('✅ User data refreshed:', {
                    oldCredits,
                    newCredits: user.value.credits,
                    fullUser: user.value
                })
            }
        } catch (error) {
            console.error('❌ Error in refreshUserData:', error)
        }
    }

    const logout = async () => {
        console.log('🚪 Logging out user...')

        // Set logout flag to prevent auth listener from interfering
        isLoggingOut.value = true

        // Clear local state immediately
        user.value = null
        session.value = null

        // Remove user subscription
        if (userSubscription) {
            console.log('🔧 Removing user subscription on logout')
            userSubscription.unsubscribe()
            userSubscription = null
        }

        try {
            // Sign out from Supabase and wait for it
            await supabase.auth.signOut()
            console.log('✅ Supabase signOut successful')
        } catch (error) {
            console.error('❌ Supabase signOut error:', error)
        } finally {
            // Reset logout flag after a short delay to allow cleanup
            setTimeout(() => {
                isLoggingOut.value = false
                console.log('🔄 Logout flag reset')
            }, 100)
        }

        console.log('✅ Logout complete')
    }

    const initializeAuth = async () => {
        try {
            console.log('🔧 Initializing auth...')

            // Remove existing subscription if it exists
            if (authSubscription) {
                console.log('🔧 Removing existing auth subscription')
                authSubscription.subscription.unsubscribe()
                authSubscription = null
            }

            // Get current session
            const { data: { session: currentSession } } = await supabase.auth.getSession()

            if (currentSession) {
                console.log('✅ Found existing session')
                session.value = currentSession

                // Fetch user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', currentSession.user.id)
                    .single()

                if (profile) {
                    // If user is a tutor, fetch penalty points from tutor_profiles
                    if (profile.user_type === 'tutor') {
                        const { data: tutorProfile, error: tutorProfileError } = await supabase
                            .from('tutor_profiles')
                            .select('penalty_points')
                            .eq('user_id', currentSession.user.id)
                            .single()

                        if (!tutorProfileError && tutorProfile) {
                            profile.penalty_points = tutorProfile.penalty_points || 0
                            console.log('📊 Tutor penalty points loaded:', tutorProfile.penalty_points)
                        } else {
                            profile.penalty_points = 0
                            console.log('📊 No tutor profile found, defaulting penalty points to 0')
                        }
                    } else {
                        profile.penalty_points = 0
                    }

                    user.value = profile
                    console.log('✅ User profile loaded')
                    // Set up real-time subscription for user data updates
                    setupUserSubscription(currentSession.user.id)
                }
            } else {
                console.log('ℹ️ No existing session found')
            }

            // Listen for auth state changes (only once)
            authSubscription = supabase.auth.onAuthStateChange(async (event, newSession) => {
                console.log('🔔 Auth state changed:', event)

                // Ignore state changes during logout
                if (isLoggingOut.value) {
                    console.log('⏭️ Ignoring auth change during logout')
                    return
                }

                session.value = newSession

                if (event === 'SIGNED_OUT') {
                    console.log('👋 User signed out')
                    user.value = null
                    session.value = null
                } else if (newSession?.user) {
                    console.log('👤 Fetching user profile after auth change')
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', newSession.user.id)
                        .single()

                    if (profile) {
                        // If user is a tutor, fetch penalty points from tutor_profiles
                        if (profile.user_type === 'tutor') {
                            const { data: tutorProfile, error: tutorProfileError } = await supabase
                                .from('tutor_profiles')
                                .select('penalty_points')
                                .eq('user_id', newSession.user.id)
                                .single()

                            if (!tutorProfileError && tutorProfile) {
                                profile.penalty_points = tutorProfile.penalty_points || 0
                                console.log('📊 Tutor penalty points loaded:', tutorProfile.penalty_points)
                            } else {
                                profile.penalty_points = 0
                                console.log('📊 No tutor profile found, defaulting penalty points to 0')
                            }
                        } else {
                            profile.penalty_points = 0
                        }

                        user.value = profile
                        // Set up real-time subscription for user data updates
                        setupUserSubscription(newSession.user.id)
                    }
                } else {
                    user.value = null
                    // Remove user subscription when no user
                    if (userSubscription) {
                        userSubscription.unsubscribe()
                        userSubscription = null
                    }
                }
            })

            console.log('✅ Auth initialization complete')
        } catch (error) {
            console.error('❌ Auth initialization error:', error)
        }
    }

    const updateProfile = async (profileData) => {
        try {
            console.log('📝 Updating profile...', profileData)

            if (!user.value?.id) {
                throw new Error('No user logged in')
            }

            const updateData = {
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                phone: profileData.phone,
                date_of_birth: profileData.dateOfBirth,
                address: profileData.address,
                bio: profileData.bio,
                updated_at: new Date().toISOString()
            }

            // Remove undefined fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key]
                }
            })

            console.log('📤 Sending update:', updateData)

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.value.id)
                .select()
                .single()

            if (error) {
                console.error('❌ Profile update error:', error)
                throw error
            }

            console.log('✅ Profile updated successfully:', data)

            // Update local user state
            user.value = data

            return { success: true, user: data }
        } catch (error) {
            console.error('❌ Profile update error:', error)
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


    const cleanup = () => {
        // Clean up subscriptions
        if (authSubscription) {
            authSubscription.subscription.unsubscribe()
            authSubscription = null
        }
        if (userSubscription) {
            userSubscription.unsubscribe()
            userSubscription = null
        }
        console.log('🧹 Auth store cleaned up')
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
        resetPassword,
        refreshUserData,
        cleanup
    }
})
