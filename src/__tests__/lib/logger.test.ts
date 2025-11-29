import { logger, createLogger, authLogger, fleetLogger } from '@/lib/logger'

describe('Logger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance
    info: jest.SpyInstance
    warn: jest.SpyInstance
    error: jest.SpyInstance
  }

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('default logger', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message')
      expect(consoleSpy.debug).toHaveBeenCalled()
    })

    it('should log info messages', () => {
      logger.info('Info message')
      expect(consoleSpy.info).toHaveBeenCalled()
    })

    it('should log warn messages', () => {
      logger.warn('Warning message')
      expect(consoleSpy.warn).toHaveBeenCalled()
    })

    it('should log error messages', () => {
      logger.error('Error message')
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should include data in log output', () => {
      logger.info('Message with data', { userId: '123', action: 'login' })
      expect(consoleSpy.info).toHaveBeenCalled()
      const logOutput = consoleSpy.info.mock.calls[0][0]
      expect(logOutput).toContain('Message with data')
    })

    it('should handle error objects', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error)
      expect(consoleSpy.error).toHaveBeenCalled()
    })
  })

  describe('createLogger', () => {
    it('should create logger with context', () => {
      const customLogger = createLogger('custom')
      customLogger.info('Custom log message')
      expect(consoleSpy.info).toHaveBeenCalled()
      const logOutput = consoleSpy.info.mock.calls[0][0]
      expect(logOutput).toContain('custom')
    })
  })

  describe('pre-configured loggers', () => {
    it('authLogger should have auth context', () => {
      authLogger.info('Auth event')
      expect(consoleSpy.info).toHaveBeenCalled()
      const logOutput = consoleSpy.info.mock.calls[0][0]
      expect(logOutput).toContain('auth')
    })

    it('fleetLogger should have fleet context', () => {
      fleetLogger.info('Fleet event')
      expect(consoleSpy.info).toHaveBeenCalled()
      const logOutput = consoleSpy.info.mock.calls[0][0]
      expect(logOutput).toContain('fleet')
    })
  })

  describe('child logger', () => {
    it('should create child logger with combined context', () => {
      const parentLogger = createLogger('parent')
      const childLogger = parentLogger.child('child')
      childLogger.info('Child log message')
      expect(consoleSpy.info).toHaveBeenCalled()
      const logOutput = consoleSpy.info.mock.calls[0][0]
      expect(logOutput).toContain('parent:child')
    })
  })

  describe('error logging', () => {
    it('should log error with stack trace', () => {
      const error = new Error('Test error with stack')
      logger.error('An error occurred', error)
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should handle non-Error objects', () => {
      logger.error('Non-error object', { code: 'ERR_001' })
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should handle string errors', () => {
      logger.error('String error', 'Something went wrong')
      expect(consoleSpy.error).toHaveBeenCalled()
    })
  })
})
