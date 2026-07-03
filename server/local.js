// Script para desarrollo local — no se sube a Vercel
const path = require('path')
// Carga .env desde la raíz del proyecto (donde está node_modules/dotenv)
try {
  require(path.join(__dirname, '../node_modules/dotenv')).config({ path: path.join(__dirname, '../.env') })
} catch (e) { /* dotenv opcional */ }

const app = require('./app')
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`API local corriendo en http://localhost:${PORT}`)
})
