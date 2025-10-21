'use client'

export default function TestDashboard() {
  return (
    <div className="min-h-screen bg-dark-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        🎉 LOGIN FUNCIONOU! 🎉
      </h1>
      <div className="max-w-2xl mx-auto bg-dark-800 p-6 rounded-lg">
        <h2 className="text-2xl mb-4">Dashboard de Teste</h2>
        <p className="text-dark-300 mb-4">
          Se você está vendo esta página, significa que o login e redirecionamento funcionaram corretamente!
        </p>
        <div className="space-y-2">
          <p>✅ Autenticação: OK</p>
          <p>✅ Middleware: OK</p>
          <p>✅ Redirecionamento: OK</p>
        </div>
        <div className="mt-6">
          <a 
            href="/dashboard" 
            className="bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg inline-block"
          >
            Ir para Dashboard Principal
          </a>
        </div>
      </div>
    </div>
  )
}