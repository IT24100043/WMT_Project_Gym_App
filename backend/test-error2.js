const fs = require('fs');

async function testJsonRoute(method, path) {
    try {
        const res = await fetch(`http://localhost:5000${path}`, { method });
        const data = await res.json().catch(() => null);
        return { path, status: res.status, data };
    } catch (e) {
        return { path, error: e.message };
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
        return { endpoint, file: fileName, status: res.status, data };
    } catch (e) {
        return { endpoint, file: fileName, error: e.message };
    }
}

async function runTests() {
    let report = {};

    report.wrongRoute = await testJsonRoute('GET', '/api/unknown');
    report.invalidId = await testJsonRoute('GET', '/api/workouts/123?userId=testUser123');
    report.missingRecord = await testJsonRoute('GET', '/api/workouts/60bd9a941ea50a41d01b5a51?userId=testUser123');

    report.wrongFileType = await uploadFileTest({
        endpoint: "/api/ai/generate-plan",
        textFields: { userId: "testUser123", age: "22", gender: "m", height: "170", weight: "70", fitnessGoal: "loss", experienceLevel: "beg", workoutLocation: "home", availableDays: "4", targetArea: "body" },
        fileName: "dummy.pdf", fakeType: true
    });

    report.missingImage = await uploadFileTest({
        endpoint: "/api/ai/generate-plan",
        textFields: { userId: "testUser123", age: "22", gender: "m", height: "170", weight: "70", fitnessGoal: "loss", experienceLevel: "beg", workoutLocation: "home", availableDays: "4", targetArea: "body" },
        fileName: "NO_FILE"
    });

    report.missingField = await uploadFileTest({
        endpoint: "/api/ai/generate-plan",
        textFields: { userId: "testUser123" },
        fileName: "dummy.jpg"
    });

    fs.writeFileSync('error-report.json', JSON.stringify(report, null, 2));
    console.log("DONE ERRORS");
}
runTests();
