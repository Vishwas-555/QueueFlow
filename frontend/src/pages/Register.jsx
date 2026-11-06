import { useState } from "react"

function Register() {
  const [formData,setFormData]= useState({
    name:'',
    email:'',
    password:'',
    confirmPassword:'',
  })
  const [message,setMessage]=useState('')
  const [isError,setIsError]=useState(false)
  const [isLoading,setIsLoading]=useState(false)

  function handleChange(event){
    const {name,value}=event.target
    setFormData((prevdata)=>({
      ...prevdata,
      [name]:value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsError(false)
    if(formData.password!==formData.confirmPassword){
      setIsError(true)
      setMessage('Passwords Do Not Match')
      return
    }
    setIsLoading(true)
    try{
      const response=await fetch(
        'http://localhost:5000/api/v1/auth/register',
        {
          method:'POST',
          headers:{
            'Content-Type': 'application/json',
          },
          body:JSON.stringify({
            name:formData.name,
            email: formData.email,
            password: formData.password,
          }),
        },
      )
      const result=await response.json()
      if(!response.ok){
        throw new Error(result.message || 'Registration Failed')
      }
      setIsError(false)
      setMessage('Registration Successful! You can Login.')
      setFormData({
        name:'',
        email:'',
        password:'',
        confirmPassword:'',
      })
    }catch(error){
      setIsError(true)
      setMessage(error.message || 'Unable To Connect Server, Try Again')
    }finally{
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <a href="/" className="text-2xl font-bold text-blue-600">
          QueueFlow
        </a>

        <h1 className="mt-8 text-3xl font-bold text-slate-900">
          Create your account
        </h1>

        <p className="mt-2 text-slate-600">
          Join QueueFlow and spend less time waiting.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Full name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3" required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 " required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 " required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 " required
            />
          </div>
          
          <button
            type="submit" disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        {message && (
          <div
            role="status"
            className={`mt-4 rounded-lg p-3 text-sm ${
              isError
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message}
          </div>
        )}
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Login
          </a>
        </p>

        <p className="mt-4 text-center text-sm">
          <a href="/" className="text-slate-500 hover:text-blue-600">
            ← Back to home
          </a>
        </p>
      </div>
    </div>
  )
}

export default Register