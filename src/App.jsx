import { useState } from 'react'
import LoginForm from './components/LoginForm.jsx'
import ChatInterface from './components/ChatInterface.jsx'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (username, password, isRegistering) => {
    // Здесь будет логика аутентификации с бэкендом
    // Пока что просто сохраняем пользователя
    setUser({ username })
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <div className="App">
      {user ? (
        <ChatInterface 
          username={user.username} 
          onLogout={handleLogout}
        />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App

