const fs = require('fs');

async function uploadFileTest({ scenarioName, endpoint, textFields, fileName, fakeType = false }) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(textFields)) {
        formData.append(key, value);
    }
    
    if (fileName && fileName !== 'NO_FILE') {
        const filePath = './' + fileName;
        // make sure a dummy file exists
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "dummy file content");
        }
        
        const blob = new Blob([fs.readFileSync(filePath)], { type: fakeType ? 'application/pdf' : 'image/jpeg' });
        // Use the original filename to trigger multer's path.extname check
        const uploadName = fakeType ? fileName.replace('.jpg', '.pdf') : fileName;
        formData.append('image', blob, uploadName);
    }

    try {
        const res = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        return { scenario: scenarioName, status: res.status, ok: res.ok, response: data };
    } catch (e) {
        return { scenario: scenarioName, status: 500, error: e.message };
    }
}

async function runAll() {
    let report = [];
    
    // 1. Happy Path
    let r = await uploadFileTest({
        scenarioName: "Test 1 — Happy path: image + all fields",
        endpoint: "/api/ai/generate-plan",
        textFields: {
            userId: "testUser123", age: "22", gender: "male", height: "175", weight: "70",
            fitnessGoal: "muscle gain", experienceLevel: "beginner", workoutLocation: "gym",
            availableDays: "4", targetArea: "full body"
        },
        fileName: "dummy_image.jpg"
    });
    report.push(r);
    
    // 2. Another Valid
    r = await uploadFileTest({
        scenarioName: "Test 2 — Another valid rule",
        endpoint: "/api/ai/generate-plan",
        textFields: {
            userId: "testUser123", age: "22", gender: "male", height: "175", weight: "70",
            fitnessGoal: "weight loss", experienceLevel: "beginner", workoutLocation: "home",
            availableDays: "4", targetArea: "full body"
        },
        fileName: "dummy_image.jpg"
    });
    report.push(r);
    
    // 3. Missing Field
    r = await uploadFileTest({
        scenarioName: "Test 3 — Missing field validation",
        endpoint: "/api/ai/generate-plan",
        textFields: {
            // Missing fitnessGoal
            userId: "testUser123", age: "22", gender: "male", height: "175", weight: "70",
            experienceLevel: "beginner", workoutLocation: "home",
            availableDays: "4", targetArea: "full body"
        },
        fileName: "dummy_image.jpg"
    });
    report.push(r);
    
    // 4. Invalid file type
    r = await uploadFileTest({
        scenarioName: "Test 4 — Invalid file type",
        endpoint: "/api/ai/generate-plan",
        textFields: {
            userId: "testUser123", age: "22", gender: "male", height: "175", weight: "70",
            fitnessGoal: "weight loss", experienceLevel: "beginner", workoutLocation: "home",
            availableDays: "4", targetArea: "full body"
        },
        fileName: "dummy_document.pdf",
        fakeType: true
    });
    report.push(r);
    
    // 5. No file 
    r = await uploadFileTest({
        scenarioName: "Test 5 — No file sent",
        endpoint: "/api/ai/generate-plan",
        textFields: {
            userId: "testUser123", age: "22", gender: "male", height: "175", weight: "70",
            fitnessGoal: "weight loss", experienceLevel: "beginner", workoutLocation: "home",
            availableDays: "4", targetArea: "full body"
        },
        fileName: "NO_FILE"
    });
    report.push(r);
    
    // 6. Unsupported combination
    r = await uploadFileTest({
        scenarioName: "Test 6 — Weird/unsupported combination",
        endpoint: "/api/ai/generate-plan",
        textFields: {
            userId: "testUser123", age: "22", gender: "male", height: "175", weight: "70",
            fitnessGoal: "random", experienceLevel: "advanced", workoutLocation: "park",
            availableDays: "4", targetArea: "full body"
        },
        fileName: "dummy_image.jpg"
    });
    report.push(r);
    
    // 7. Numeric edge check
    r = await uploadFileTest({
        scenarioName: "Test 7 — Numeric input edge check",
        endpoint: "/api/ai/generate-plan",
        textFields: {
            userId: "testUser123", age: "", gender: "male", height: "abc", weight: "70",
            fitnessGoal: "weight loss", experienceLevel: "beginner", workoutLocation: "home",
            availableDays: "4", targetArea: "full body"
        },
        fileName: "dummy_image.jpg"
    });
    report.push(r);

    fs.writeFileSync('report-ai.json', JSON.stringify(report, null, 2));
    console.log("ALL AI TESTS COMPLETE");
}

runAll();
