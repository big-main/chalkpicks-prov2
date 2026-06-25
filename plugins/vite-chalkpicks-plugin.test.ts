import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import chalkpicksPlugin, {
  VIRTUAL_STATS_MODULE,
  VIRTUAL_PICKS_MODULE,
  VIRTUAL_CONFIG_MODULE,
  setupChalkpicksHMR,
} from '../vite-chalkpicks-plugin'

describe('Vite Chalkpicks Plugin', () => {
  const testStatsDir = './test-data/stats'
  const testPicksDir = './test-data/picks'

  beforeEach(() => {
    // Create test directories
    fs.mkdirSync(testStatsDir, { recursive: true })
    fs.mkdirSync(testPicksDir, { recursive: true })

    // Create sample data files
    fs.writeFileSync(
      path.join(testStatsDir, 'NFL-latest.json'),
      JSON.stringify({ players: [{ id: '1', name: 'Test Player', stats: { yards: 300 } }] })
    )

    fs.writeFileSync(
      path.join(testPicksDir, 'NFL-latest.json'),
      JSON.stringify({ picks: [{ id: 'pick-1', sport: 'NFL', confidence: 0.8 }] })
    )
  })

  afterEach(() => {
    // Cleanup
    fs.rmSync('./test-data', { recursive: true, force: true })
  })

  describe('Plugin Initialization', () => {
    it('should create plugin with default options', () => {
      const plugin = chalkpicksPlugin()
      expect(plugin.name).toBe('vite-chalkpicks-plugin')
    })

    it('should merge custom options', () => {
      const plugin = chalkpicksPlugin({
        enableHMR: false,
        statsDir: testStatsDir,
        picksDir: testPicksDir,
      })
      expect(plugin).toBeDefined()
    })
  })

  describe('Virtual Modules', () => {
    it('should resolve stats module', () => {
      const plugin = chalkpicksPlugin()
      const resolved = plugin.resolveId?.(VIRTUAL_STATS_MODULE)
      expect(resolved).toBe(`\0${VIRTUAL_STATS_MODULE}`)
    })

    it('should resolve picks module', () => {
      const plugin = chalkpicksPlugin()
      const resolved = plugin.resolveId?.(VIRTUAL_PICKS_MODULE)
      expect(resolved).toBe(`\0${VIRTUAL_PICKS_MODULE}`)
    })

    it('should resolve config module', () => {
      const plugin = chalkpicksPlugin()
      const resolved = plugin.resolveId?.(VIRTUAL_CONFIG_MODULE)
      expect(resolved).toBe(`\0${VIRTUAL_CONFIG_MODULE}`)
    })

    it('should load stats data', () => {
      const plugin = chalkpicksPlugin({
        statsDir: testStatsDir,
        picksDir: testPicksDir,
      })
      const loaded = plugin.load?.(`\0${VIRTUAL_STATS_MODULE}`)
      expect(loaded).toContain('export default')
      expect(loaded).toContain('NFL-latest')
    })

    it('should load picks data', () => {
      const plugin = chalkpicksPlugin({
        statsDir: testStatsDir,
        picksDir: testPicksDir,
      })
      const loaded = plugin.load?.(`\0${VIRTUAL_PICKS_MODULE}`)
      expect(loaded).toContain('export default')
      expect(loaded).toContain('NFL-latest')
    })

    it('should load config data', () => {
      const plugin = chalkpicksPlugin({
        sports: ['NFL', 'NBA', 'MLB'],
        enableHMR: true,
      })
      const loaded = plugin.load?.(`\0${VIRTUAL_CONFIG_MODULE}`)
      expect(loaded).toContain('export default')
      expect(loaded).toContain('sports')
      expect(loaded).toContain('NFL')
    })
  })

  describe('Data Optimization', () => {
    it('should remove DB metadata from stats', () => {
      fs.writeFileSync(
        path.join(testStatsDir, 'test.json'),
        JSON.stringify({
          _id: 'mongo-id',
          __v: 1,
          players: [{ name: 'Test', yards: 300 }],
        })
      )

      const plugin = chalkpicksPlugin({
        statsDir: testStatsDir,
        picksDir: testPicksDir,
        optimizeBacktestData: true,
      })

      const loaded = plugin.load?.(`\0${VIRTUAL_STATS_MODULE}`)
      expect(loaded).not.toContain('mongo-id')
      expect(loaded).not.toContain('__v')
      expect(loaded).toContain('players')
    })

    it('should enrich picks with metadata', () => {
      const plugin = chalkpicksPlugin({
        statsDir: testStatsDir,
        picksDir: testPicksDir,
      })

      const loaded = plugin.load?.(`\0${VIRTUAL_PICKS_MODULE}`)
      expect(loaded).toContain('confidence')
      expect(loaded).toContain('timestamp')
    })

    it('should compress numeric values', () => {
      fs.writeFileSync(
        path.join(testStatsDir, 'test.json'),
        JSON.stringify({
          value: 3.14159265,
          nested: { number: 2.71828182 },
        })
      )

      const plugin = chalkpicksPlugin({
        statsDir: testStatsDir,
        picksDir: testPicksDir,
        compressData: true,
      })

      const loaded = plugin.load?.(`\0${VIRTUAL_STATS_MODULE}`)
      expect(loaded).toContain('3.142') // Rounded to 3 decimals
    })
  })

  describe('Build Time', () => {
    it('should generate metadata during build', async () => {
      const plugin = chalkpicksPlugin({
        statsDir: testStatsDir,
        picksDir: testPicksDir,
        sports: ['NFL', 'NBA'],
      })

      const bundle: Record<string, unknown> = {}
      await plugin.generateBundle?.({} as never, bundle as never)

      expect(bundle['chalkpicks-metadata.json']).toBeDefined()
      const metadata = bundle['chalkpicks-metadata.json'] as Record<string, unknown>
      expect(metadata.type).toBe('asset')
      expect(metadata.fileName).toBe('chalkpicks-metadata.json')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing stats directory gracefully', () => {
      const plugin = chalkpicksPlugin({
        statsDir: './non-existent-stats',
        picksDir: testPicksDir,
      })

      const loaded = plugin.load?.(`\0${VIRTUAL_STATS_MODULE}`)
      expect(loaded).toBe('export default {}')
    })

    it('should handle invalid JSON gracefully', () => {
      fs.writeFileSync(path.join(testStatsDir, 'invalid.json'), '{invalid json}')

      const plugin = chalkpicksPlugin({
        statsDir: testStatsDir,
        picksDir: testPicksDir,
      })

      const loaded = plugin.load?.(`\0${VIRTUAL_STATS_MODULE}`)
      expect(loaded).toBeDefined()
      // Should still return valid export
      expect(loaded).toContain('export default')
    })
  })

  describe('HMR Setup', () => {
    it('should export setupChalkpicksHMR function', () => {
      expect(typeof setupChalkpicksHMR).toBe('function')
    })

    it('should handle HMR events in browser environment', () => {
      // Mock import.meta.hot
      const mockHot = {
        on: vi.fn(),
      }

      global.import = {
        meta: {
          hot: mockHot,
        },
      } as any

      setupChalkpicksHMR()

      expect(mockHot.on).toHaveBeenCalledWith(
        'chalkpicks:stats-updated',
        expect.any(Function)
      )
      expect(mockHot.on).toHaveBeenCalledWith(
        'chalkpicks:picks-updated',
        expect.any(Function)
      )
      expect(mockHot.on).toHaveBeenCalledWith(
        'chalkpicks:stats-polled',
        expect.any(Function)
      )
    })
  })

  describe('Configuration', () => {
    it('should use default options when none provided', () => {
      const plugin = chalkpicksPlugin()
      // Plugin should be usable with defaults
      expect(plugin.name).toBe('vite-chalkpicks-plugin')
    })

    it('should support all sports', () => {
      const plugin = chalkpicksPlugin({
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'MLS', 'NCAAB', 'NCAAF'],
      })

      const loaded = plugin.load?.(`\0${VIRTUAL_CONFIG_MODULE}`)
      expect(loaded).toContain('NFL')
      expect(loaded).toContain('NBA')
      expect(loaded).toContain('MLS')
      expect(loaded).toContain('NCAAB')
    })

    it('should respect cache busting strategy', () => {
      const pluginHash = chalkpicksPlugin({ cacheBusting: 'hash' })
      const pluginTimestamp = chalkpicksPlugin({ cacheBusting: 'timestamp' })

      expect(pluginHash).toBeDefined()
      expect(pluginTimestamp).toBeDefined()
    })
  })
})
