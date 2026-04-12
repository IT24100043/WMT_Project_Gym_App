const http = require('http');

const request = (method, path, body = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const runTests = async () => {
    let workoutId;

    console.log("🔵 Test 1: CREATE Workout");
    let res = await request('POST', '/api/workouts', {
        userId: "testUser123", title: "Evening Pull Day", workoutType: "Strength", 
        goal: "Muscle Gain", locationType: "Gym", exerciseName: "Pull-ups", 
        sets: 3, reps: 10, duration: 50, notes: "Focused on slow negatives"
    });
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, res.data);
    if (res.status === 201) workoutId = res.data.workout._id;
    else return console.log("FAILED TEST 1");

    console.log("\n🔵 Test 2: GET All Workouts");
    res = await request('GET', '/api/workouts/user/testUser123');
    console.log(`Status: ${res.status}`);
    console.log(`Returned elements count:`, res.data.workouts?.length);

    console.log("\n🔵 Test 3: GET Single Workout");
    res = await request('GET', `/api/workouts/${workoutId}?userId=testUser123`);
    console.log(`Status: ${res.status}`);
    console.log(`Response title:`, res.data.workout?.title);

    console.log("\n🔵 Test 4: UPDATE Workout");
    res = await request('PUT', `/api/workouts/${workoutId}`, {
        userId: "testUser123", sets: 4, reps: 12, notes: "Updated after test"
    });
    console.log(`Status: ${res.status}`);
    console.log(`Updated notes:`, res.data.workout?.notes);

    console.log("\n🧪 Test 6: Missing field");
    res = await request('POST', '/api/workouts', {
        userId: "testUser123", workoutType: "Strength" 
        // Notice title is missing
    });
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, res.data);

    console.log("\n🧪 Test 7: Wrong user ownership (Update)");
    res = await request('PUT', `/api/workouts/${workoutId}`, {
        userId: "fakeUser999", sets: 4
    });
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, res.data);

    console.log("\n🧪 Test 8: Invalid ID");
    res = await request('GET', '/api/workouts/123');
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, res.data);

    console.log("\n🔵 Test 5: DELETE Workout");
    res = await request('DELETE', `/api/workouts/${workoutId}`, {
        userId: "testUser123"
    });
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, res.data);
};

runTests();
