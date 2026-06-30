import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

function readAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function toDataUri(uri) {
  if (uri.startsWith('data:')) return uri
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.readFile({ path: uri })
    const prefix = uri.toLowerCase().endsWith('.png') ? 'data:image/png;base64,' : 'data:image/jpeg;base64,'
    return `${prefix}${result.data}`
  }
  const response = await fetch(uri)
  const blob = await response.blob()
  return readAsDataURL(blob)
}

export async function takePhoto() {
  const image = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    quality: 80,
  })
  const uri = image.path || image.webPath
  return uri ? toDataUri(uri) : null
}

export async function pickPhoto() {
  const image = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Photos,
    quality: 80,
  })
  const uri = image.path || image.webPath
  return uri ? toDataUri(uri) : null
}

export async function deletePhoto(ruta) {
  if (!ruta || ruta.startsWith('data:')) return
  try {
    await Filesystem.deleteFile({ path: ruta, directory: Directory.Data })
  } catch {
    // file may not exist
  }
}

export async function getPhotoUri(ruta) {
  if (!ruta) return null
  if (ruta.startsWith('data:')) return ruta
  try {
    const result = await Filesystem.readFile({ path: ruta, directory: Directory.Data })
    return `data:image/jpeg;base64,${result.data}`
  } catch {
    return ruta
  }
}
