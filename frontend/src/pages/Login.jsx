import { useState } from 'react'
function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    function handleChange(event) {
    const { name, value } = event.target
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }
   async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/v1/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Login failed.')
      }

      localStorage.setItem('token', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))

      if (result.data.user.role === 'ADMIN') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      setMessage(error.message || 'Unable to connect to the server.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen px-4 py-12">
        <div className="bg-white mx-auto max-w-md w-full p-8 border border-slate-200 shadow-sm rounded-2xl">
            <a href="/" className="text-xl font-semibold text-blue-600">
                QueueFlow
            </a>
            <h1 className="font-bold text-black text-2xl mt-4">
                Welcome Back!
            </h1>
            <p className="text-slate-600 mt-2">
                Sign in to manage your queue
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label htmlFor="email" className="font-bold mb-2 block">
                Email Address 
            </label>
            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange}
            placeholder="example@gmail.com"
            className="border border-slate-400 rounded-lg px-4 py-3 w-full" required/>   
            
             <label htmlFor="password" className="font-bold mb-2 block">
                Password 
            </label>
            <input id="password" type="password" name="password" value={formData.password} onChange={handleChange}
            placeholder="Enter Your Password"
            className="border border-slate-400 rounded-lg px-4 py-3 w-full" required/>   
            
            <button type="submit" disabled={isLoading} className="text-xl text-white bg-blue-600 px-4 py-3 rounded-lg w-full">
                {isLoading? 'Logging In...' : 'Login'}
            </button>
            </form>
            {message && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                {message}
                </p>
            )}
            <p className="mt-8 text-center">
                Don't Have an Account?{' '} <a href="/register" className="text-blue-600">
                    Register Here
                </a>
            </p>
            <p className="text-center mt-2">
                <a href="/" className="hover:text-blue-500 transition">← Back to home</a>
            </p>
            
        </div>
    </div>
  )
}

export default Login