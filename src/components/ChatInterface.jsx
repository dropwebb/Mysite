import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { 
  Send, 
  Plus, 
  Copy, 
  Users, 
  Shield, 
  LogOut, 
  Link as LinkIcon,
  Hash,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useSocket } from '../hooks/useSocket.js'

export default function ChatInterface({ username, onLogout }) {
  const [groups, setGroups] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [groupLink, setGroupLink] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [isJoiningGroup, setIsJoiningGroup] = useState(false)
  const messagesEndRef = useRef(null)

  const { isConnected, messages, joinGroup, leaveGroup, sendMessage, clearMessages } = useSocket()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (newMessage.trim() && activeGroup && isConnected) {
      await sendMessage(activeGroup.id, newMessage, username)
      setNewMessage('')
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (newGroupName.trim() && !isCreatingGroup) {
      setIsCreatingGroup(true)
      try {
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newGroupName }),
        })

        if (response.ok) {
          const group = await response.json()
          setGroups(prev => [...prev, group])
          setActiveGroup(group)
          setNewGroupName('')
          setShowCreateGroup(false)
          
          // Присоединяемся к группе через WebSocket
          joinGroup(group.id, username)
          clearMessages()
        } else {
          alert('Ошибка создания группы')
        }
      } catch (error) {
        console.error('Ошибка создания группы:', error)
        alert('Ошибка создания группы')
      } finally {
        setIsCreatingGroup(false)
      }
    }
  }

  const handleJoinByLink = async (e) => {
    e.preventDefault()
    if (groupLink.trim() && !isJoiningGroup) {
      setIsJoiningGroup(true)
      try {
        const groupId = groupLink.split('/').pop()
        const response = await fetch(`/api/groups/${groupId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const group = await response.json()
          
          // Проверяем, не добавлена ли уже эта группа
          const existingGroup = groups.find(g => g.id === group.id)
          if (!existingGroup) {
            setGroups(prev => [...prev, group])
          }
          
          setActiveGroup(group)
          setGroupLink('')
          
          // Присоединяемся к группе через WebSocket
          joinGroup(group.id, username)
          clearMessages()
        } else {
          alert('Группа не найдена')
        }
      } catch (error) {
        console.error('Ошибка присоединения к группе:', error)
        alert('Ошибка присоединения к группе')
      } finally {
        setIsJoiningGroup(false)
      }
    }
  }

  const copyGroupLink = (link) => {
    navigator.clipboard.writeText(link)
    alert('Ссылка скопирована в буфер обмена!')
  }

  const handleGroupSelect = (group) => {
    if (activeGroup && activeGroup.id !== group.id) {
      leaveGroup(activeGroup.id, username)
    }
    setActiveGroup(group)
    joinGroup(group.id, username)
    clearMessages()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-purple-400 mr-2" />
              <span className="text-white font-semibold">SecureChat</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-slate-300">
              <Users className="h-4 w-4 mr-2" />
              <span>Пользователь: {username}</span>
            </div>
            <div className="flex items-center">
              {isConnected ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Group Actions */}
        <div className="p-4 space-y-3">
          <Button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!isConnected}
          >
            <Plus className="h-4 w-4 mr-2" />
            Создать группу
          </Button>

          {showCreateGroup && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-3">
                <form onSubmit={handleCreateGroup} className="space-y-2">
                  <Input
                    placeholder="Название группы"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="bg-slate-600 border-slate-500 text-white placeholder-slate-400"
                    disabled={isCreatingGroup}
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="w-full"
                    disabled={isCreatingGroup || !isConnected}
                  >
                    {isCreatingGroup ? 'Создание...' : 'Создать'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Input
              placeholder="Ссылка на группу"
              value={groupLink}
              onChange={(e) => setGroupLink(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              disabled={isJoiningGroup}
            />
            <Button
              onClick={handleJoinByLink}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:text-white"
              disabled={isJoiningGroup || !isConnected}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {isJoiningGroup ? 'Присоединение...' : 'Присоединиться'}
            </Button>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Groups List */}
        <div className="flex-1 p-4">
          <h3 className="text-slate-300 font-medium mb-3">Мои группы</h3>
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className={`cursor-pointer transition-colors ${
                    activeGroup?.id === group.id
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50'
                  }`}
                  onClick={() => handleGroupSelect(group)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium truncate">{group.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {group.members || 1}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-400">
                        <Hash className="h-3 w-3 mr-1" />
                        <span>ID: {group.id}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyGroupLink(group.link)
                        }}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeGroup ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold text-lg">{activeGroup.name}</h2>
                  <div className="flex items-center text-sm text-slate-400">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{activeGroup.members || 1} участников</span>
                    <span className="mx-2">•</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Создана: {activeGroup.created}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyGroupLink(activeGroup.link)}
                  className="border-slate-600 text-slate-300 hover:text-white"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Копировать ссылку
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages
                  .filter(msg => msg.groupId === activeGroup.id)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === username ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === username
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700 text-slate-100'
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {message.sender} • {message.timestamp}
                        </div>
                        <div>{message.text}</div>
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={!isConnected}
                />
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!isConnected || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <div className="flex items-center text-xs text-slate-400 mt-2">
                <Shield className="h-3 w-3 mr-1" />
                <span>Сообщения шифруются end-to-end</span>
                {!isConnected && (
                  <>
                    <span className="mx-2">•</span>
                    <AlertCircle className="h-3 w-3 mr-1 text-red-400" />
                    <span className="text-red-400">Нет соединения</span>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                Выберите группу
              </h3>
              <p className="text-slate-400">
                Создайте новую группу или присоединитесь к существующей
              </p>
              {!isConnected && (
                <div className="mt-4 flex items-center justify-center text-red-400">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>Подключение к серверу...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

