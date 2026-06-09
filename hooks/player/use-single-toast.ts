"use client"

import { useCallback } from "react"
import { toast } from "react-toastify"

import { TOAST_AUTO_CLOSE_MS, TRACK_ADDED_TOAST_ID } from "@/lib/player/constants"

export function useSingleToast() {
  return useCallback((message: string) => {
    toast.clearWaitingQueue()

    if (toast.isActive(TRACK_ADDED_TOAST_ID)) {
      toast.update(TRACK_ADDED_TOAST_ID, {
        render: message,
        type: "success",
        autoClose: TOAST_AUTO_CLOSE_MS,
      })
      return
    }

    toast.success(message, { toastId: TRACK_ADDED_TOAST_ID })
  }, [])
}
