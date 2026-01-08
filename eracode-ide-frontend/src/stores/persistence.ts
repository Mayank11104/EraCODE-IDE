import { openDB } from 'idb'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

const dbPromise = openDB('eracode-db', 1, {
    upgrade(db) {
        db.createObjectStore('zustand-store')
    },
})

export const createIDBStorage = <S>(): PersistStorage<S> => ({
    getItem: async (name: string): Promise<StorageValue<S> | null> => {
        const value = await (await dbPromise).get('zustand-store', name)
        return value || null
    },
    setItem: async (name: string, value: StorageValue<S>): Promise<void> => {
        await (await dbPromise).put('zustand-store', value, name)
    },
    removeItem: async (name: string): Promise<void> => {
        await (await dbPromise).delete('zustand-store', name)
    },
})
