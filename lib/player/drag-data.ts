export function getDraggedLinkText(dataTransfer: DataTransfer) {
  const uriList = dataTransfer.getData("text/uri-list")
  const firstUri = uriList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"))

  return firstUri ?? dataTransfer.getData("text/plain").trim()
}
