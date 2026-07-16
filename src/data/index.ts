import type { Repository } from './repository'
import { LocalRepository } from './localRepository'
import { FirestoreRepository } from './firestoreRepository'

/**
 * リポジトリの選択。
 * 通常は Firestore。UIだけ触りたいときは VITE_REPOSITORY=local npm run dev でモックに切り替え。
 */
export const repository: Repository =
  import.meta.env.VITE_REPOSITORY === 'local'
    ? new LocalRepository()
    : new FirestoreRepository()
