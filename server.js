const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware para parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS para permitir frontend en localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/panel', express.static(path.join(__dirname, 'panel')));

// Archivos JSON
const productosPath = path.join(__dirname, 'productos.json');
const categoriasPath = path.join(__dirname, 'categorias.json');
const usuariosPath = path.join(__dirname, 'usuarios.json');

// Rutas API

app.get('/api/productos', (req, res) => {
  fs.readFile(productosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'No se pudieron cargar los productos' });
    res.json(JSON.parse(data));
  });
});

app.get('/api/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  fs.readFile(productosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'No se pudo leer el archivo' });

    let productos = [];
    try {
      productos = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'JSON mal formado' });
    }

    const producto = productos.find(p => p.id === id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json(producto);
  });
});


app.post('/api/productos', (req, res) => {
  const nuevoProducto = req.body;
  fs.readFile(productosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'No se pudo leer el archivo de productos' });
    let productos = [];
    try {
      productos = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'JSON mal formado' });
    }
    const ultimoId = productos.length > 0 ? productos[productos.length - 1].id : 0;
    nuevoProducto.id = ultimoId + 1;
    productos.push(nuevoProducto);
    fs.writeFile(productosPath, JSON.stringify(productos, null, 2), err => {
      if (err) return res.status(500).json({ error: 'No se pudo guardar el producto' });
      res.status(201).json({ mensaje: 'Producto guardado correctamente', producto: nuevoProducto });
    });
  });
});

app.put('/api/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const actualizado = req.body;
  fs.readFile(productosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'No se pudo leer el archivo' });
    let productos = [];
    try {
      productos = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'JSON mal formado' });
    }
    const idx = productos.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });
    productos[idx] = { id, ...actualizado };
    fs.writeFile(productosPath, JSON.stringify(productos, null, 2), err => {
      if (err) return res.status(500).json({ error: 'No se pudo guardar' });
      res.json({ mensaje: 'Producto actualizado', producto: productos[idx] });
    });
  });
});

app.delete('/api/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  fs.readFile(productosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'No se pudo leer el archivo' });
    let productos = [];
    try {
      productos = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'JSON mal formado' });
    }
    const nuevosProductos = productos.filter(p => p.id !== id);
    if (nuevosProductos.length === productos.length) return res.status(404).json({ error: 'Producto no encontrado' });
    fs.writeFile(productosPath, JSON.stringify(nuevosProductos, null, 2), err => {
      if (err) return res.status(500).json({ error: 'No se pudo guardar el archivo' });
      res.json({ mensaje: 'Producto eliminado correctamente' });
    });
  });
});

app.get('/api/categorias', (req, res) => {
  fs.readFile(categoriasPath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json([]);
      return res.status(500).json({ error: 'No se pudieron cargar las categorías' });
    }
    try {
      const categorias = JSON.parse(data);
      res.json(categorias);
    } catch {
      res.status(500).json({ error: 'JSON mal formado en categorías' });
    }
  });
});

app.post('/api/categorias', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre de la categoría' });
  fs.readFile(categoriasPath, 'utf8', (err, data) => {
    let categorias = [];
    if (!err) {
      try {
        categorias = JSON.parse(data);
      } catch {
        return res.status(500).json({ error: 'JSON mal formado en categorías' });
      }
    }
    if (categorias.some(cat => cat.toLowerCase() === nombre.toLowerCase())) {
      return res.status(400).json({ error: 'Categoría ya existe' });
    }
    categorias.push(nombre);
    fs.writeFile(categoriasPath, JSON.stringify(categorias, null, 2), err => {
      if (err) return res.status(500).json({ error: 'No se pudo guardar la categoría' });
      res.status(201).json({ mensaje: 'Categoría agregada', categorias });
    });
  });
});

// Subir imagen
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
