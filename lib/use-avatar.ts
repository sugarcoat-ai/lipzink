"use client"

import { useSyncExternalStore } from "react"

import { type AvatarConfig, DEFAULT_AVATAR } from "@/lib/avatar"

// localStorage-backed avatar store, exposed through useSyncExternalStore so the
// persisted avatar is read consistently (no setState-in-effect, no hydration
// mismatch) and shared across the maker and talk pages.

const KEY = "avatalk:avatar"
const listeners = new Set<() => void>()

let cache: AvatarConfig = DEFAULT_AVATAR
let cacheRaw: string | null = null

function read(): AvatarConfig {
  if (typeof window === "undefined") return DEFAULT_AVATAR
  const raw = window.localStorage.getItem(KEY)
  // Return a stable reference while the stored string is unchanged, as
  // useSyncExternalStore requires.
  if (raw === cacheRaw) return cache
  cacheRaw = raw
  try {
    cache = raw ? { ...DEFAULT_AVATAR, ...JSON.parse(raw) } : DEFAULT_AVATAR
  } catch {
    cache = DEFAULT_AVATAR
  }
  return cache
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  window.addEventListener("storage", callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener("storage", callback)
  }
}

/** Read the persisted avatar config (reactive). */
export function useAvatarConfig(): AvatarConfig {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_AVATAR)
}

/** Persist a new avatar config and notify subscribers. */
export function setAvatarConfig(config: AvatarConfig): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(config))
  } catch {
    // ignore quota / privacy-mode errors
  }
  cacheRaw = null // force re-read on next snapshot
  listeners.forEach((l) => l())
}
