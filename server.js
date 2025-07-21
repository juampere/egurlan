require('dotenv').config();
const conectarDB = require('./db');
const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const allowedOrigins = [
  'http://localhost:3000',
  'https://egurlan.onrender.com'
];

const app = express();
const PORT = process.env.PORT || 3000;

let db;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(session({
  secret: 'secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use("/panel", (req, res, next) => {
  const archivosPublicos = ["/login.html", "/js/login.js"];
  if (archivosPublicos.includes(req.path) || req.session.usuario) {
    return next();
  }
  res.redirect("/panel/login.html");
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/panel', express.static(path.join(__dirname, 'panel')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/productos', async (req, res) => {
  try {
    const productos = await db.collection('productos').find().toArray();
    res.json(productos);
  } catch {
    res.status(500).json({ error: 'Error al cargar productos desde MongoDB' });
  }
});

app.get('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const producto = await db.collection('productos').findOne({ id });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch {
    res.status(500).json({ error: 'Error al buscar producto' });
  }
});

app.post('/api/productos', async (req, res) => {
  try {
    const nuevoProducto = req.body;
    const ultimo = await db.collection('productos').find().sort({ id: -1 }).limit(1).toArray();
    const ultimoId = ultimo.length > 0 ? ultimo[0].id : 0;
    nuevoProducto.id = ultimoId + 1;
    const resultado = await db.collection('productos').insertOne(nuevoProducto);
    res.status(201).json({ mensaje: 'Producto guardado', id: resultado.insertedId });
  } catch {
    res.status(500).json({ error: 'Error al guardar producto' });
  }
});

app.put('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const actualizado = req.body;
  try {
    const resultado = await db.collection('productos').updateOne({ id }, { $set: actualizado });
    if (resultado.matchedCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const producto = await db.collection('productos').findOne({ id });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    if (producto.fotos && Array.isArray(producto.fotos)) {
      for (const foto of producto.fotos) {
        if (foto.public_id) {
          try {
            await cloudinary.uploader.destroy(foto.public_id);
          } catch {}
        }
      }
    }

    await db.collection('productos').deleteOne({ id });
    res.json({ mensaje: 'Producto eliminado correctamente' });

  } catch {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

app.get('/api/categorias', async (req, res) => {
  try {
    const categorias = await db.collection('categorias').find().toArray();
    res.json(categorias);
  } catch {
    res.status(500).json({ error: 'Error al cargar las categorías' });
  }
});

app.post('/api/categorias', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'Falta el nombre de la categoría' });
  }

  try {
    const categoriaExistente = await db.collection('categorias').findOne({
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    });

    if (categoriaExistente) {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }

    const resultado = await db.collection('categorias').insertOne({ nombre: nombre.trim() });

    res.status(201).json({
      mensaje: 'Categoría agregada',
      categoria: { _id: resultado.insertedId, nombre: nombre.trim() }
    });

  } catch {
    res.status(500).json({ error: 'Error al guardar la categoría' });
  }
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'productos',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  res.json({
    url: req.file.path,
    public_id: req.file.filename
  });
});

app.post('/api/login', async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const user = await db.collection('usuarios').findOne({ usuario });
    if (!user || user.password !== contrasena) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    req.session.usuario = usuario;
    res.json({ mensaje: 'Login correcto' });
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ mensaje: 'Sesión cerrada' });
  });
});

app.get('/api/verificar-sesion', (req, res) => {
  if (req.session.usuario) {
    res.json({ logueado: true });
  } else {
    res.status(401).json({ logueado: false });
  }
});

conectarDB().then((database) => {
  if (!database) {
    console.error('❌ No se pudo conectar a MongoDB. El servidor no se va a iniciar.');
    process.exit(1);
  }

  db = database;

  const adminPassword = process.env.ADMIN_PASSWORD || '1234';

  db.collection('usuarios').findOne({ usuario: 'admin' }).then(existe => {
    if (!existe) {
      db.collection('usuarios').insertOne({ usuario: 'admin', password: adminPassword })
        .then(() => console.log('🧑 Usuario admin creado'))
        .catch(err => console.error('❌ Error al crear usuario:', err));
    } else {
      console.log('✅ Usuario admin ya existe');
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
