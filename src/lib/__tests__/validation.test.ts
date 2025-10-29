/**
 * Test file for validation utilities
 * Run with: npx tsx src/lib/__tests__/validation.test.ts
 */

import { normalizeMaterial } from '../validation';

console.log('🧪 Testing Material Normalization\n');

// Test cases for material normalization
const testCases = [
  // Direct matches
  { input: 'Cotton', expected: 'Cotton' },
  { input: 'cotton', expected: 'Cotton' },
  { input: 'Wool', expected: 'Wool' },
  { input: 'Polyester', expected: 'Polyester' },
  { input: 'Nylon', expected: 'Nylon' },
  { input: 'Denim', expected: 'Denim' },
  { input: 'Leather', expected: 'Leather' },
  { input: 'Silk', expected: 'Silk' },
  { input: 'Linen', expected: 'Linen' },
  { input: 'Fleece', expected: 'Fleece' },
  { input: 'Gore-Tex', expected: 'Gore-Tex' },
  { input: 'Synthetic', expected: 'Synthetic' },
  
  // Cotton blends (the main issue from the error)
  { input: 'Cotton Blend', expected: 'Cotton' },
  { input: 'cotton blend', expected: 'Cotton' },
  { input: '95% Cotton, 5% Spandex', expected: 'Cotton' },
  { input: 'Cotton/Polyester Blend', expected: 'Cotton' },
  
  // Wool blends
  { input: 'Wool Blend', expected: 'Wool' },
  { input: 'Merino Wool', expected: 'Wool' },
  { input: 'Cashmere', expected: 'Wool' },
  { input: 'wool/polyester', expected: 'Wool' },
  
  // Synthetic materials
  { input: 'Spandex', expected: 'Synthetic' },
  { input: 'Elastane', expected: 'Synthetic' },
  { input: 'Lycra', expected: 'Synthetic' },
  { input: 'Acrylic', expected: 'Synthetic' },
  { input: 'Rayon', expected: 'Synthetic' },
  { input: 'Viscose', expected: 'Synthetic' },
  { input: 'poly', expected: 'Polyester' },
  
  // Special materials
  { input: 'Waterproof Fabric', expected: 'Gore-Tex' },
  { input: 'Technical Fabric', expected: 'Gore-Tex' },
  { input: 'Suede', expected: 'Leather' },
  { input: 'Jean Material', expected: 'Denim' },
  { input: 'Polar Fleece', expected: 'Fleece' },
  
  // Edge cases
  { input: null, expected: 'Cotton' },
  { input: undefined, expected: 'Cotton' },
  { input: '', expected: 'Cotton' },
  { input: '  ', expected: 'Cotton' },
  { input: 'Unknown Material', expected: 'Cotton' },
];

let passed = 0;
let failed = 0;

console.log('Running material normalization tests...\n');

testCases.forEach(({ input, expected }) => {
  const result = normalizeMaterial(input as string);
  const status = result === expected ? '✅' : '❌';
  
  if (result === expected) {
    passed++;
  } else {
    failed++;
    console.log(`${status} FAIL: "${input}" → got "${result}", expected "${expected}"`);
  }
});

console.log(`\n📊 Test Results:`);
console.log(`  Passed: ${passed}/${testCases.length}`);
console.log(`  Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Material normalization is working correctly.');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the normalization logic.');
  process.exit(1);
}
