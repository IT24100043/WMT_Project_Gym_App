const fs = require('fs');
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

        let bodyData = '';
        if (body) {
            bodyData = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(bodyData);
        }

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
        if (body) req.write(bodyData);
        req.end();
    });
};

const runTests = async () => {
    let report = {};
    let workoutId;

    let res = await request('POST', '/api/workouts', {
        userId: "testUser123", title: "Evening Pull Day", workoutType: "Strength", 
        goal: "Muscle Gain", locationType: "Gym", exerciseName: "Pull-ups", 
        sets: 3, reps: 10, duration: 50, notes: "Focused on slow negatives"
    });
    report.test1 = { status: res.status, data: res.data };
    if (res.status === 201) workoutId = res.data.workout._id;

    res = await request('GET', '/api/workouts/user/testUser123');
    report.test2 = { status: res.status, data: res.data };

    res = await request('GET', `/api/workouts/${workoutId}?userId=testUser123`);
    report.test3 = { status: res.status, data: res.data };

    res = await request('PUT', `/api/workouts/${workoutId}`, {
        userId: "testUser123", sets: 4, reps: 12, notes: "Updated after test"
    });
    report.test4 = { status: res.status, data: res.data };

    res = await request('POST', '/api/workouts', {
        userId: "testUser123", workoutType: "Strength" 
    });
    report.test6 = { status: res.status, data: res.data };

    res = await request('PUT', `/api/workouts/${workoutId}`, {
        userId: "fakeUser999", sets: 4
    });
    report.test7 = { status: res.status, data: res.data };

    res = await request('GET', '/api/workouts/123');
    report.test8 = { status: res.status, data: res.data };

    res = await request('DELETE', `/api/workouts/${workoutId}`, {
        userId: "testUser123"
    });
    report.test5 = { status: res.status, data: res.data };

    fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
    console.log("DONE");
};

runTests();
