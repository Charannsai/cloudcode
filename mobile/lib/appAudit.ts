import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

export interface AppCommitRecord {
  projectId: string
  projectName: string
  branch: string
  message: string
  hash: string
  timestamp: number
}

export interface AppSessionRecord {
  device: string
  timestamp: number
  ip: string
  status: 'ACTIVE' | 'PREVIOUS'
}

/**
 * Records a successful git commit made through the app
 */
export async function recordAppCommit(
  projectId: string,
  projectName: string,
  branch: string,
  message: string,
  hash: string
) {
  try {
    const existing = await AsyncStorage.getItem('app_commit_history')
    const list: AppCommitRecord[] = existing ? JSON.parse(existing) : []
    
    // Add new commit at the beginning
    list.unshift({
      projectId,
      projectName,
      branch,
      message,
      hash,
      timestamp: Date.now()
    })
    
    // Limit to last 10 commits
    await AsyncStorage.setItem('app_commit_history', JSON.stringify(list.slice(0, 10)))
  } catch (err) {
    console.warn('Failed to record app commit audit:', err)
  }
}

/**
 * Records a new active login or launch session
 */
export async function recordAppSession() {
  try {
    const existing = await AsyncStorage.getItem('app_sessions_history')
    const list: AppSessionRecord[] = existing ? JSON.parse(existing) : []
    
    // Mark previous sessions as inactive/previous
    const updatedList: AppSessionRecord[] = list.map(item => ({
      ...item,
      status: 'PREVIOUS'
    }))
    
    const deviceName = Platform.OS === 'ios' ? 'iOS Simulator' : 'Android Client'
    
    // Add new active session
    updatedList.unshift({
      device: deviceName,
      timestamp: Date.now(),
      ip: '127.0.0.1 (Local)',
      status: 'ACTIVE' as const
    })
    
    // Limit to last 5 sessions
    await AsyncStorage.setItem('app_sessions_history', JSON.stringify(updatedList.slice(0, 5)))
  } catch (err) {
    console.warn('Failed to record app session audit:', err)
  }
}
