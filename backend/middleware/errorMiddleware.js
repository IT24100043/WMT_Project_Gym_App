// Catches requests to URLs that don't exist
const notFoundHandler = (req, res, next) => {
    return res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
    // If the error was thrown without a specific code, default to 500.
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || "Internal Server Error";

    // Detect Invalid MongoDB ObjectID (e.g. searching for /api/workouts/123)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400; // 400 Bad Request
        message = "Invalid database ID format provided.";
    }

    res.status(statusCode).json({ message });
};

module.exports = { notFoundHandler, errorHandler };
