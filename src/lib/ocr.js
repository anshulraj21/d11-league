import { createWorker } from 'tesseract.js'

let worker = null

async function getWorker() {
  if (!worker) {
    worker = await createWorker('eng')
  }
  return worker
}

export async function extractTextFromImage(imageSource) {
  const w = await getWorker()
  const { data: { text } } = await w.recognize(imageSource)
  return text
}

export function terminateWorker() {
  if (worker) {
    worker.terminate()
    worker = null
  }
}
