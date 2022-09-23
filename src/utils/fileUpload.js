const multer = require('multer');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser')
const multerS3 = require('multer-s3');
// const S3 = require("aws-sdk/clients/s3");
 const fs = require("fs");
const bucketName=process.env.S3_BUCKET_NAME

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY

});

exports.upload = multer({
  storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET_NAME ,
      key: function (req, file, cb) {
            cb(null, Date.now()+file.originalname); //use Date.now() for unique file keys
      }
  })
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("file", file)
    cb(null, './src/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '--' + file.originalname)
  }
})

 

exports.uploadFile = multer({
  storage: storage

});

exports.uploadToS3 = async (file) => {

     fileStream = fs.createReadStream(file.path);

  const uploadParam = {
    Bucket: bucketName,
    Key: file.filename,
    Body: fileStream,
    ContentType: file.mimetype,
  };
  
  return s3.upload(uploadParam).promise();
};

exports.uploadThumbnailToS3 = async (filepath) => {
  console.log("fileStrea   m",filepath)
  const blob = fs.readFileSync(filepath)
    //  fileStream = fs.createReadStream(filepath);
    //  console.log("fileStream",fileStream)
  const uploadParam = {
    Bucket: bucketName,
    Key: filepath,
    Body: blob,
    // ContentType: file.mimetype,
  };
  
  return s3.upload(uploadParam).promise();
};


exports.uploadFileToSSS = (file) => {

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: Date.now() + file.name,
    Body: file.data,
    ContentType: 'image/jpeg'
  };

  return s3.upload(params).promise();

}
exports.uploadSVGFileToSSS = (file) => {

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: Date.now() + file.name,
    Body: file.data,
    ContentType: 'image/svg+xml'
  };

  return s3.upload(params).promise();

}