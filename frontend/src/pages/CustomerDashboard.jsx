import { useEffect, useState } from 'react'
import {useNavigate} from "react-router"
import socket from '../socket'

function CustomerDashboard() {
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [queueMessage, setQueueMessage] = useState('')
  const [activeQueues, setActiveQueues] = useState([])
  const [queueStatusError, setQueueStatusError] = useState('')
  const [joiningServiceId, setJoiningServiceId] = useState(null)
  const [activeQueueCount, setActiveQueueCount] = useState(0)
  const [cancellingEntryId, setCancellingEntryId] = useState(null)
  const [queueClosedMessage, setQueueClosedMessage] = useState('')
  const [username, setUser] = useState(null)
  const navigate=useNavigate()
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')

  useEffect(() => {
  if (!token || !storedUser) {
    navigate('/login')
    return
  }

  try {
    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)
  } catch {
    localStorage.removeItem('user')
    navigate('/login')
  }
}, [navigate, token, storedUser])

    async function fetchServices() {
      try {
        const response = await fetch('http://localhost:5000/api/v1/services')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch services.')
        }
        setServices(result.data)
      } catch (error) {
        setError(error.message || 'Unable to load services.')
      } finally {
        setIsLoading(false)
      }
    }
    useEffect(() => {
    fetchServices()
  }, [])


    async function fetchMyQueueStatus() {
      try {
        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('Please log in to view your queue.')
        }

        const response = await fetch(
          'http://localhost:5000/api/v1/queues/my-status',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const result = await response.json()

        if (response.status === 404) {
          setActiveQueues([])
          setQueueStatusError('')
          return
        }

        if (!response.ok) {
          throw new Error(result.message || 'Unable to fetch queue status.')
        }

        setActiveQueues(result.data)
        setQueueStatusError('')
      } catch (error) {
        setQueueStatusError(
          error.message || 'Unable to fetch queue status.'
        )
      }
    }
    useEffect(() => {
    fetchMyQueueStatus()
    }, [])

    useEffect(() => {
      function handleQueueUpdate() {
        fetchMyQueueStatus()
      }

      socket.on('queue-updated', handleQueueUpdate)

      return () => {
        socket.off('queue-updated', handleQueueUpdate)
      }
    }, [])

    useEffect(() => {
    function handleQueueClosed(data) {
      setQueueClosedMessage(
        `Queue session #${data.serviceName} has been closed by the administrator.`
      )
      fetchMyQueueStatus()
    }
    socket.on('queue-session-closed', handleQueueClosed)
    return () => {
      socket.off('queue-session-closed', handleQueueClosed)
    }
  }, [])

    useEffect(()=>{
      if(activeQueues.length===0)return
      activeQueues.forEach((queue)=>{
        socket.emit('join-queue-room',queue.queue_session_id)
      })
    },[activeQueues])

    useEffect(() => {
      function handleRoomJoined(sessionId) {
        console.log('Successfully joined queue room:', sessionId)
      }

      function handleRoomError(error) {
        console.error('Queue room error:', error.message)
      }

      socket.on('queue-room-joined', handleRoomJoined)
      socket.on('queue-room-error', handleRoomError)

      return () => {
        socket.off('queue-room-joined', handleRoomJoined)
        socket.off('queue-room-error', handleRoomError)
      }
    }, [])


  async function fetchActiveQueueCount() {
    try {
      const response = await fetch(
        'http://localhost:5000/api/v1/queues/active-count'
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to fetch active queues.')
      }

      setActiveQueueCount(result.data.active_queues)
    } catch (error) {
      console.error('Fetch Active Queue Count Error:', error)
    }

  }
  useEffect(() => {
  function handleQueueSessionStarted() {
    fetchActiveQueueCount()
    fetchServices()
  }

  function handleQueueSessionClosed() {
    fetchActiveQueueCount()
    fetchServices()
  }

  socket.on('queue-session-started', handleQueueSessionStarted)
  socket.on('queue-session-closed', handleQueueSessionClosed)
  fetchActiveQueueCount()
  return () => {
    socket.off('queue-session-started', handleQueueSessionStarted)
    socket.off('queue-session-closed', handleQueueSessionClosed)
  }
}, [])

  async function handleJoinQueue(serviceId) {
    setJoiningServiceId(serviceId)
    setQueueMessage('')

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Login To Join A Queue')
      }

      const response = await fetch(
        'http://localhost:5000/api/v1/queues/join',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ service_id: serviceId }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed To Join Queue')
      }

      const newQueue = {
        ...result.data,
        service_name: services.find(
          (service) => service.id === serviceId
        )?.name,
      }

      setQueueMessage(
        `Successfully joined! Ticket #${result.data.ticket_number}, Position: ${result.data.position}, Estimated wait: ${result.data.estimated_wait_minutes} minutes.`
      )

      setQueueStatusError('')

      setActiveQueues((previousQueues) => {
        const alreadyExists = previousQueues.some(
          (queue) => queue.id === newQueue.id
        )

        if (alreadyExists) {
          return previousQueues
        }

        return [...previousQueues, newQueue]
      })
    } catch (error) {
      setQueueMessage(error.message || 'Unable to join queue.')
    } finally {
      setJoiningServiceId(null)
    }
  }

  async function handleCancelQueue(entryId) {
    setCancellingEntryId(entryId)
    setQueueMessage('')
    setQueueStatusError('')

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Please log in to cancel your queue.')
      }

      const response = await fetch(
        `http://localhost:5000/api/v1/queues/my-entry/${entryId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel queue.')
      }

      setActiveQueues((previousQueues) =>
        previousQueues.filter((queue) => queue.id !== entryId)
      )

      setQueueMessage(
        `Queue entry #${result.data.ticket_number} cancelled successfully.`
      )
    } catch (error) {
      setQueueMessage(error.message || 'Unable to cancel queue.')
    } finally {
      setCancellingEntryId(null)
    }
  }
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    socket.disconnect()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-6 py-4 border border-slate-200">
        <div className="mx-auto max-w-7xl flex justify-between items-center">
          <a
            href="/"
            className="bg-blue-600 text-white font-bold text-xl px-6 py-2 rounded-lg"
          >
            QueueFlow
          </a>

          <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex justify-between">
                  <h1 className="text-3xl font-bold text-slate-900">
                      Welcome, {username?.name || 'Customer'}!
                    </h1>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    ↻ Refresh
                  </button>
                </div>

        <p className="mt-2 text-slate-600">
          Manage your queues and track your waiting time.
        </p>
      </section>

      
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Active Queues</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{activeQueueCount}</h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Queues You Joined</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {activeQueues.length}
            </h3>
          </div>
        </div>
      </section>

      
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Available Services
        </h2>

        <p className="mt-2 text-slate-600">
          Choose a service and join its queue.
        </p>

        {isLoading && (
          <p className="mt-4 text-slate-600">Loading services...</p>
        )}

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {!isLoading && !error && services.length === 0 && (
          <p className="mt-4 text-slate-600">
            No services available right now.
          </p>
        )}

      {!isLoading &&
        !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-slate-900">
                  {service.name}
                </h3>

                <p className="mt-2 text-slate-600">
                  {service.description}
                </p>

                <button
                  onClick={() => handleJoinQueue(service.id)}
                  disabled={joiningServiceId !== null}
                  className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joiningServiceId === service.id
                    ? 'Joining...'
                    : 'Join Queue'}
                </button>
              </div>
            ))}
          </div>
        )}

        {queueMessage && (
          <p className="mt-4 rounded-lg bg-blue-50 font-bold p-4 text-slate-800">
            {queueMessage}
          </p>
        )}
        {queueClosedMessage && (
        <p className="mt-4 rounded-lg bg-yellow-50 font-bold p-4 text-yellow-800">
          {queueClosedMessage}
        </p>
      )}
      </section>

      
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          My Active Queues
        </h2>

        {queueStatusError ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-slate-600">{queueStatusError}</p>
          </div>
        ) : activeQueues.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          {activeQueues.map((queue) => (
            <div
              key={queue.id}
              className="mt-4 rounded-xl border border-slate-200 bg-white p-6"
            >
              <h3 className="text-2xl font-bold text-slate-900 text-center ">
                {queue.service_name}
              </h3>
              <hr className="border-t border-gray-600 my-3" />
              
              <p className="mt-6 text-xl text-slate-900 flex items-center gap-2">
                <span>Position:</span> 
                <span className="text-black text-xl font-bold">{queue.position}</span> 
              </p>

              <p className="mt-2 text-xl text-slate-900">
                Estimated Wait: {queue.estimated_wait_minutes} minutes
              </p>

              <p className="mt-2 text-xl text-slate-900">
                Status: <span
                className={`px-2.5 py-1 text-xs rounded-full ${
                  queue.status.toLowerCase() === 'serving'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}
              >
                {queue.status}
              </span>
              </p>

              <p className="mt-2 text-slate-600">
                Ticket Number: #{queue.ticket_number}
              </p>
              {queue.status === 'WAITING' && (
                <button
                  onClick={() => handleCancelQueue(queue.id)}
                  disabled={cancellingEntryId !== null}
                  className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancellingEntryId === queue.id
                    ? 'Cancelling...'
                    : 'Cancel Queue'}
                </button>
              )}
            </div>
          ))}
        </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-slate-600">
              You haven't joined any active queue yet.
            </p>
          </div>
        )}
      </section>

      <footer className="mt-8 border-t border-slate-200 bg-white px-6 py-4">
        <p className="text-center text-sm text-slate-500">
          © 2026 QueueFlow. Making queues better.
        </p>
      </footer>
    </div>
  )
}

export default CustomerDashboard