const { MongoClient } = require('mongodb');
require('dotenv').config(); 

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

async function conectarDB() {
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    return client.db('ecommerce');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
  }
}

module.exports = conectarDB;
