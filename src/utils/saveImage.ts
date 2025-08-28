/**
 * 保存el-image图片到本地
 * @param imageUrl 图片URL地址
 * @param fileName 保存的文件名（可选）
 */
export const saveImageToLocal = async (imageUrl: string, fileName?: string): Promise<void> => {
  try {
    // 创建一个新的Image对象来处理跨域问题
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    // 等待图片加载完成
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = imageUrl
    })

    // 创建canvas元素
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('无法获取canvas上下文')
    }

    // 设置canvas尺寸与图片一致
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    ctx.drawImage(img, 0, 0)

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('转换图片失败'))
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName || `image-${Date.now()}.png`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        resolve()
      }, 'image/png')
    })
  } catch (error) {
    throw error
  }
}