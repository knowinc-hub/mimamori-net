import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { repository } from '../data/localRepository'
import type {
  HistoryEntry,
  Profile,
  RequestInput,
  SearchRequest,
  UpdateInput,
} from '../types'

type LoadState = 'loading' | 'ready' | 'error'

interface AppContextValue {
  loadState: LoadState
  requests: SearchRequest[]
  history: HistoryEntry[]
  profile: Profile | null
  refresh: () => Promise<void>
  createRequest: (input: RequestInput) => Promise<SearchRequest>
  addUpdate: (requestId: string, input: UpdateInput) => Promise<void>
  resolveRequest: (id: string) => Promise<void>
  updateProfile: (profile: Profile) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [requests, setRequests] = useState<SearchRequest[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)

  const refresh = useCallback(async () => {
    setLoadState('loading')
    try {
      const [r, h, p] = await Promise.all([
        repository.listRequests(),
        repository.listHistory(),
        repository.getProfile(),
      ])
      setRequests(r)
      setHistory(h)
      setProfile(p)
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createRequest = useCallback(async (input: RequestInput) => {
    const request = await repository.createRequest(input)
    setRequests(await repository.listRequests())
    return request
  }, [])

  const addUpdate = useCallback(async (requestId: string, input: UpdateInput) => {
    await repository.addUpdate(requestId, input)
    setRequests(await repository.listRequests())
  }, [])

  const resolveRequest = useCallback(async (id: string) => {
    await repository.resolveRequest(id)
    const [r, h] = await Promise.all([
      repository.listRequests(),
      repository.listHistory(),
    ])
    setRequests(r)
    setHistory(h)
  }, [])

  const updateProfile = useCallback(async (next: Profile) => {
    setProfile(next)
    await repository.updateProfile(next)
  }, [])

  const value = useMemo(
    () => ({
      loadState,
      requests,
      history,
      profile,
      refresh,
      createRequest,
      addUpdate,
      resolveRequest,
      updateProfile,
    }),
    [loadState, requests, history, profile, refresh, createRequest, addUpdate, resolveRequest, updateProfile],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp は AppProvider の内側で使用してください')
  return ctx
}
