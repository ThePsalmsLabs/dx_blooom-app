/**
 * Browser-compatible AsyncStorage polyfill for @react-native-async-storage/async-storage
 * 
 * This polyfill provides the AsyncStorage API using localStorage as the backing store.
 * It's designed to be a drop-in replacement for React Native's AsyncStorage when
 * used in browser environments.
 */

interface AsyncStorageStatic {
  /**
   * Gets a string value for given key. This function can either return a string value for existing key 
   * or return null otherwise.
   */
  getItem(key: string): Promise<string | null>
  
  /**
   * Sets a string value for given key. This operation can either modify an existing entry, 
   * if it did exist for given key, or add new one otherwise.
   */
  setItem(key: string, value: string): Promise<void>
  
  /**
   * Removes an item for a key, invokes (optional) callback once completed.
   */
  removeItem(key: string): Promise<void>
  
  /**
   * Removes all AsyncStorage data, for all clients, libraries, etc. You probably 
   * don't want to call this - use removeItem or multiRemove to clear only your 
   * app's keys.
   */
  clear(): Promise<void>
  
  /**
   * Gets all keys known to your app, for all callers, libraries, etc.
   */
  getAllKeys(): Promise<string[]>
  
  /**
   * This allows you to batch the fetching of items given an array of key inputs. 
   * Your callback will be invoked with an array of corresponding key-value pairs found.
   */
  multiGet(keys: string[]): Promise<Array<[string, string | null]>>
  
  /**
   * Use this as a batch operation for storing multiple key-value pairs. When the 
   * operation completes you'll get a single callback with any errors.
   */
  multiSet(keyValuePairs: Array<[string, string]>): Promise<void>
  
  /**
   * Call this to batch the deletion of all keys in the keys array.
   */
  multiRemove(keys: string[]): Promise<void>
}

class WebAsyncStorage implements AsyncStorageStatic {
  private readonly keyPrefix = '@metamask:async-storage:'
  
  private getStorageKey(key: string): string {
    return this.keyPrefix + key
  }
  
  private isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false
      }
      
      // Test localStorage accessibility
      const testKey = '__asyncstorage_test__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
  
  async getItem(key: string): Promise<string | null> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn('AsyncStorage: localStorage not available, returning null')
        return null
      }
      
      const storageKey = this.getStorageKey(key)
      const value = window.localStorage.getItem(storageKey)
      return value
    } catch (error) {
      console.warn('AsyncStorage: Failed to get item:', error)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn('AsyncStorage: localStorage not available, skipping setItem')
        return
      }
      
      if (typeof value !== 'string') {
        throw new Error('AsyncStorage: value must be a string')
      }
      
      const storageKey = this.getStorageKey(key)
      window.localStorage.setItem(storageKey, value)
    } catch (error) {
      // Handle quota exceeded gracefully
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('AsyncStorage: Storage quota exceeded, could not save item')
      } else {
        console.warn('AsyncStorage: Failed to set item:', error)
      }
      // Don't throw - async storage should fail silently in most cases
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn('AsyncStorage: localStorage not available, skipping removeItem')
        return
      }
      
      const storageKey = this.getStorageKey(key)
      window.localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn('AsyncStorage: Failed to remove item:', error)
      // Don't throw - async storage should fail silently
    }
  }

  async clear(): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn('AsyncStorage: localStorage not available, skipping clear')
        return
      }
      
      // Only clear keys with our prefix to avoid affecting other data
      const keysToRemove: string[] = []
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        window.localStorage.removeItem(key)
      })
    } catch (error) {
      console.warn('AsyncStorage: Failed to clear storage:', error)
      // Don't throw - async storage should fail silently
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn('AsyncStorage: localStorage not available, returning empty array')
        return []
      }
      
      const keys: string[] = []
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const storageKey = window.localStorage.key(i)
        if (storageKey && storageKey.startsWith(this.keyPrefix)) {
          // Remove our prefix to return the original key
          const originalKey = storageKey.slice(this.keyPrefix.length)
          keys.push(originalKey)
        }
      }
      
      return keys
    } catch (error) {
      console.warn('AsyncStorage: Failed to get all keys:', error)
      return []
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      const results = await Promise.all(
        keys.map(async (key): Promise<[string, string | null]> => {
          const value = await this.getItem(key)
          return [key, value]
        })
      )
      return results
    } catch (error) {
      console.warn('AsyncStorage: Failed to multiGet:', error)
      // Return array with null values for all keys
      return keys.map(key => [key, null])
    }
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      await Promise.all(
        keyValuePairs.map(([key, value]) => this.setItem(key, value))
      )
    } catch (error) {
      console.warn('AsyncStorage: Failed to multiSet:', error)
      // Don't throw - async storage should fail silently
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await Promise.all(
        keys.map(key => this.removeItem(key))
      )
    } catch (error) {
      console.warn('AsyncStorage: Failed to multiRemove:', error)
      // Don't throw - async storage should fail silently
    }
  }
}

// Create singleton instance
const AsyncStorage = new WebAsyncStorage()

// Export default for compatibility with @react-native-async-storage/async-storage
export default AsyncStorage

// Export named export for additional compatibility
export { AsyncStorage }

// Export the interface for type checking
export type { AsyncStorageStatic }