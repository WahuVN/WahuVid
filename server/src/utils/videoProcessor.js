const ffmpeg = require('fluent-ffmpeg');
const cloudStorage = require('./cloudStorage');

class VideoProcessor {
  async processVideo(videoUrl) {
    const processedFilename = `processed-${Date.now()}.mp4`;
    const thumbnailFilename = `thumbnail-${Date.now()}.jpg`;

    // Tải video về local
    const localVideoPath = await this.downloadVideo(videoUrl);

    // Xử lý video
    const processedVideoPath = await this.compressVideo(localVideoPath, processedFilename);
    const thumbnailPath = await this.createThumbnail(localVideoPath, thumbnailFilename);

    // Upload video đã xử lý và thumbnail lên cloud storage
    const processedVideoUrl = await cloudStorage.uploadFile(processedVideoPath, processedFilename, 'video/mp4');
    const thumbnailUrl = await cloudStorage.uploadFile(thumbnailPath, thumbnailFilename, 'image/jpeg');

    // Xóa các file tạm
    await this.deleteLocalFile(localVideoPath);
    await this.deleteLocalFile(processedVideoPath);
    await this.deleteLocalFile(thumbnailPath);

    return { processedVideoUrl, thumbnailUrl };
  }

  async compressVideo(inputPath, outputFilename) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions('-vf', 'scale=-2:720') // Giảm độ phân giải xuống 720p
        .outputOptions('-c:v', 'libx264')     // Sử dụng codec H.264
        .outputOptions('-crf', '23')          // Cân bằng giữa chất lượng và kích thước file
        .output(outputFilename)
        .on('end', () => resolve(outputFilename))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async createThumbnail(inputPath, outputFilename) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          count: 1,
          folder: './',
          filename: outputFilename,
          size: '320x240'
        })
        .on('end', () => resolve(outputFilename))
        .on('error', (err) => reject(err));
    });
  }

  // Các phương thức hỗ trợ khác (downloadVideo, deleteLocalFile, ...)
}

module.exports = new VideoProcessor();
