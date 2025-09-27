export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Frontend is Working!</h1>
        <p className="text-gray-600 mb-4">If you can see this, the frontend is running correctly.</p>
        <a 
          href="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Main Dashboard
        </a>
      </div>
    </div>
  )
}
