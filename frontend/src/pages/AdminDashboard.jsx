import { useState,useEffect } from "react";
import {useNavigate} from "react-router"
import socket from "../socket"
import API_URL from '../config'


function AdminDashboard(){
  const navigate=useNavigate()
  const [user, setUser] = useState(null)
  const [services, setServices] = useState([])
  const [activeQueues, setActiveQueues] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingService, setEditingService] = useState(null)
  const [deactivatingServiceId, setDeactivatingServiceId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [activeSessions, setActiveSessions] = useState([])
  const [startingServiceId, setStartingServiceId] = useState(null)
  const [queueActionError, setQueueActionError] = useState('')
  const [servicesError, setServicesError] = useState('')
  const [queuesError, setQueuesError] = useState('')

    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')


    useEffect(() => {
    if (!token || !storedUser) {
        navigate('/login')
        return
    }

    try {
    const parsedUser = JSON.parse(storedUser)
    if (parsedUser.role !== 'ADMIN') {
      navigate('/dashboard')
      return
    }
    setUser(parsedUser)
    } catch {
        localStorage.removeItem('user')
        navigate('/login')
    }
    }, [navigate, token, storedUser])

    const [loading, setLoading] = useState(true)
    const [activeSessionsLoading, setActiveSessionsLoading] = useState(true)
    const [activeSessionsError, setActiveSessionsError] = useState('')

    
const fetchDashboardData = async () => {
  setLoading(true)
  setServicesError('')
  setQueuesError('')
  setActiveSessionsLoading(true)
  setActiveSessionsError('')

  try {
    const results = await Promise.allSettled([

      fetch(`${API_URL}/api/v1/services`)
        .then(async (response) => {
          const result = await response.json()
          if (!response.ok || !result.success) {
            throw new Error('Unable to load services.')
          }
          return result.data
        }),

        fetch(`${API_URL}/api/v1/queues/active-count`)
        .then(async (response) => {
          const result = await response.json()
          if (!response.ok || !result.success) {
            throw new Error('Unable to load active queues.')
          }
          return result.data.active_queues
        }),
      fetch(`${API_URL}/api/v1/queues/admin/active-sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (response) => {
          const result = await response.json()
          if (!response.ok || !result.success) {
            throw new Error('Unable to load active sessions.')
          }
          return result.data
        }),

    ])
    if (results[0].status === 'fulfilled') {
      setServices(results[0].value)
    } else {
      setServicesError(results[0].reason?.message || 'Unable to load services.')
    }
    if (results[1].status === 'fulfilled') {
      setActiveQueues(results[1].value)
    } else {
      setQueuesError(results[1].reason?.message || 'Unable to load active queues.')
    }
    if (results[2].status === 'fulfilled') {
      setActiveSessions(results[2].value)
    } else {
      setActiveSessionsError(
        results[2].reason?.message || 'Unable to load active sessions.'
      )
    }

  }catch (err) {
    const message = err.message || 'Something went wrong.'
    setServicesError(message)
    setQueuesError(message)
    setActiveSessionsError(message)
  }finally {
    setLoading(false)
    setActiveSessionsLoading(false)
  }
}


    useEffect(() => {
    if (!token || !storedUser) return
    try {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role !== 'ADMIN') return
        fetchDashboardData()
    } catch {
    }
    }, [token, storedUser])

    const handleLogout=()=>{
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      socket.disconnect()
      navigate('/login')
    }

    const handleSaveService = async(e) => {
      e.preventDefault()
      setFormError('')

      const duration = Number(estimatedDuration)
      if(!serviceName.trim()){
        setFormError('Service Name is Required')
        return
      }
        if (!Number.isSafeInteger(duration) || duration <= 0) {
          setFormError('Duration must be a positive whole number.')
          return
      }
      try{
        const isEditing=editingService!==null
        setIsCreating(true)
        const response = await fetch(
          isEditing? `${API_URL}/api/v1/services/${editingService.id}` : `${API_URL}/api/v1/services`,{
            method: isEditing? 'PUT' :  'POST',
            headers:{
              'Content-Type':'application/json',
              Authorization: `Bearer ${token}`,
            },
            body:JSON.stringify({
              name: serviceName.trim(),
              description: serviceDescription.trim(),
              estimated_duration: duration,
            }),
          }  
        )
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to create service.')
      } 
      setServiceName('')
      setServiceDescription('')
      setEstimatedDuration('')
      setShowCreateModal(false)
      setEditingService(null)

      await fetchDashboardData()
      }catch (err) {
      setFormError(err.message || 'Something went wrong.')
      } finally {
        setIsCreating(false)
      }
    } 

    const handleDeactivateService = async (service) => {
      const confirmed = window.confirm(`Are you sure you want to deactivate "${service.name}"?`)
      if (!confirmed) return

      try {
        setDeactivatingServiceId(service.id)
        setActionError('')
        const response = await fetch(
          `${API_URL}/api/v1/services/${service.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to deactivate service.')
        }
        await fetchDashboardData()
      } catch (err) {
        setActionError(err.message || 'Something went wrong.')
      } finally {
        setDeactivatingServiceId(null)
      }
    }

    const handleStartQueue = async (service) => {
      try {
        setStartingServiceId(service.id)
        setQueueActionError('')

        const response = await fetch(
          `${API_URL}/api/v1/queues/admin/${service.id}/start`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to start queue.')
        }
        
        await fetchDashboardData()
      } catch (err) {
        setQueueActionError(
          err.message || 'Something went wrong.'
        )
      } finally {
        setStartingServiceId(null)
      }
    }

    return(
        <div className="bg-slate-50 min-h-screen text-slate-900">
            <header className="bg-white border-b border-slate-200">
                <div className="px-6 py-4 mx-auto max-w-7xl flex justify-between items-center">
                   <div>
                        <h1 className="text-2xl font-bold text-blue-700">
                            QueueFlow
                        </h1>

                        <p className="text-sm text-slate-500">
                            Administration Panel
                        </p>
                    </div> 

                    <div className="gap-6 flex">
                    <div className="text-right">
                        <p className="font-semibold text-xl">
                            {user?.name || 'Administrator'}
                        </p>
                        <p className="text-xs text-slate-500">
                            Admin
                        </p> 
                    </div> 
                      <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                        Logout
                        </button> 
                    </div>    
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
            <section className="mb-8">
                <p className="mb-2 text-xl font-semibold uppercase tracking-wider text-blue-600">
                Admin Overview
                </p>
                <div className="flex justify-between">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Welcome, {user?.name ? ` ${user.name}` : ''}!
                    </h2>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    ↻ Refresh
                  </button>
                </div>
                

                <p className="mt-2 text-slate-600">
                Manage your services and monitor queue activity from one place.
                </p>
            </section>
        <section className="mb-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Active Queues
              </p>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
                Live
              </span>
            </div>

            <p className="mt-4 text-4xl font-bold text-slate-900">
              {loading || queuesError ? "—" : activeQueues}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Queue sessions currently running
            </p>
            {queuesError && (
              <p className="mt-2 text-sm text-red-600">
                {queuesError}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Active Services
              </p>
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                Available
              </span>
            </div>

            <p className="mt-4 text-4xl font-bold text-slate-900">
              {loading || servicesError ? "—" : services.length}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Services available to customers
            </p>
          </div>
        </section>
        
        {actionError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}
        {queueActionError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {queueActionError}
            </div>
          )}
        <section className="mt-8">
        <div className="mb-5">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Service Overview
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Review the services currently available in QueueFlow.
              </p>
            </div>
            
            <button onClick={() => {
                setEditingService(null)
                setServiceName('')
                setServiceDescription('')
                setEstimatedDuration('')
                setFormError('')
                setShowCreateModal(true)
            }}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700">
              + Create Service
            </button>
          </div>
            
        </div>


        
        {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading services...
        </div>
        )}
        {!loading && servicesError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {servicesError}
            </div>
          )}
        {!loading && !servicesError && services.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-800">
              No active services available.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Create your first service to get started.
            </p>
          </div>
        )}
        {!loading && !servicesError && services.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
            <article
                key={service.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
                <h4 className="text-lg font-bold text-slate-900">
                {service.name}
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                {service.description || 'No description provided.'}
                </p>
                
                <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Estimated service duration
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-800">
                    {service.estimated_duration} minutes
                </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setEditingService(service)
                      setShowCreateModal(true)
                      setServiceName(service.name)
                      setServiceDescription(service.description || '')
                      setEstimatedDuration(String(service.estimated_duration))
                      setFormError('')
                    }}
                    className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    Edit Service
                  </button>

                  <button
                    onClick={() => handleDeactivateService(service)}
                    disabled={deactivatingServiceId === service.id}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deactivatingServiceId === service.id
                      ? 'Deactivating...'
                      : 'Deactivate'}
                  </button>
                  <button onClick={() => handleStartQueue(service)}
                  disabled={startingServiceId === service.id}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {startingServiceId === service.id ? 'Starting...' : 'Start Queue'}
                </button>
                </div>
            </article>
            ))}
            </div>
            
            )}
            
            </section>

            
          <section className="mt-10">
            <h3 className="mb-4 text-2xl font-bold text-slate-900">
              Active Queue Sessions
            </h3>
            {activeSessionsLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                Loading active sessions...
              </div>
            )}

            {!activeSessionsLoading && activeSessionsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {activeSessionsError}
              </div>
            )}

            {!activeSessionsLoading &&
              !activeSessionsError &&
              activeSessions.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  No active queue sessions.
                </div>
              )}

            {!activeSessionsLoading &&
              !activeSessionsError &&
              activeSessions.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2">
                  {activeSessions.map((session) => (
                    <article
                      key={session.id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <h4 className="text-lg font-bold text-slate-900">
                        {session.service_name || 'Queue Session'}
                      </h4>

                      <p className="mt-2 text-sm text-slate-500">
                        Session ID: {session.id}
                      </p>

                      <p className="mt-2 text-sm font-medium text-emerald-600">
                        Status: {session.status}
                      </p>
                        <button
                          onClick={() => navigate(`/admin/queues/${session.id}`)}
                          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                          Manage Queue
                        </button>
                    </article>
                  ))}
        </div>
    )}

</section>

            <footer className="mt-12 border-t border-slate-200 py-5 text-center text-sm text-slate-500">
          QueueFlow Admin Panel
        </footer>
        </main>
        {showCreateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-2xl max-w-lg w-full bg-white p-6 shadow-xl">
          <h2 className="text-xl font-bold text-slate-900">
            {editingService ? 'Edit Service' : 'Create New Service'}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {editingService ? 'Update the service details.' : 'Add a new service to QueueFlow.'}
          </p>
          <form onSubmit={handleSaveService}>
          <div className="mt-6 space-y-4">

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Service Name
            </label>

            <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)}
              placeholder="Enter service name"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Enter service description" rows={3}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />


          </div>

      </div>
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Estimated Duration (minutes)
        </label>

        <input type="number" min="1" step="1" value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(e.target.value)} placeholder="Example: 15"
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
        />
      </div>

        {formError && (
        <p className="mt-4 text-sm text-red-600">
          {formError}
        </p>
        )}
        
        <div className="flex gap-4 mt-6 justify-end">
          <button type="button" disabled={isCreating} onClick={()=>{
            setShowCreateModal(false)
            setFormError('')
            setEditingService(null)
          }} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
          <button type="submit" disabled={isCreating} 
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {isCreating ? 'Saving...'
              : editingService ? 'Save Changes' : 'Create'}
          </button>
        </div>
            
      </form>
        </div>
      </div>
    )}
        </div>
    )
}
export default AdminDashboard