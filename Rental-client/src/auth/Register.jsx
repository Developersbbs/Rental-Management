import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { selectEmail, selectUsername, selectPassword, setEmail, setUsername, setPassword }
  from '../redux/features/auth/registerSlice'

import authServices from '../services/authServices'
import { toast } from 'react-toastify'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const username = useSelector(selectUsername)
  const email = useSelector(selectEmail)
  const password = useSelector(selectPassword)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    if (isLoading) return // Prevent multiple clicks during loading

    setIsLoading(true)

    try {
      const response = await authServices.register({ username, email, password })

      if (response.status === 201) {
        toast.success('Registration successful')
      }

      // Clear the form
      dispatch(setUsername(''))
      dispatch(setEmail(''))
      dispatch(setPassword(''))

      // Redirect to login page
      setTimeout(() => {
        navigate('/login')
      }, 500)
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Something went wrong'
      toast.error(`Registration error: ${message}`)
    } finally {
      // Show loading for minimum 5 seconds for better UX feedback
      setTimeout(() => {
        setIsLoading(false)
      }, 5000)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-3xl bg-card backdrop-blur shadow-2xl border border-border">
          <div className="grid gap-0 md:grid-cols-[14rem,1fr]">
            <div className="hidden md:flex flex-col justify-between bg-primary p-8 text-primary-foreground">
              <div className="space-y-4">



              </div>

            </div>

            <div className="px-8 py-10 space-y-8">
              <div className="text-center space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
                  🧾
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Create your account
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-medium text-primary hover:text-primary/90 underline-offset-4 hover:underline"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleRegister}>
                <div className="space-y-5">
                  <div className="space-y-2 text-left">
                    <label htmlFor="name" className="text-sm font-medium text-slate-700">
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={username}
                      onChange={(e) => dispatch(setUsername(e.target.value))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => dispatch(setEmail(e.target.value))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => dispatch(setPassword(e.target.value))}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition"
                        placeholder="Create a secure password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-primary hover:text-primary/80 focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-left">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600">
                    I agree to the{' '}
                    <a href="#" className="font-medium text-primary hover:text-primary/90 underline-offset-4 hover:underline">
                      Terms and Conditions
                    </a>{' '}
                    and confirm that I have read the privacy policy.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${isLoading
                    ? 'bg-muted cursor-not-allowed opacity-70'
                    : 'bg-primary shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating account...</span>
                      </>
                    ) : (
                      'Register'
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register