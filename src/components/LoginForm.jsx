import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Shield, Lock, Users } from 'lucide-react'

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isRegistering) {
      if (password !== confirmPassword) {
        alert('Пароли не совпадают')
        return
      }
      if (password.length < 6) {
        alert('Пароль должен содержать минимум 6 символов')
        return
      }
    }
    
    if (username.trim() && password.trim()) {
      onLogin(username, password, isRegistering)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-600 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SecureChat</h1>
          <p className="text-slate-300">Анонимный групповой чат с шифрованием</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <Tabs value={isRegistering ? 'register' : 'login'} onValueChange={(value) => setIsRegistering(value === 'register')}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger value="login" className="text-slate-300 data-[state=active]:text-white">Вход</TabsTrigger>
                <TabsTrigger value="register" className="text-slate-300 data-[state=active]:text-white">Регистрация</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <CardTitle className="text-white">Войти в аккаунт</CardTitle>
                <CardDescription className="text-slate-400">
                  Введите ваши данные для входа
                </CardDescription>
              </TabsContent>
              
              <TabsContent value="register">
                <CardTitle className="text-white">Создать аккаунт</CardTitle>
                <CardDescription className="text-slate-400">
                  Создайте новый анонимный аккаунт
                </CardDescription>
              </TabsContent>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Имя пользователя</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Введите имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  required
                />
              </div>
              
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">Подтвердите пароль</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
              )}
              
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                <Lock className="h-4 w-4 mr-2" />
                {isRegistering ? 'Создать аккаунт' : 'Войти'}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center text-sm text-slate-300">
                <Users className="h-4 w-4 mr-2 text-purple-400" />
                <span>Все данные шифруются и не хранятся на сервере</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

