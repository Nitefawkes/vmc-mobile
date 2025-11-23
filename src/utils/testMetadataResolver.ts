/**
 * Test Utility for Metadata Resolver
 * Phase 0: "Hello Cassette" Proof of Concept
 *
 * This demonstrates the core functionality of the metadata resolver
 * with sample UPCs from vintage cassette tapes.
 */

import { resolveMetadata } from '../services/metadataResolver';

// Sample UPCs for testing (real cassette tape barcodes)
const TEST_UPCS = {
  // Michael Jackson - Thriller (Cassette)
  thriller: '074643811842',

  // Pink Floyd - The Dark Side of the Moon
  darkSide: '077774644242',

  // The Beatles - Abbey Road
  abbeyRoad: '724383958443',

  // Nirvana - Nevermind
  nevermind: '720642442128',

  // Fleetwood Mac - Rumours
  rumours: '081227970642',
};

/**
 * Test metadata resolution for a single UPC
 */
export async function testSingleUPC(upc: string): Promise<void> {
  console.log('\n=== Testing UPC:', upc, '===');
  const startTime = Date.now();

  try {
    const metadata = await resolveMetadata(upc);
    const duration = Date.now() - startTime;

    if (metadata) {
      console.log('✅ SUCCESS in', duration, 'ms');
      console.log('Artist:', metadata.artist);
      console.log('Title:', metadata.title);
      console.log('Year:', metadata.year || 'Unknown');
      console.log('Label:', metadata.label || 'Unknown');
      console.log('Genre:', metadata.genre?.join(', ') || 'Unknown');
      console.log('Cover Art:', metadata.coverArtUrl ? 'Yes' : 'No');
    } else {
      console.log('❌ FAILED - No metadata found');
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

/**
 * Run full Phase 0 test suite
 */
export async function runPhase0Tests(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Phase 0: "Hello Cassette" - Metadata POC       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const results: Array<{ upc: string; success: boolean; duration: number }> = [];

  for (const [name, upc] of Object.entries(TEST_UPCS)) {
    console.log(`\nTesting ${name}...`);
    const startTime = Date.now();

    try {
      const metadata = await resolveMetadata(upc);
      const duration = Date.now() - startTime;
      const success = metadata !== null;

      results.push({ upc, success, duration });

      if (success) {
        console.log(`✅ ${name}: ${metadata!.artist} - ${metadata!.title} (${duration}ms)`);
      } else {
        console.log(`❌ ${name}: No metadata found (${duration}ms)`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({ upc, success: false, duration });
      console.log(`❌ ${name}: Error (${duration}ms)`);
    }

    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Test Results Summary                            ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const successCount = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const successRate = (successCount / results.length) * 100;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${results.length - successCount}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Average Duration: ${avgDuration.toFixed(0)}ms`);
  console.log(`Target: ≥90% success, ≤600ms median\n`);

  if (successRate >= 90 && avgDuration <= 600) {
    console.log('🎉 Phase 0 "Hello Cassette" - MILESTONE ACHIEVED! 🎉\n');
  } else {
    console.log('⚠️  Phase 0 targets not yet met. Continue optimization.\n');
  }
}

// Export test UPCs for use in other parts of the app
export { TEST_UPCS };
