function Home() {
  return (
    <div className="text-slate-900 min-h-screen bg-white">
      <nav className="flex justify-between items-center px-6 py-4 border border-slate-300">
        <a href="#" className="text-blue-600 text-2xl  font-bold ">
        QueueFlow
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="hover:text-blue-600 transition">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-blue-600 transition">
            How it Works 
          </a>
       
        </div>
      </nav>

      <section className="text-center px-6 py-20 mb-6">
      <p className="text-xl text-blue-600 font-semibold mb-4">
        Smart Queue Managment
      </p>
      <h1 className="mx-auto max-w-4xl text-4xl font-bold sm:text-6xl">
        Skip The Line.
        <span className="text-blue-600 font-bold">
          Save Your Time
        </span>
      </h1>
      <p className="mx-auto mt-5 text-slate-600 max-w-2xl">
        Join queues remotely, track your position in real time, and know when
        it's your turn. Less waiting, more living.
      </p>
      <div className="flex sm:flex-row items-center gap-4 justify-center mt-6">
        <a href="/login" className="bg-blue-600 px-6 py-3 rounded-lg font-semibold text-white hover:bg-blue-700 transition">
        Login
        </a>
        <a href="/register" className="bg-slate-600 px-6 py-3 rounded-lg font-semibold text-white hover:bg-slate-700 transition">
        Register
        </a>
      </div>
      </section>

      <section id="features" className="bg-slate-50 px-6 py-15">
        <p className="text-center text-xl text-blue-600 font-semibold">
          Why QueueFlow?
        </p>
        <h2 className="text-center text-slate-800 text-4xl mt-2 font-semibold max-w-4xl mx-auto">
          Waiting in a Line should be a thing of the Past!
        </h2>
        <p className="mx-auto text-center mt-3 text-xl text-slate-600">
          A smarter way for Customers and Businesses to manage Queues.
        </p>

        <div className="grid mx-auto mt-6 sm:grid-cols-3 gap-6 max-w-6xl">
          <div className="bg-white px-5 py-4 rounded-xl border border-slate-300">
            <h3 className="text-xl font-bold mb-1">
              Join Queues Remotely
            </h3>
            <p>
            Join a queue from anywhere without standing around waiting.
            </p>
          </div>
          <div className="bg-white px-5 py-4 rounded-xl border border-slate-300">
            <h3 className="text-xl font-bold mb-1">
              Live Queue Tracking
            </h3>
            <p>
            See your current position and follow queue progress as it changes.
            </p>
          </div>
          <div className="bg-white px-5 py-4 rounded-xl border border-slate-300">
            <h3 className="text-xl font-bold mb-1">
              Estimated Waiting Time
            </h3>
            <p>
            Get an estimated waiting time so you can plan your visit better.
            </p>
          </div>
        </div>
      </section>
      
      <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold text-blue-600">
            Simple By Design
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Three steps. A better experience.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            QueueFlow makes waiting more predictable for everyone.
          </p>
        </div>


        <div className="mx-auto max-w-6xl gap-8 grid sm:grid-cols-3">
            <div className="text-center mt-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              1
            </div>
            <h3 className="mt-5 text-xl font-bold">Choose a Service</h3>
            <p className="mt-2 text-slate-600">
              Find the service you need and join its active queue.
            </p>
          </div>

          <div className="text-center mt-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              2
            </div>
            <h3 className="mt-5 text-xl font-bold">Track Your Position</h3>
            <p className="mt-2 text-slate-600">
              Follow your queue position and estimated waiting time.
            </p>
          </div>

          <div className="text-center mt-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              3
            </div>
            <h3 className="mt-5 text-xl font-bold">Get Served</h3>
            <p className="mt-2 text-slate-600">
              Arrive at the right time and let the business serve you.
            </p>
          </div>
        </div>
      </section>
      <footer className="mx-auto grid px-4 py-6 border-t gap-4 border-slate-300 items-center sm:grid-cols-3">
        <a href="/" className="text-blue-600 text-xl  font-bold ">
        QueueFlow
        </a>
        <p className="text-center text-slate-800">
         Making Queues Better
        </p>
        <p className="text-sm text-slate-500 text-center">
            © 2026 QueueFlow
          </p>
      </footer>
    </div>
  )
}

export default Home