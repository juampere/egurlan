const conectarDB = require('./db');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/panel', express.static(path.join(__dirname, 'panel')));

// Paths a archivos que todavía usamos
const categoriasPath = path.join(__dirname, 'categorias.json');

// Ruta: obtener todos los productos desde MongoDB
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await db.collection('productos').find().toArray();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar productos desde MongoDB' });
  }
});

// Ruta: obtener un producto por ID (Mongo usa _id, pero mantenemos tu lógica temporal)
app.get('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const producto = await db.collection('productos').findOne({ id });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar producto' });
  }
});

// Ruta: crear producto en MongoDB
app.post('/api/productos', async (req, res) => {
  try {
    const nuevoProducto = req.body;

    // Generar ID incremental (busca el último producto y suma 1)
    const ultimo = await db.collection('productos').find().sort({ id: -1 }).limit(1).toArray();
    const ultimoId = ultimo.length > 0 ? ultimo[0].id : 0;
    nuevoProducto.id = ultimoId + 1;

    const resultado = await db.collection('productos').insertOne(nuevoProducto);
    res.status(201).json({ mensaje: 'Producto guardado', id: resultado.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar producto' });
  }
});

// Ruta: editar producto
app.put('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const actualizado = req.body;
  try {
    const resultado = await db.collection('productos').updateOne({ id }, { $set: actualizado });
    if (resultado.matchedCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});


// Ruta: eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Buscar el producto
    const producto = await db.collection('productos').findOne({ id });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    // Borrar imágenes si existen
    if (Array.isArray(producto.fotos)) {
      for (const foto of producto.fotos) {
        if (typeof foto === 'string' && foto.startsWith('/uploads/')) {
          const ruta = path.join(__dirname, foto);
          fs.unlink(ruta, err => {
            if (err) {
              console.warn(`⚠️ No se pudo borrar: ${ruta}`);
            } else {
              console.log(`🧹 Imagen borrada: ${ruta}`);
            }
          });
        }
      }
    }

    // Eliminar el producto
    const resultado = await db.collection('productos').deleteOne({ id });
    res.json({ mensaje: 'Producto eliminado' });

  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Rutas de categorías (siguen en JSON por ahora)
app.get('/api/categorias', async (req, res) => {
  try {
    const categorias = await db.collection('categorias').find().toArray();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar las categorías' });
  }
});

app.post('/api/categorias', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'Falta el nombre de la categoría' });
  }

  try {
    // Buscamos si la categoría ya existe (ignorando mayúsculas/minúsculas)
    const categoriaExistente = await db.collection('categorias').findOne({
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    });

    if (categoriaExistente) {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }

    // Insertamos la nueva categoría
    const resultado = await db.collection('categorias').insertOne({ nombre: nombre.trim() });

    res.status(201).json({ mensaje: 'Categoría agregada', categoria: { _id: resultado.insertedId, nombre: nombre.trim() } });

  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la categoría' });
  }
});


// Subida de imágenes
const uploadDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Conexión a la base de datos
let db;
conectarDB().then((database) => {
  db = database;

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
