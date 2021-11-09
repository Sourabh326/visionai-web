'use-strict';

const { spawn } = require('child_process');
const readline = require('readline');

const { LoggerService } = require('../../../services/logger/logger.service');

const { log } = LoggerService;

class MediaService {
  #camera;

  constructor(camera) {
    //log.debug('Initializing camera probe', camera.name);

    this.#camera = camera;

    this.cameraName = camera.name;
    this.debug = camera.videoConfig.debug;
    this.ffmpegInput = camera.videoConfig.source;

    this.codecs = {
      probe: false,
      audio: [],
      video: [],
    };
  }

  async probe() {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      log.debug(`Probe stream: ${this.ffmpegInput}`, this.cameraName);

      const arguments_ = ['-hide_banner', '-loglevel', 'info', ...this.ffmpegInput.split(' ')];

      let cp = spawn('ffmpeg', arguments_, {
        env: process.env,
      });

      const stderr = readline.createInterface({
        input: cp.stderr,
        terminal: false,
      });

      stderr.on('line', (line) => {
        const audioLine = line.includes('Audio: ') ? line.split('Audio: ')[1] : false;

        if (audioLine) {
          this.codecs.audio = audioLine.split(', ');
        }

        const videoLine = line.includes('Video: ') ? line.split('Video: ')[1] : false;

        if (videoLine) {
          this.codecs.video = videoLine.split(', ');
        }
      });

      cp.on('exit', () => {
        this.codecs.probe = true;
        log.debug(this.codecs, this.cameraName);

        cp = null;

        resolve(this.codecs);
      });

      setTimeout(() => {
        if (cp) {
          cp.kill();
          cp = null;

          resolve(this.codecs);
        }
      }, 10000);
    });
  }
}

exports.MediaService = MediaService;