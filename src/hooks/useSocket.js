import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import CryptoUtils from '../utils/crypto.js'

export const useSocket = (serverUrl = 'http://localhost:5000') => {
  const socketRef = useRef(null)
  const cryptoRef = useRef(new CryptoUtils())
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    // Инициализация криптографии
    cryptoRef.current.generateKeyPair()

    // Подключение к серверу
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('connect', () => {
      console.log('Подключено к серверу')
      setIsConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      console.log('Отключено от сервера')
      setIsConnected(false)
    })

    socketRef.current.on('new_message', async (messageData) => {
      try {
        // Расшифровываем сообщение, если оно зашифровано
        let decryptedText = messageData.text
        if (messageData.encrypted) {
          decryptedText = await cryptoRef.current.decryptMessage(
            messageData.encrypted,
            messageData.groupId
          )
        }

        const decryptedMessage = {
          ...messageData,
          text: decryptedText
        }

        setMessages(prev => [...prev, decryptedMessage])
      } catch (error) {
        console.error('Ошибка обработки сообщения:', error)
        setMessages(prev => [...prev, messageData])
      }
    })

    socketRef.current.on('user_joined', (data) => {
      console.log('Пользователь присоединился:', data)
    })

    socketRef.current.on('user_left', (data) => {
      console.log('Пользователь покинул группу:', data)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [serverUrl])

  const joinGroup = (groupId, username) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_group', { groupId, username })
    }
  }

  const leaveGroup = (groupId, username) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_group', { groupId, username })
    }
  }

  const sendMessage = async (groupId, message, username) => {
    if (socketRef.current && isConnected && message.trim()) {
      try {
        // Шифруем сообщение перед отправкой
        const encryptedData = await cryptoRef.current.encryptMessage(message, groupId)
        
        socketRef.current.emit('send_message', {
          groupId,
          message: encryptedData.iv ? undefined : message, // Отправляем открытый текст только если шифрование не удалось
          encrypted: encryptedData.iv ? encryptedData : undefined, // Отправляем зашифрованные данные
          username
        })
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error)
        // В случае ошибки отправляем незашифрованное сообщение
        socketRef.current.emit('send_message', {
          groupId,
          message,
          username
        })
      }
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  return {
    isConnected,
    messages,
    joinGroup,
    leaveGroup,
    sendMessage,
    clearMessages
  }
}

