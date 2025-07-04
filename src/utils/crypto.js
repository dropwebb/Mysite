// Утилиты для клиентского шифрования сообщений
class CryptoUtils {
  constructor() {
    this.keyPair = null;
    this.groupKeys = new Map();
  }

  // Генерация ключевой пары для пользователя
  async generateKeyPair() {
    try {
      this.keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );
      return this.keyPair;
    } catch (error) {
      console.error('Ошибка генерации ключевой пары:', error);
      throw error;
    }
  }

  // Генерация симметричного ключа для группы
  async generateGroupKey() {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );
      return key;
    } catch (error) {
      console.error('Ошибка генерации группового ключа:', error);
      throw error;
    }
  }

  // Шифрование сообщения для группы
  async encryptMessage(message, groupId) {
    try {
      if (!this.groupKeys.has(groupId)) {
        // Генерируем новый ключ для группы, если его нет
        const groupKey = await this.generateGroupKey();
        this.groupKeys.set(groupId, groupKey);
      }

      const groupKey = this.groupKeys.get(groupId);
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        groupKey,
        data
      );

      // Возвращаем зашифрованные данные в base64
      const encryptedArray = new Uint8Array(encrypted);
      const ivArray = Array.from(iv);
      const encryptedData = Array.from(encryptedArray);
      
      return {
        encrypted: btoa(String.fromCharCode(...encryptedData)),
        iv: btoa(String.fromCharCode(...ivArray)),
        groupId: groupId
      };
    } catch (error) {
      console.error('Ошибка шифрования сообщения:', error);
      // В случае ошибки возвращаем исходное сообщение
      return { encrypted: message, iv: null, groupId: groupId };
    }
  }

  // Расшифровка сообщения
  async decryptMessage(encryptedData, groupId) {
    try {
      if (!this.groupKeys.has(groupId) || !encryptedData.iv) {
        // Если нет ключа или данных для расшифровки, возвращаем как есть
        return encryptedData.encrypted;
      }

      const groupKey = this.groupKeys.get(groupId);
      
      const encryptedBytes = new Uint8Array(
        atob(encryptedData.encrypted).split('').map(char => char.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
      );

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        groupKey,
        encryptedBytes
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Ошибка расшифровки сообщения:', error);
      // В случае ошибки возвращаем зашифрованное сообщение
      return encryptedData.encrypted;
    }
  }

  // Экспорт публичного ключа
  async exportPublicKey() {
    if (!this.keyPair) {
      await this.generateKeyPair();
    }
    
    try {
      const exported = await window.crypto.subtle.exportKey(
        "spki",
        this.keyPair.publicKey
      );
      return btoa(String.fromCharCode(...new Uint8Array(exported)));
    } catch (error) {
      console.error('Ошибка экспорта публичного ключа:', error);
      return null;
    }
  }

  // Генерация анонимного ID для пользователя
  generateAnonymousId() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Хеширование данных для анонимности
  async hashData(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Ошибка хеширования данных:', error);
      return data;
    }
  }
}

export default CryptoUtils;

