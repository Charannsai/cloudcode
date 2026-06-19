import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState, useEffect } from 'react'

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await AsyncStorage.getItem(key)
      return val ? JSON.parse(val) : null
    } catch {
      return null
    }
  },
  async set<T>(key: string, val: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(val))
    } catch {}
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key)
    } catch {}
  }
}

export function useCache<T>(key: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const val = await cache.get<T>(key)
      if (val !== null) {
        setData(val)
      }
      setLoading(false)
    }
    load()
  }, [key])

  const save = async (newVal: T) => {
    setData(newVal)
    await cache.set(key, newVal)
  }

  return [data, save, loading] as const
}
