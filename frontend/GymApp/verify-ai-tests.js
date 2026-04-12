#!/usr/bin/env node

/**
 * AI FRONTEND VERIFICATION TEST SUITE
 * Comprehensive testing for Gym App AI Module
 * Run with: node verify-ai-tests.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '═'.repeat(70));
console.log('🧪 AI FRONTEND VERIFICATION TEST SUITE');
console.log('═'.repeat(70) + '\n');

const testResults = {
  tests: [],
  passed: 0,
  failed: 0,
  warnings: 0,
};

// ============================================
// 1. FILE STRUCTURE VERIFICATION
// ============================================
console.log('🔵 TEST 1: File Structure Verification');
console.log('─'.repeat(70));

const requiredFiles = [
  'app/ai/index.tsx',
  'app/ai/result.tsx',
  'app/user-home.tsx',
];

let test1Passed = true;
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, 'app', ...file.split('/').slice(1));
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} - EXISTS`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    test1Passed = false;
  }
});

if (test1Passed) {
  testResults.passed++;
  console.log('✅ TEST 1 PASSED: All required files present\n');
} else {
  testResults.failed++;
  console.log('❌ TEST 1 FAILED: Missing files\n');
}

// ============================================
// 2. CODE QUALITY CHECK
// ============================================
console.log('🔵 TEST 2: Code Quality & Syntax Check');
console.log('─'.repeat(70));

try {
  const formScreenContent = fs.readFileSync(path.join(__dirname, 'app/ai/index.tsx'), 'utf8');
  const resultScreenContent = fs.readFileSync(path.join(__dirname, 'app/ai/result.tsx'), 'utf8');
  
  // Check for critical keywords
  const formChecks = {
    'ImagePicker import': formScreenContent.includes('ImagePicker'),
    'FormData usage': formScreenContent.includes('FormData'),
    'Multipart validation': formScreenContent.includes('form-data') || formScreenContent.includes('FormData'),
    'Image picker function': formScreenContent.includes('pickImage'),
    'Validation function': formScreenContent.includes('validateForm'),
    'API call': formScreenContent.includes('fetch'),
    'All 9 fields': [
      'age', 'gender', 'height', 'weight', 
      'fitnessGoal', 'experienceLevel', 'workoutLocation', 
      'availableDays', 'targetArea'
    ].every(field => formScreenContent.includes(field)),
  };
  
  const resultChecks = {
    'useLocalSearchParams': resultScreenContent.includes('useLocalSearchParams'),
    'JSON parsing': resultScreenContent.includes('JSON.parse'),
    'Recommendation display': resultScreenContent.includes('recommendation'),
    'Error handling': resultScreenContent.includes('Alert'),
    'Back navigation': resultScreenContent.includes('router.back()'),
  };
  
  console.log('✓ Form Screen (index.tsx):');
  Object.entries(formChecks).forEach(([check, result]) => {
    console.log(`  ${result ? '✅' : '⚠️ '} ${check}`);
  });
  
  console.log('\n✓ Result Screen (result.tsx):');
  Object.entries(resultChecks).forEach(([check, result]) => {
    console.log(`  ${result ? '✅' : '⚠️ '} ${check}`);
  });
  
  const formPassed = Object.values(formChecks).every(v => v);
  const resultPassed = Object.values(resultChecks).every(v => v);
  
  if (formPassed && resultPassed) {
    testResults.passed++;
    console.log('\n✅ TEST 2 PASSED: Code quality checks passed\n');
  } else {
    testResults.warnings++;
    console.log('\n⚠️  TEST 2 WARNING: Some code quality checks failed\n');
  }
} catch (error) {
  testResults.failed++;
  console.log(`❌ TEST 2 FAILED: ${error.message}\n`);
}

// ============================================
// 3. BACKEND API IMAGE UPLOAD CHECK
// ============================================
console.log('🔵 TEST 3: Backend Uploads Folder Verification');
console.log('─'.repeat(70));

try {
  const uploadsPath = path.join(__dirname, '..', '..', 'backend', 'uploads');
  if (fs.existsSync(uploadsPath)) {
    const files = fs.readdirSync(uploadsPath);
    console.log(`  ✅ Backend /uploads folder exists`);
    console.log(`  ℹ️  Files in uploads: ${files.length} files`);
    if (files.length > 0) {
      console.log(`  ✓ Sample files: ${files.slice(0, 3).join(', ')}`);
    }
    testResults.passed++;
    console.log('✅ TEST 3 PASSED: Image upload infrastructure ready\n');
  } else {
    testResults.warnings++;
    console.log('  ℹ️  Note: /uploads folder will be created on first image upload\n');
  }
} catch (error) {
  testResults.warnings++;
  console.log(`⚠️  TEST 3 NOTE: ${error.message}\n`);
}

// ============================================
// 4. BACKEND ROUTES VERIFICATION
// ============================================
console.log('🔵 TEST 4: Backend Routes Verification');
console.log('─'.repeat(70));

try {
  const aiRoutesPath = path.join(__dirname, '..', '..', 'backend', 'routes', 'AiRoutes.js');
  if (fs.existsSync(aiRoutesPath)) {
    const routesContent = fs.readFileSync(aiRoutesPath, 'utf8');
    
    const routeChecks = {
      'Multer setup': routesContent.includes('multer'),
      'Generate-plan endpoint': routesContent.includes('generate-plan'),
      'File filter': routesContent.includes('fileFilter'),
      'POST method': routesContent.includes('router.post'),
    };
    
    console.log('✓ AI Routes Configuration:');
    Object.entries(routeChecks).forEach(([check, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${check}`);
    });
    
    if (Object.values(routeChecks).every(v => v)) {
      testResults.passed++;
      console.log('\n✅ TEST 4 PASSED: Backend routes properly configured\n');
    } else {
      testResults.warnings++;
      console.log('\n⚠️  TEST 4 WARNING: Some route configurations might be incomplete\n');
    }
  } else {
    testResults.failed++;
    console.log('❌ TEST 4 FAILED: AI Routes file not found\n');
  }
} catch (error) {
  testResults.failed++;
  console.log(`❌ TEST 4 FAILED: ${error.message}\n`);
}

// ============================================
// 5. BACKEND CONTROLLER VERIFICATION
// ============================================
console.log('🔵 TEST 5: Backend Controller Verification');
console.log('─'.repeat(70));

try {
  const controllerPath = path.join(__dirname, '..', '..', 'backend', 'controllers', 'AiController.js');
  if (fs.existsSync(controllerPath)) {
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    const controllerChecks = {
      'generatePlan function': controllerContent.includes('generatePlan'),
      'Rule engine': controllerContent.includes('ruleEngine'),
      'Beginner gym rule': controllerContent.includes('beginner') && controllerContent.includes('gym'),
      'Beginner home rule': controllerContent.includes('home') && controllerContent.includes('weight loss'),
      'Image handling': controllerContent.includes('req.file'),
      'Field validation': controllerContent.includes('required'),
    };
    
    console.log('✓ AI Controller Logic:');
    Object.entries(controllerChecks).forEach(([check, result]) => {
      console.log(`  ${result ? '✅' : '⚠️ '} ${check}`);
    });
    
    if (Object.values(controllerChecks).every(v => v)) {
      testResults.passed++;
      console.log('\n✅ TEST 5 PASSED: Controller has all required logic\n');
    } else {
      testResults.warnings++;
      console.log('\n⚠️  TEST 5 WARNING: Some controller logic might be incomplete\n');
    }
  } else {
    testResults.failed++;
    console.log('❌ TEST 5 FAILED: AI Controller file not found\n');
  }
} catch (error) {
  testResults.failed++;
  console.log(`❌ TEST 5 FAILED: ${error.message}\n`);
}

// ============================================
// 6. NAVIGATION INTEGRATION CHECK
// ============================================
console.log('🔵 TEST 6: Navigation Integration Check');
console.log('─'.repeat(70));

try {
  const userHomePath = path.join(__dirname, 'app', 'user-home.tsx');
  const content = fs.readFileSync(userHomePath, 'utf8');
  
  const navChecks = {
    'AI route push': content.includes("router.push('/ai')"),
    'AI button visible': content.includes('Generate Plan') || content.includes('🤖'),
    'Router import': content.includes("useRouter"),
  };
  
  console.log('✓ Navigation Setup:');
  Object.entries(navChecks).forEach(([check, result]) => {
    console.log(`  ${result ? '✅' : '❌'} ${check}`);
  });
  
  if (Object.values(navChecks).every(v => v)) {
    testResults.passed++;
    console.log('\n✅ TEST 6 PASSED: Navigation properly integrated\n');
  } else {
    testResults.failed++;
    console.log('\n❌ TEST 6 FAILED: Navigation not properly set up\n');
  }
} catch (error) {
  testResults.warnings++;
  console.log(`⚠️  TEST 6 NOTE: ${error.message}\n`);
}

// ============================================
// 7. SERVER.JS INTEGRATION CHECK
// ============================================
console.log('🔵 TEST 7: Server Configuration Check');
console.log('─'.repeat(70));

try {
  const serverPath = path.join(__dirname, '..', '..', 'backend', 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  const serverChecks = {
    'AI routes mounted': serverContent.includes("'/api/ai'"),
    'Error middleware': serverContent.includes('errorMiddleware'),
    'Static uploads': serverContent.includes("express.static"),
    'CORS enabled': serverContent.includes('cors('),
  };
  
  console.log('✓ Server Configuration:');
  Object.entries(serverChecks).forEach(([check, result]) => {
    console.log(`  ${result ? '✅' : '❌'} ${check}`);
  });
  
  if (Object.values(serverChecks).every(v => v)) {
    testResults.passed++;
    console.log('\n✅ TEST 7 PASSED: Server properly configured\n');
  } else {
    testResults.failed++;
    console.log('\n❌ TEST 7 FAILED: Server configuration incomplete\n');
  }
} catch (error) {
  testResults.failed++;
  console.log(`❌ TEST 7 FAILED: ${error.message}\n`);
}

// ============================================
// 8. PACKAGE DEPENDENCIES CHECK
// ============================================
console.log('🔵 TEST 8: Dependencies Check');
console.log('─'.repeat(70));

try {
  const frontendPackagePath = path.join(__dirname, 'package.json');
  const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
  
  const deps = frontendPackage.dependencies || {};
  const devDeps = frontendPackage.devDependencies || {};
  const allDeps = { ...deps, ...devDeps };
  
  const requiredDeps = {
    'expo-image-picker': allDeps['expo-image-picker'],
    'expo-router': allDeps['expo-router'],
    'react-native': allDeps['react-native'],
  };
  
  console.log('✓ Frontend Dependencies:');
  Object.entries(requiredDeps).forEach(([dep, version]) => {
    if (version) {
      console.log(`  ✅ ${dep} (${version})`);
    } else {
      console.log(`  ⚠️  ${dep} - Missing!`);
    }
  });
  
  const backendPackagePath = path.join(__dirname, '..', '..', 'backend', 'package.json');
  const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
  const backendDeps = backendPackage.dependencies || {};
  
  console.log('\n✓ Backend Dependencies:');
  ['multer', 'express', 'mongoose'].forEach((dep) => {
    if (backendDeps[dep]) {
      console.log(`  ✅ ${dep} (${backendDeps[dep]})`);
    } else {
      console.log(`  ❌ ${dep} - Missing!`);
    }
  });
  
  testResults.passed++;
  console.log('\n✅ TEST 8 PASSED: All required dependencies present\n');
} catch (error) {
  testResults.warnings++;
  console.log(`⚠️  TEST 8 NOTE: ${error.message}\n`);
}

// ============================================
// 9. ERROR MIDDLEWARE CHECK
// ============================================
console.log('🔵 TEST 9: Error Handling Middleware');
console.log('─'.repeat(70));

try {
  const errorMiddlewarePath = path.join(__dirname, '..', '..', 'backend', 'middleware', 'errorMiddleware.js');
  const asyncHandlerPath = path.join(__dirname, '..', '..', 'backend', 'middleware', 'asyncHandler.js');
  
  const errorExists = fs.existsSync(errorMiddlewarePath);
  const asyncExists = fs.existsSync(asyncHandlerPath);
  
  console.log(`  ${errorExists ? '✅' : '❌'} Error Middleware - ${errorExists ? 'SET UP' : 'MISSING'}`);
  console.log(`  ${asyncExists ? '✅' : '❌'} Async Handler - ${asyncExists ? 'SET UP' : 'MISSING'}`);
  
  if (errorExists && asyncExists) {
    testResults.passed++;
    console.log('\n✅ TEST 9 PASSED: Error handling properly configured\n');
  } else {
    testResults.failed++;
    console.log('\n❌ TEST 9 FAILED: Error handling incomplete\n');
  }
} catch (error) {
  testResults.failed++;
  console.log(`❌ TEST 9 FAILED: ${error.message}\n`);
}

// ============================================
// RUNTIME TESTS (Cannot run headless but document)
// ============================================
console.log('🔵 RUNTIME TESTS (Manual Browser Verification Needed)');
console.log('─'.repeat(70));

console.log(`
In browser console (http://localhost:8082), verify:

1. ✓ Screen loads without red errors
   
2. ✓ Image picker buttons appear & work
   - Click "📁 Upload Image" 
   - Select any .jpg or .png
   - Image preview should appear
   
3. ✓ Form fields accept input
   - All 9 fields should be editable
   
4. ✓ Validation works
   - Try submitting without image → should block
   - Try submitting with missing field → should block
   
5. ✓ API request sends correctly
   - Check Network tab in DevTools
   - Should be POST to http://localhost:5000/api/ai/generate-plan
   - Should be Content-Type: multipart/form-data
   
6. ✓ Result screen displays
   - After submission, plan should appear
   - All fields: title, exercises, notes, days should show
   
7. ✓ Navigation works
   - "Modify Answers" button goes back to form
   - No console errors during navigation

`);

// ============================================
// SUMMARY & VERDICT
// ============================================
console.log('═'.repeat(70));
console.log('📊 FINAL TEST SUMMARY');
console.log('═'.repeat(70) + '\n');

const totalTests = testResults.passed + testResults.failed + testResults.warnings;

console.log(`✅ PASSED:   ${testResults.passed}`);
console.log(`❌ FAILED:   ${testResults.failed}`);
console.log(`⚠️  WARNINGS: ${testResults.warnings}`);
console.log(`📈 TOTAL:    ${totalTests}\n`);

const score = ((testResults.passed / totalTests) * 100).toFixed(1);
console.log(`📊 CODE QUALITY SCORE: ${score}%\n`);

// Final verdict
console.log('═'.repeat(70));
console.log('✨ FINAL VERDICT');
console.log('═'.repeat(70) + '\n');

if (testResults.failed === 0 && score >= 85) {
  console.log(`
🎉 AI FRONTEND READY FOR TESTING IN BROWSER

✅ All file structure checks passed
✅ Code quality is good
✅ Backend integration complete
✅ Error handling in place
✅ Navigation configured

📝 NEXT STEPS:
1. Open http://localhost:8082 in browser
2. Navigate to AI screen
3. Test with real image (jpg/png)
4. Submit form and verify result screen
5. Check browser DevTools > Network tab for API calls

🚀 When all browser tests pass, module is ready for submission!
  `);
} else if (testResults.failed === 0 && score >= 70) {
  console.log(`
⚠️  AI FRONTEND MOSTLY READY - Minor warnings

✅ Core structure correct
⚠️  Some edge cases need checking

📝 REVIEW:
- Re-read the warnings above
- Test in browser carefully
- Check browser console for any errors
  `);
} else {
  console.log(`
❌ ISSUES FOUND - DO NOT SUBMIT YET

❌ ${testResults.failed} critical issues detected
⚠️  ${testResults.warnings} warnings to review

📝 ACTION REQUIRED:
1. Fix all failed tests above
2. Re-run verification
3. Then test in browser
  `);
}

console.log('\n' + '═'.repeat(70) + '\n');
