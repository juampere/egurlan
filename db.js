const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function conectarDB() {
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    return client.db('ecommerce'); // Usás esta misma base, ¿correcto?
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    return null; // 👈 esto es importante
  }
}

module.exports = conectarDB;

