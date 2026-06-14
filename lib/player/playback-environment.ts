export function shouldUseMutedProgrammaticPlayback() {
  if (typeof navigator === "undefined") return false

  const userAgent = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(userAgent)

  return isIOS && isSafari
}
