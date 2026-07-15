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
import type { HistoryEntry, Post, PostInput, Profile } from '../types'

type LoadState = 'loading' | 'ready' | 'error'

interface AppContextValue {
  loadState: LoadState
  posts: Post[]
  history: HistoryEntry[]
  profile: Profile | null
  refresh: () => Promise<void>
  createPost: (input: PostInput) => Promise<Post>
  addResponse: (id: string) => Promise<void>
  resolvePost: (id: string) => Promise<void>
  updateProfile: (profile: Profile) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [posts, setPosts] = useState<Post[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)

  const refresh = useCallback(async () => {
    setLoadState('loading')
    try {
      const [p, h, pr] = await Promise.all([
        repository.listPosts(),
        repository.listHistory(),
        repository.getProfile(),
      ])
      setPosts(p)
      setHistory(h)
      setProfile(pr)
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createPost = useCallback(async (input: PostInput) => {
    const post = await repository.createPost(input)
    setPosts(await repository.listPosts())
    return post
  }, [])

  const addResponse = useCallback(async (id: string) => {
    await repository.addResponse(id)
    setPosts(await repository.listPosts())
  }, [])

  const resolvePost = useCallback(async (id: string) => {
    await repository.resolvePost(id)
    const [p, h] = await Promise.all([
      repository.listPosts(),
      repository.listHistory(),
    ])
    setPosts(p)
    setHistory(h)
  }, [])

  const updateProfile = useCallback(async (next: Profile) => {
    setProfile(next)
    await repository.updateProfile(next)
  }, [])

  const value = useMemo(
    () => ({
      loadState,
      posts,
      history,
      profile,
      refresh,
      createPost,
      addResponse,
      resolvePost,
      updateProfile,
    }),
    [loadState, posts, history, profile, refresh, createPost, addResponse, resolvePost, updateProfile],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp は AppProvider の内側で使用してください')
  return ctx
}
