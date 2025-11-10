module.exports = {
  apps: [
    {
      name: "auth",
      script: "./auth-server/server.js",
      env: {
        AUTH_PORT: 4000,
        NODE_ENV: "production"
      }
    },
    {
      name: "backend",
      script: "./backend.js",
      env: {
        PORT: process.env.PORT || 3000,
        AUTH_SERVICE_URL: "http://localhost:4000",
        NODE_ENV: "production"
      }
    }
  ]
};