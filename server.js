const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = process.env.PORT || 3100;


const uri = 'mongodb://localhost:27017/imageConverter';
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('You Are Successfully Connected to MongoDB');
        const db = client.db('imageConverter');
        const collection = db.collection('images');

        const storage = multer.memoryStorage();
        const upload = multer({ storage: storage });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        app.post('/processImage', upload.single('image'), async (req, res) => {
            try {
                console.log('Request Body:', req.body);
                console.log('Uploaded File:', req.file);

                if (!req.file || !req.file.buffer) {
                    return res.status(400).send('No image file uploaded');
                }


                const { width, height, quality, format } = req.body;

                let imageBuffer = req.file.buffer;
                if (width && height) {
                    imageBuffer = await sharp(imageBuffer)
                        .resize(parseInt(width),
                            parseInt(height))
                        .toBuffer();
                }

                if (quality) {
                    imageBuffer = await sharp(imageBuffer)
                        .jpeg({ quality: parseInt(quality) })
                        .toBuffer();
                }


                let outputFormat = format || 'jpeg';
                if (outputFormat === 'jpg') {
                    outputFormat = 'jpeg';
                }

                // Convert the image to the specified format
                const processedImageBuffer = await sharp(imageBuffer)
                    .toFormat(outputFormat)
                    .toBuffer();

                const result = await collection.insertOne({
                    data: processedImageBuffer,
                    contentType: `image/${outputFormat}`,
                    uploadedAt: new Date()
                });

                console.log('Image processed and saved to MongoDB');

                res.set('Content-Type', `image/${outputFormat}`);
                res.send(processedImageBuffer);
            } catch (error) {
                console.error('Error processing image:', error);
                res.status(500).send('Error processing image');
            }
        });

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
    });
