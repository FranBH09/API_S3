const express = require('express');
const AWS = require('aws-sdk');
const uuid = require('uuid');
require('dotenv').config();  // Usamos dotenv para cargar las variables de entorno
const app = express();
const port = 3000;
 
// Middleware para leer cuerpo de XML
app.use(express.text({ type: 'application/xml' }));
 
// Configuración de AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
 
const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET_NAME; // El nombre de tu bucket
 
// Función para loguear transacciones en S3
const logTransaction = async (operation, xmlData) => {
  const transaction = {
    id: uuid.v4(),
    timestamp: new Date().toISOString(),
    operation: operation,
    data: xmlData, // Almacenamos el XML completo
  };
 
  const params = {
    Bucket: bucketName,
    Key: `transactions/transaction-${Date.now()}.json`,
    Body: JSON.stringify(transaction),
    ContentType: 'application/json',
  };
 
  try {
    await s3.upload(params).promise();
    console.log(`Transaction logged: ${transaction.id}`);
  } catch (error) {
    console.error('Error logging transaction:', error);
  }
};
 
// Función para subir el XML a S3
const uploadXMLToS3 = async (xmlData, fileName) => {
  const params = {
    Bucket: bucketName,
    Key: `xml-uploads/${fileName}.xml`,  // Guardar como archivo XML
    Body: xmlData,  // El contenido del XML recibido
    ContentType: 'application/xml',
  };
 
  try {
    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully: ${data.Location}`);
  } catch (error) {
    console.error('Error uploading XML to S3:', error);
  }
};
 
// Endpoint para insertar datos (POST)
app.post('/insert', async (req, res) => {
  const xmlData = req.body;
  const fileName = `insert-${uuid.v4()}`;  // Generamos un nombre único para el archivo
 
  try {
    await logTransaction('insert', xmlData);  // Log de la transacción
 
    // Subir el XML a S3
    await uploadXMLToS3(xmlData, fileName);
 
    res.status(200).send({
      message: 'Insert transaction logged and file uploaded to S3 successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing insert transaction');
  }
});
 
// Endpoint para actualizar datos (PUT)
app.put('/update', async (req, res) => {
  const xmlData = req.body;
  const fileName = `update-${uuid.v4()}`;  // Generamos un nombre único para el archivo
 
  try {
    await logTransaction('update', xmlData);  // Log de la transacción
 
    // Subir el XML a S3
    await uploadXMLToS3(xmlData, fileName);
 
    res.status(200).send({
      message: 'Update transaction logged and file uploaded to S3 successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing update transaction');
  }
});
 
// Endpoint para eliminar datos (DELETE)
app.delete('/delete', async (req, res) => {
  const xmlData = req.body;
  const fileName = `delete-${uuid.v4()}`;  // Generamos un nombre único para el archivo
 
  try {
    await logTransaction('delete', xmlData);  // Log de la transacción
 
    // Subir el XML a S3
    await uploadXMLToS3(xmlData, fileName);
 
    res.status(200).send({
      message: 'Delete transaction logged and file uploaded to S3 successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing delete transaction');
  }
});
 
// Servir la API
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});