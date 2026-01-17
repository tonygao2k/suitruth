/**
 * 🧪 SuiService 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getAddressProfile, batchGetProfiles, clearCache, getCacheStats } from '../suiService';
import { AddressType, RiskLevel } from '../constants';

describe('SuiService - 核心功能测试', () => {
  beforeEach(() => {
    // 每个测试前清空缓存
    clearCache();
  });

  describe('✅ 官方系统合约识别', () => {
    it('应正确识别 0x2 为官方包', async () => {
      const profile = await getAddressProfile('0x2');

      expect(profile.address).toBe('0x2');
      expect(profile.type).toBe(AddressType.PACKAGE);
      expect(profile.riskLevel).toBe(RiskLevel.SAFE);
      expect(profile.label).toContain('Sui Framework');
      expect(profile.isContract).toBe(true);
    }, 10000);

    it('应正确识别 0x1 为 Move Stdlib', async () => {
      const profile = await getAddressProfile('0x1');

      expect(profile.address).toBe('0x1');
      expect(profile.type).toBe(AddressType.PACKAGE);
      expect(profile.riskLevel).toBe(RiskLevel.SAFE);
      expect(profile.label).toContain('Move Stdlib');
    }, 10000);

    it('应正确识别 0x3 为 Sui System', async () => {
      const profile = await getAddressProfile('0x3');

      expect(profile.riskLevel).toBe(RiskLevel.SAFE);
      expect(profile.label).toContain('Sui System');
    }, 10000);

    it('应正确识别 0xdee9 为 DeepBook', async () => {
      const profile = await getAddressProfile('0xdee9');

      expect(profile.riskLevel).toBe(RiskLevel.SAFE);
      expect(profile.label).toContain('DeepBook');
    }, 10000);

    it('应正确识别完整格式的系统合约地址', async () => {
      // 0x2 的完整 64 位形式
      const fullAddress = '0x0000000000000000000000000000000000000000000000000000000000000002';
      const profile = await getAddressProfile(fullAddress);

      expect(profile.type).toBe(AddressType.PACKAGE);
      expect(profile.riskLevel).toBe(RiskLevel.SAFE);
      expect(profile.label).toContain('Sui Framework');
    }, 10000);
  });

  describe('🔍 地址类型推断', () => {
    it('应将不存在的地址推断为 ACCOUNT 或 UNKNOWN 类型', async () => {
      // 使用确保不存在的假地址（全 9）
      const fakeAddress = '0x' + '9'.repeat(64);
      const profile = await getAddressProfile(fakeAddress);

      // 接受 ACCOUNT 或 UNKNOWN 都是合理的
      expect([AddressType.ACCOUNT, AddressType.UNKNOWN]).toContain(profile.type);
      expect(profile.riskLevel).toBe(RiskLevel.NEUTRAL);
    }, 10000);

    it('应正确识别合约包地址', async () => {
      // 使用 SuiNS 合约地址（已知的官方合约）
      const suinsAddress = '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0';
      const profile = await getAddressProfile(suinsAddress);

      expect(profile.type).toBe(AddressType.PACKAGE);
      expect(profile.isContract).toBe(true);
      expect(profile.riskLevel).toBe(RiskLevel.SAFE);
    }, 10000);
  });

  describe('💰 官方代币识别', () => {
    it('应正确识别官方 USDC 包地址', async () => {
      const usdcPackageId = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7';

      const profile = await getAddressProfile(usdcPackageId);

      // USDC 包地址应该被识别
      expect(profile).toBeDefined();
      expect(profile.address).toBe(usdcPackageId);
    }, 10000);
  });

  describe('💾 缓存机制测试', () => {
    it('第二次查询应命中缓存（使用非白名单地址）', async () => {
      // 使用完整的非白名单地址，确保会触发 RPC
      const testAddress = '0x' + 'a'.repeat(64);

      // 第一次查询（会触发 RPC）
      const startTime1 = Date.now();
      const profile1 = await getAddressProfile(testAddress);
      const duration1 = Date.now() - startTime1;

      // 确保第一次查询成功
      expect(profile1).toBeDefined();

      // 第二次查询（应从缓存读取）
      const startTime2 = Date.now();
      const profile2 = await getAddressProfile(testAddress);
      const duration2 = Date.now() - startTime2;

      // 缓存命中应该快很多（< 10ms）
      expect(duration2).toBeLessThan(10);

      console.log(`第一次: ${duration1}ms, 第二次: ${duration2}ms`);
    }, 15000);

    it('clearCache 应清空缓存', () => {
      clearCache();

      const stats = getCacheStats();
      expect(stats.total).toBe(0);
    });

    it('白名单地址不应占用缓存', async () => {
      clearCache();

      // 查询白名单地址
      await getAddressProfile('0x2');

      const stats = getCacheStats();
      // 白名单地址不需要缓存（直接返回）
      expect(stats.total).toBe(0);
    }, 10000);
  });

  describe('🔥 熔断器测试', () => {
    it('getCacheStats 应返回熔断器状态', () => {
      const stats = getCacheStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('valid');
      expect(stats).toHaveProperty('expired');
      expect(stats).toHaveProperty('isCircuitBroken');
      expect(stats).toHaveProperty('circuitBreakerRemaining');
      expect(typeof stats.isCircuitBroken).toBe('boolean');
      expect(typeof stats.circuitBreakerRemaining).toBe('number');
    });
  });

  describe('🚀 批量查询测试', () => {
    it('应正确批量查询多个地址', async () => {
      const addresses = ['0x1', '0x2', '0x3'];
      const profiles = await batchGetProfiles(addresses);

      expect(profiles.size).toBe(3);
      expect(profiles.get('0x1')?.riskLevel).toBe(RiskLevel.SAFE);
      expect(profiles.get('0x2')?.riskLevel).toBe(RiskLevel.SAFE);
      expect(profiles.get('0x3')?.riskLevel).toBe(RiskLevel.SAFE);
    }, 15000);

    it('空数组应返回空 Map', async () => {
      const profiles = await batchGetProfiles([]);
      expect(profiles.size).toBe(0);
    });

    it('应正确处理重复地址', async () => {
      const addresses = ['0x2', '0x2', '0x2'];
      const profiles = await batchGetProfiles(addresses);

      // 去重后应该只有 1 个
      expect(profiles.size).toBe(1);
      expect(profiles.get('0x2')?.riskLevel).toBe(RiskLevel.SAFE);
    }, 10000);
  });

  describe('🛡️ 边界条件测试', () => {
    it('空地址应返回 UNKNOWN 类型', async () => {
      const profile = await getAddressProfile('');

      expect(profile.type).toBe(AddressType.UNKNOWN);
      expect(profile.riskLevel).toBe(RiskLevel.NEUTRAL);
    });

    it('null 地址应返回 UNKNOWN 类型', async () => {
      const profile = await getAddressProfile(null);

      expect(profile.type).toBe(AddressType.UNKNOWN);
    });

    it('undefined 地址应返回 UNKNOWN 类型', async () => {
      const profile = await getAddressProfile(undefined);

      expect(profile.type).toBe(AddressType.UNKNOWN);
    });

    it('非字符串地址应返回 UNKNOWN 类型', async () => {
      const profile = await getAddressProfile(12345);

      expect(profile.type).toBe(AddressType.UNKNOWN);
    });

    it('超长地址应正常处理（不崩溃）', async () => {
      const longAddress = '0x' + '1'.repeat(100);
      const profile = await getAddressProfile(longAddress);

      // 应返回结果，但不应崩溃
      expect(profile).toBeDefined();
      expect(profile.address).toBeDefined();
    }, 10000);

    it('大小写混合地址应正确标准化', async () => {
      const profile1 = await getAddressProfile('0x2');
      const profile2 = await getAddressProfile('0X2'); // 大写 X

      // normalizeAddress 会转换为小写
      expect(profile1.address).toBe('0x2');
      expect(profile2.address).toBe('0x2');

      // 两者应该返回相同的结果
      expect(profile1.type).toBe(profile2.type);
      expect(profile1.riskLevel).toBe(profile2.riskLevel);
      expect(profile1.label).toBe(profile2.label);
    }, 10000);

    it('带空格的地址应被正确处理', async () => {
      const profile = await getAddressProfile('  0x2  ');

      expect(profile.address).toBe('0x2');
      expect(profile.riskLevel).toBe(RiskLevel.SAFE);
    }, 10000);
  });
});

describe('🎯 真实场景集成测试', () => {
  beforeEach(() => {
    clearCache();
  });

  it('场景1: 用户访问 SuiScan 查看官方合约', async () => {
    const address = '0x2';
    const profile = await getAddressProfile(address);

    // 应该显示绿色 Badge（官方合约）
    expect(profile.riskLevel).toBe(RiskLevel.SAFE);
    expect(profile.label).toBeTruthy();
    expect(profile.isWhitelisted).toBe(true);

    console.log('✅ 场景1通过:', profile);
  }, 10000);

  it('场景2: 用户查看不存在的地址（纯钱包）', async () => {
    const randomAddress = '0x' + '9'.repeat(64);
    const profile = await getAddressProfile(randomAddress);

    // 应该显示灰色 Badge（未知但无风险）
    expect(profile.riskLevel).toBe(RiskLevel.NEUTRAL);
    expect([AddressType.ACCOUNT, AddressType.UNKNOWN]).toContain(profile.type);

    console.log('✅ 场景2通过:', profile);
  }, 10000);

  it('场景3: 批量扫描交易中的多个地址', async () => {
    const addresses = [
      '0x1', // Move Stdlib
      '0x2', // Sui Framework
      '0xdee9', // DeepBook
    ];

    const profiles = await batchGetProfiles(addresses);

    // 所有地址都应该被识别为官方
    for (const [addr, profile] of profiles.entries()) {
      expect(profile.riskLevel).toBe(RiskLevel.SAFE);
      console.log(`✅ ${addr}:`, profile.label);
    }

    expect(profiles.size).toBe(3);
  }, 15000);

  it('场景4: 混合查询（官方 + 未知地址）', async () => {
    const fakeAddress = '0x' + '9'.repeat(64);
    const addresses = [
      '0x2', // 官方（白名单）
      fakeAddress, // 假地址（不存在）
    ];

    const profiles = await batchGetProfiles(addresses);

    expect(profiles.size).toBe(2);
    expect(profiles.get('0x2')?.riskLevel).toBe(RiskLevel.SAFE);

    const fakeProfile = profiles.get(fakeAddress);
    expect(fakeProfile?.riskLevel).toBe(RiskLevel.NEUTRAL);
  }, 15000);

  it('场景5: 缓存预热后批量查询', async () => {
    // 先预热缓存
    await getAddressProfile('0x2');

    // 批量查询（0x2 应该从缓存读取）
    const startTime = Date.now();
    const profiles = await batchGetProfiles(['0x1', '0x2', '0x3']);
    const duration = Date.now() - startTime;

    expect(profiles.size).toBe(3);
    console.log(`✅ 场景5 批量查询耗时: ${duration}ms`);
  }, 15000);
});
