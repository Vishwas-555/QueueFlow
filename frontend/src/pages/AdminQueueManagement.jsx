
import { useState, useEffect ,useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import socket from '../socket'

function AdminQueueManagement() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [queueEntries, setQueueEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [callingNext, setCallingNext] = useState(false)
  const [queueActionError, setQueueActionError] = useState('')
  const [updatingEntry, setUpdatingEntry] = useState(false)
  const [closingSession, setClosingSession] = useState(false)
  const [priorityManagement, setPriorityManagement] = useState(false)
  const [updatingPriorityEntry, setUpdatingPriorityEntry] = useState(null)
  
  const waitingCustomers = queueEntries.filter(
    entry => entry.status === 'WAITING'
  )

  const servingCustomers = queueEntries.filter (
    entry => entry.status === 'SERVING'
  )

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:5000/api/v1/queues/admin/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load queue.')
      }
      setQueueEntries(result.data)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

    useEffect(() => {
    fetchQueue()
    }, [fetchQueue])

    useEffect(() => {
      function joinQueueRoom() {
        socket.emit('join-queue-room', Number(sessionId))
      }
      if (!socket.connected) {
        socket.connect()
      } else {
        joinQueueRoom()
      }
      socket.on('connect', joinQueueRoom)
      return () => {
        socket.off('connect', joinQueueRoom)
      }
    }, [sessionId])

  useEffect(() => {
    function handleQueueUpdate() {
      fetchQueue()
    }
    socket.on('queue-updated', handleQueueUpdate)
    return () => {
      socket.off('queue-updated', handleQueueUpdate)
    }
  }, [fetchQueue])

  const handleCallNext = async () => {
    try {
        setCallingNext(true)
        setQueueActionError('')
        const token = localStorage.getItem('token')
        const response = await fetch(
        `http://localhost:5000/api/v1/queues/admin/${sessionId}/next`,
        {
            method: 'POST',
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        )
        const result = await response.json()
        if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to call next customer.')
        }
        const calledCustomer = result.data
        setQueueEntries((prevEntries) =>
        prevEntries.map((entry) =>
            entry.id === calledCustomer.id ? calledCustomer : entry
        )
        )
    } catch (err) {
        setQueueActionError(err.message || 'Something went wrong.')
    } finally {
        setCallingNext(false)
    }
    }

    
const handleCustomerAction = async (entryId, status) => {
  try {
    setUpdatingEntry(true)
    setQueueActionError('')

    const token = localStorage.getItem('token')

      const response = await fetch(
        `http://localhost:5000/api/v1/queues/admin/entries/${entryId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: status }),
        }
      )

      const result = await response.json()

          if (!response.ok || !result.success) {
            throw new Error(
              result.message || 'Unable to update customer status.'
            )
          }

          setQueueEntries((prevEntries) =>
            prevEntries.filter((entry) => entry.id !== entryId)
          )

        } catch (err) {
          setQueueActionError(
            err.message || 'Something went wrong.'
          )
        } finally {
          setUpdatingEntry(false)
        }
      }

    
    const handlePriorityChange = async (entryId, selectedPriority, currentPriority) => {
      try {
        setUpdatingPriorityEntry(entryId)
        setQueueActionError('')
        const token = localStorage.getItem('token')
        const newPriority =
          currentPriority === selectedPriority ? 0 : selectedPriority

        const response = await fetch(
          `http://localhost:5000/api/v1/queues/admin/entries/${entryId}/priority`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ priority: newPriority }),
          }
        )
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to update priority.')
        }
      } catch (err) {
        setQueueActionError(err.message || 'Something went wrong.')
      } finally {
        setUpdatingPriorityEntry(null)
      }
    }


    const handleCloseQueue = async () => {
      const confirmed = window.confirm(
        'Are you sure you want to close this queue session?'
      )
      if (!confirmed) return
      try {
        setClosingSession(true)
        setQueueActionError('')
        const token = localStorage.getItem('token')
        const response = await fetch(
          `http://localhost:5000/api/v1/queues/admin/${sessionId}/close`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Unable to close queue session.'
          )
        }
        navigate('/admin')
      } catch (err) {
        setQueueActionError(
          err.message || 'Something went wrong.'
        )
      } finally {
        setClosingSession(false)
      }
    }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          ← Back to Dashboard
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Queue Management
          </h1>
          <p className="mt-2 text-slate-600">
            Managing Queue Session #{sessionId}
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading queue...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            
            <section className="mb-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Currently Serving
              </h2>
              {queueActionError && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {queueActionError}
                </div>
            )}
             
            {servingCustomers.length === 0 ? (
              <p className="mt-4 text-slate-500">
                No customers are currently being served.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {servingCustomers.map((customer) => (
                  <article
                    key={customer.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-2xl font-bold text-blue-700">
                          Ticket #{customer.ticket_number}
                        </p>

                        <p className="mt-2 text-slate-600">
                          {customer.customer_name}
                        </p>
                      </div>

                      <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        SERVING
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          handleCustomerAction(customer.id, 'COMPLETED')
                        }
                        disabled={updatingEntry}
                        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingEntry ? 'Updating...' : 'Complete'}
                      </button>

                      <button
                        onClick={() =>
                          handleCustomerAction(customer.id, 'SKIPPED')
                        }
                        disabled={updatingEntry}
                        className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingEntry ? 'Updating...' : 'Skip'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

              <button
                onClick={handleCallNext}
                disabled={callingNext || waitingCustomers.length === 0}
                className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                {callingNext ? 'Calling Next Customer...' : 'Call Next'}
            </button>

            <button
              onClick={handleCloseQueue}
              disabled={
                closingSession ||
                waitingCustomers.length > 0 ||
                servingCustomers.length > 0
              }
              className="mt-3 w-full rounded-lg bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {closingSession ? 'Closing Queue...' : 'Close Queue Session'}
            </button>
            </section>

            
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Waiting Customers
                </h2>

                <span className="mt-2 inline-block rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                  {waitingCustomers.length} Waiting
                </span>
              </div>

              <label className="flex items-center gap-2 text-lg font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={priorityManagement}
                  onChange={(event) => setPriorityManagement(event.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Enable Priority Management
              </label>
            </div>


              {waitingCustomers.length === 0 ? (
                <p className="py-6 text-center text-slate-500">
                  No customers waiting in the queue.
                </p>
              ) : (
                <div className="space-y-3">
                  {waitingCustomers.map((entry) => (
                    <article
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          Ticket #{entry.ticket_number}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {entry.customer_name}
                        </p>
                      </div>

                     
                      <div className="text-right">
                        <span className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                          WAITING
                        </span>

                        <p className="mt-2 text-xs text-slate-500">
                          Priority: {
                            entry.priority === 2
                              ? 'High'
                              : entry.priority === 1
                                ? 'Medium'
                                : 'Normal'
                          }
                        </p>
                        {priorityManagement && (
                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => handlePriorityChange(entry.id, 1, entry.priority)}
                              disabled={updatingPriorityEntry !== null}
                              className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                entry.priority === 1
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              {updatingPriorityEntry === entry.id
                                ? 'Updating...'
                                : 'Medium'}
                            </button>
                            <button
                              onClick={() => handlePriorityChange(entry.id, 2, entry.priority)}
                              disabled={updatingPriorityEntry !== null}
                              className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                entry.priority === 2
                                  ? 'bg-red-600 text-white'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {updatingPriorityEntry === entry.id
                                ? 'Updating...'
                                : 'High'}
                            </button>
                          </div>
                        )}
                      </div>

                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  )
}

export default AdminQueueManagement
