"use client"

import { useCallback, useRef } from "react"
import { toast } from "react-toastify"

import { TRACK_ADDED_TOAST_ID } from "@/lib/player/constants"

export function useSingleToast() {
  const toastSequenceRef = useRef(0)

  return useCallback((message: string) => {
    toast.clearWaitingQueue()

    toastSequenceRef.current += 1
    const toastId = `${TRACK_ADDED_TOAST_ID}-${Date.now()}-${toastSequenceRef.current}`

    toast.success(message, { toastId })
  }, [])
}
