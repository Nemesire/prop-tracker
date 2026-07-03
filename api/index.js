// Única función serverless de Vercel — la app Express vive en /server
// (fuera de /api para que cada archivo no cuente como función independiente)
module.exports = require('../server/app')
