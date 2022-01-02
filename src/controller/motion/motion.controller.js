const Bunyan = require('bunyan');
const EscapeRegExp = require('lodash.escaperegexp');
const { FileSystem, FtpSrv } = require('ftp-srv');
const http = require('http');
const ip = require('ip');
const mqtt = require('mqtt');
const { parse } = require('url');
const path = require('path');
const { SMTPServer } = require('smtp-server');
const Stream = require('stream');

const { ConfigService } = require('../../services/config/config.service');
const { LoggerService } = require('../../services/logger/logger.service');

const { Database } = require('../../api/database');

const { log } = LoggerService;

class MotionController {
  static #controller;
  static #socket;
  static #motionTimers = new Map();

  static httpServer = null;
  static mqttClient = null;
  static smtpServer = null;
  static ftpServer = null;

  constructor(controller, socket) {
    MotionController.#controller = controller;
    MotionController.#socket = socket;

    if (ConfigService.ui.http) {
      MotionController.startHttpServer();
    }

    if (ConfigService.ui.mqtt) {
      MotionController.startMqttClient();
    }

    if (ConfigService.ui.smtp) {
      MotionController.startSmtpServer();
    }

    if (ConfigService.ui.ftp) {
      MotionController.startFtpServer();
    }

    //used for external events
    this.triggerMotion = MotionController.triggerMotion = async (cameraName, state) => {
      let result = {
        error: true,
        message: 'Custom event could not be handled',
      };

      result = await MotionController.#handleMotion('custom', cameraName, state, 'extern', result);

      log.debug(`Received a new EXTERN message ${JSON.stringify(result)} (${cameraName})`);
    };

    this.httpServer = MotionController.httpServer;
    this.startHttpServer = MotionController.startHttpServer;
    this.closeHttpServer = MotionController.closeHttpServer;

    this.mqttClient = MotionController.mqttClient;
    this.startMqttClient = MotionController.startMqttClient;
    this.closeMqttClient = MotionController.closeMqttClient;

    this.smtpServer = MotionController.smtpServer;
    this.startSmtpServer = MotionController.startSmtpServer;
    this.closeSmtpServer = MotionController.closeSmtpServer;

    this.ftpServer = MotionController.ftpServer;
    this.startFtpServer = MotionController.startFtpServer;
    this.closeFtpServer = MotionController.closeFtpServer;
  }

  static startHttpServer() {
    log.debug('Setting up HTTP server for motion detection...');

    const hostname = ConfigService.ui.http.localhttp ? 'localhost' : undefined;

    MotionController.httpServer = http.createServer();

    MotionController.httpServer.on('listening', async () => {
      let addr = MotionController.httpServer.address();
      let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

      log.debug(`HTTP server for motion detection is listening on ${bind}`);

      MotionController.#socket.emit('httpStatus', {
        status: 'online',
      });
    });

    MotionController.httpServer.on('error', (error) => {
      let error_;

      if (error.syscall !== 'listen') {
        log.error(error, 'HTTP Server', 'motion');
      }

      let bind = typeof port === 'string' ? 'Pipe ' + ConfigService.ui.http.port : 'Port ' + ConfigService.ui.http.port;

      switch (error.code) {
        case 'EACCES':
          error_ = `Can not start the HTTP server for motion detection! ${bind} requires elevated privileges`;
          break;
        case 'EADDRINUSE':
          error_ = `Can not start the HTTP server for motion detection! ${bind} is already in use`;
          break;
        default:
          error_ = error;
      }

      log.error(error_, 'HTTP Server', 'motion');

      MotionController.#socket.emit('httpStatus', {
        status: 'offline',
      });
    });

    MotionController.httpServer.on('request', async (request, response) => {
      let result = {
        error: true,
        message: `Malformed URL ${request.url}`,
      };

      let cameraName;

      if (request.url) {
        const parseurl = parse(request.url);

        if (parseurl.pathname && parseurl.query) {
          cameraName = decodeURIComponent(parseurl.query);

          // => /motion
          // => /motion/reset
          // => /doorbell

          let triggerType = parseurl.pathname.includes('/reset') ? 'reset' : parseurl.pathname.split('/')[1];
          let state = triggerType === 'dorbell' ? true : triggerType === 'reset' ? false : true;
          triggerType = triggerType === 'reset' ? 'motion' : triggerType;

          result = await MotionController.#handleMotion(triggerType, cameraName, state, 'http', result);
        }
      }

      log.debug(`Received a new HTTP message ${JSON.stringify(result)} (${cameraName})`);

      response.writeHead(result.error ? 500 : 200);
      response.write(JSON.stringify(result));
      response.end();
    });

    MotionController.httpServer.on('close', () => {
      log.debug('HTTP Server closed');

      MotionController.#socket.emit('httpStatus', {
        status: 'offline',
      });
    });

    MotionController.httpServer.listen(ConfigService.ui.http.port, hostname);
  }

  static startMqttClient() {
    log.debug('Setting up MQTT client for motion detection...');

    MotionController.mqttClient = mqtt.connect(
      (ConfigService.ui.mqtt.tls ? 'mqtts://' : 'mqtt://') +
        ConfigService.ui.mqtt.host +
        ':' +
        ConfigService.ui.mqtt.port,
      {
        username: ConfigService.ui.mqtt.username,
        password: ConfigService.ui.mqtt.password,
      }
    );

    MotionController.mqttClient.on('connect', () => {
      log.debug(`MQTT Client for motion detection connected to broker on port ${ConfigService.ui.mqtt.port}`);

      for (const [topic] of ConfigService.ui.topics) {
        log.debug(`Subscribing to MQTT topic: ${topic}`);
        MotionController.mqttClient.subscribe(topic + '/#');
      }

      MotionController.#socket.emit('mqttStatus', {
        status: 'online',
      });
    });

    MotionController.mqttClient.on('message', async (topic, message) => {
      let result = {
        error: true,
        message: `Malformed MQTT message ${message.toString()} (${topic})`,
      };

      let cameraName;

      const cameraMqttConfig = ConfigService.ui.topics.get(topic);

      if (cameraMqttConfig) {
        message = message.toString();

        cameraName = cameraMqttConfig.camera;
        let triggerType = cameraMqttConfig.motion ? 'motion' : 'doorbell';

        let state =
          triggerType === 'doorbell'
            ? true
            : cameraMqttConfig.reset
            ? message === cameraMqttConfig.motionResetMessage
              ? false
              : undefined
            : message === cameraMqttConfig.motionMessage
            ? true
            : message === cameraMqttConfig.motionResetMessage
            ? false
            : undefined;

        result =
          state !== undefined
            ? await MotionController.#handleMotion(triggerType, cameraName, state, 'mqtt', result)
            : {
                error: true,
                message: `The incoming MQTT message (${message}) for the topic (${topic}) was not the same as set in config.json. Skip...`,
              };
      } else {
        result = {
          error: true,
          message: `Can not assign the MQTT topic (${topic}) to a camera!`,
        };
      }

      log.debug(`Received a new message ${JSON.stringify(result)} (${cameraName})`, 'MQTT');
    });

    MotionController.mqttClient.on('end', () => {
      log.debug('MQTT client disconnected');

      MotionController.#socket.emit('mqttStatus', {
        status: 'offline',
      });
    });
  }

  static startSmtpServer() {
    log.debug('Setting up SMTP server for motion detection...');

    const regex = new RegExp(EscapeRegExp(ConfigService.ui.smtp.space_replace), 'g');

    const bunyan = Bunyan.createLogger({
      name: 'smtp',
      streams: [
        {
          stream: new Stream.Writable({
            write: (chunk, _encoding, callback) => {
              const data = JSON.parse(chunk);

              if (data.level >= 50) {
                log.error(data.msg, 'SMTP', 'motion');
              } else if (data.level >= 40) {
                log.warn(data.msg, 'SMTP', 'motion');
              }

              callback();
            },
          }),
        },
      ],
    });

    MotionController.smtpServer = new SMTPServer({
      authOptional: true,
      disabledCommands: ['STARTTLS'],
      disableReverseLookup: true,
      logger: bunyan,
      onAuth(_auth, _session, callback) {
        callback(null, { user: true });
      },
      async onData(stream, session, callback) {
        stream.on('data', () => {});
        stream.on('end', callback);

        log.debug(session, 'SMTP');

        for (const rcptTo of session.envelope.rcptTo) {
          const name = rcptTo.address.split('@')[0].replace(regex, ' ');
          log.debug(`Email received (${name}).`, 'SMTP');

          const result = await MotionController.#handleMotion('motion', name, true, 'smtp', {});
          log.debug(`Received a new SMTP message ${JSON.stringify(result)} (${name})`);
        }
      },
    });

    MotionController.smtpServer.server.on('listening', () => {
      log.debug(`SMTP server for motion detection is listening on port ${ConfigService.ui.smtp.port}`);

      MotionController.#socket.emit('smtpStatus', {
        status: 'online',
      });
    });

    MotionController.smtpServer.server.on('close', () => {
      log.debug('SMTP Server closed');

      MotionController.#socket.emit('smtpStatus', {
        status: 'offline',
      });
    });

    MotionController.smtpServer.listen(ConfigService.ui.smtp.port);
  }

  static startFtpServer() {
    log.debug('Setting up FTP server for motion detection...');

    const ipAddr = ip.address('public', 'ipv4');

    const bunyan = Bunyan.createLogger({
      name: 'ftp',
      streams: [
        {
          stream: new Stream.Writable({
            write: (chunk, _encoding, callback) => {
              const data = JSON.parse(chunk);

              if (data.level >= 50) {
                if (data.err?.message !== 'Server is not running.') {
                  log.error(data.msg, 'FTP', 'motion');
                }
              } else if (data.level >= 40) {
                log.warn(data.msg, 'FTP', 'motion');
              }

              callback();
            },
          }),
        },
      ],
    });

    MotionController.ftpServer = new FtpSrv({
      url: `ftp://${ipAddr}:${ConfigService.ui.ftp.port}`,
      pasv_url: ipAddr,
      anonymous: true,
      blacklist: ['MKD', 'APPE', 'RETR', 'DELE', 'RNFR', 'RNTO', 'RMD'],
      log: bunyan,
    });

    MotionController.ftpServer.on('login', (data, resolve) => {
      resolve({
        fs: new (class extends FileSystem {
          constructor() {
            super();
            this.connection = data.connection;
            this.realCwd = '/';
          }

          get(fileName) {
            return {
              name: fileName,
              isDirectory: () => true,
              size: 1,
              atime: new Date(),
              mtime: new Date(),
              ctime: new Date(),
              uid: 0,
              gid: 0,
            };
          }

          list(filePath = '.') {
            filePath = path.resolve(this.realCwd, filePath);

            const directories = [...this.get('.')];
            const pathSplit = filePath.split('/').filter((value) => value.length > 0);

            if (pathSplit.length === 0) {
              for (const camera of ConfigService.ui.cameras) {
                directories.push(this.get(camera.name));
              }
            } else {
              directories.push(this.get('..'));
            }

            return directories;
          }

          chdir(filePath = '.') {
            filePath = path.resolve('/', filePath);
            this.realCwd = filePath;
            return filePath;
          }

          // eslint-disable-next-line no-unused-vars
          async write(fileName, { append = false, start }) {
            const filePath = path.resolve(this.realCwd, fileName);
            const pathSplit = path
              .dirname(filePath)
              .split('/')
              .filter((value) => value);

            if (pathSplit.length > 0) {
              const name = pathSplit[0];
              log.debug(`Receiving file. (${name}).`, 'FTP');

              const result = await MotionController.#handleMotion('motion', name, true, 'ftp', {});
              log.debug(`Received a new FTP message ${JSON.stringify(result)} (${name})`);
            } else {
              this.connection.reply(550, 'Permission denied.');
            }

            return new Stream.Writable({
              write: (chunk, encoding, callback) => {
                callback();
              },
            });
          }

          // eslint-disable-next-line no-unused-vars
          chmod(filePath, mode) {
            return;
          }

          // eslint-disable-next-line no-unused-vars
          mkdir(filePath) {
            this.connection.reply(550, 'Permission denied.');
            return this.realCwd;
          }

          // eslint-disable-next-line no-unused-vars
          read(fileName, { start }) {
            this.connection.reply(550, 'Permission denied.');
            return;
          }

          // eslint-disable-next-line no-unused-vars
          delete(filePath) {
            this.connection.reply(550, 'Permission denied.');
            return;
          }

          // eslint-disable-next-line no-unused-vars
          rename(from, to) {
            this.connection.reply(550, 'Permission denied.');
            return;
          }
        })(),
        cwd: '/',
      });
    });

    MotionController.ftpServer.server.on('listening', () => {
      log.debug(`FTP server for motion detection is listening on port ${ConfigService.ui.ftp.port}`);

      MotionController.#socket.emit('ftpStatus', {
        status: 'online',
      });
    });

    MotionController.ftpServer.server.on('close', () => {
      if (!MotionController.ftpServer.server.alreadyClosed) {
        MotionController.ftpServer.server.alreadyClosed = true;

        log.debug('FTP Server closed');

        MotionController.#socket.emit('ftpStatus', {
          status: 'offline',
        });
      }
    });

    MotionController.ftpServer.listen();
  }

  static closeHttpServer() {
    if (MotionController.httpServer) {
      MotionController.httpServer.close();
    }
  }

  static closeMqttClient() {
    if (MotionController.mqttClient) {
      MotionController.mqttClient.end();
    }
  }

  static closeSmtpServer() {
    if (MotionController.smtpServer) {
      MotionController.smtpServer.close();
    }
  }

  static closeFtpServer() {
    if (MotionController.ftpServer) {
      MotionController.ftpServer.close();
    }
  }

  static #getCamera(cameraName) {
    return ConfigService.ui.cameras.find((camera) => camera && camera.name === cameraName);
  }

  static async #handleMotion(triggerType, cameraName, state, event, result) {
    const camera = MotionController.#getCamera(cameraName);

    if (camera) {
      const generalSettings = await Database.interfaceDB.get('settings').get('general').value();
      const atHome = generalSettings?.atHome || false;
      const cameraExcluded = (generalSettings?.exclude || []).includes(cameraName);

      if (atHome && !cameraExcluded) {
        result = {
          error: false,
          message: `Skip motion trigger. At Home is active and ${cameraName} is not excluded!`,
        };
      } else {
        result = {
          error: false,
          message: 'Handled through extern controller',
        };

        //if handled through EXTERN controller, motionTimeout should also be handled through EXTERN controller
        MotionController.#controller.emit('motion', cameraName, triggerType, state, event);

        if (camera.recordOnMovement) {
          //if handled through INTERN controller, motionTimeout should also be handled through INTERN controller
          result.message = 'Handled through intern controller';

          const timeout = MotionController.#motionTimers.get(camera.name);
          const timeoutConfig = camera.motionTimeout >= 0 ? camera.motionTimeout : 1;

          if (timeout) {
            if (state) {
              result.message += ' - Skip motion event, timeout active!';
            } else {
              clearTimeout(timeout);
              MotionController.#motionTimers.delete(camera.name);

              MotionController.#controller.emit('uiMotion', {
                triggerType: triggerType,
                cameraName: cameraName,
                state: state,
              });
            }
          } else {
            if (state && timeoutConfig > 0) {
              const timer = setTimeout(() => {
                log.info('Motion handler timeout. (ui)', camera.name);
                MotionController.#motionTimers.delete(camera.name);
              }, timeoutConfig * 1000);

              MotionController.#motionTimers.set(camera.name, timer);
            }

            MotionController.#controller.emit('uiMotion', {
              triggerType: triggerType,
              cameraName: cameraName,
              state: state,
            });
          }
        }
      }
    } else {
      result = {
        error: true,
        message: `Camera '${cameraName}' not found`,
      };
    }

    return result;
  }
}

exports.MotionController = MotionController;
