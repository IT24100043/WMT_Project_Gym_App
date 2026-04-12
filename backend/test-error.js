const fs = require('fs');

async function testJsonRoute(method, path) {
    try {
        const res = await fetch(`http://localhost:5000${path}`, { method });
        const data = await res.json().catch(() => null);
        console.log(`${method} ${path} => Status: ${res.status}`, data);
    } catch (e) {
        console.log(`Failed ${method} ${path}`, e.message);
    }
}

async function uploadFileTest({ endpoint, textFields, fileName, fakeType = false }) {
    const formData = new FormData();
    for (const [k, v] of Object.entries(textFields)) formData.append(k, v);
    
    if (fileName && fileName !== 'NO_FILE') {
        const filePath = './' + fileName;
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "dummy file content");
        
        const blob = new Blob([fs.readFileSync(filePath)], { type: fakeType ? 'application/pdf' : 'image/jpeg' });
        const uploadName = fakeType ? fileName.replace('.jpg', '.pdf') : fileName;
        formData.append('image', blob, uploadName);
    }

    try {
        const res = await fetch(`http://localhost:5000${endpoint}`, { method: 'POST', body: formData });
        const data = await res.json();
        console.log(`POST ${endpoint} [File: ${fileName}] => Status: ${res.status}`, data);
    } catch (e) {
        console.log(`POST ${endpoint} failed`, e.message);
    }
}

async function runTests() {
    console.log("--- 1. Wrong route (404 Middle) ---");
    await testJsonRoute('GET', '/api/unknown');

    console.log("\n--- 2. Invalid Mongo ID (400 Cast Error) ---");
    await testJsonRoute('GET', '/api/workouts/123?userId=testUser123');

    console.log("\n--- 3. Valid format missing record (404) ---");
    await testJsonRoute('GET', '/api/workouts/60bd9a941ea50a41d01b5a51?userId=testUser123');

    console.log("\n--- 4. Wrong file type on AI (.pdf -> 400) ---");
    await uploadFileTest({
        endpoint: "/api/ai/generate-plan",
        textFields: { userId: "testUser123", age: "22", gender: "m", height: "170", weight: "70", fitnessGoal: "loss", experienceLevel: "beg", workoutLocation: "home", availableDays: "4", targetArea: "body" },
        fileName: "dummy.pdf", fakeType: true
    });

    console.log("\n--- 5. Missing image (400) ---");
    await uploadFileTest({
        endpoint: "/api/ai/generate-plan",
        textFields: { userId: "testUser123", age: "22", gender: "m", height: "170", weight: "70", fitnessGoal: "loss", experienceLevel: "beg", workoutLocation: "home", availableDays: "4", targetArea: "body" },
        fileName: "NO_FILE"
    });

    console.log("\n--- 6. Missing required field (400) ---");
    await uploadFileTest({
        endpoint: "/api/ai/generate-plan",
        textFields: { userId: "testUser123", /* missing age/gender.. */ },
        fileName: "dummy.jpg"
    });
}
runTests();
