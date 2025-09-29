import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@lib/aws";
import { Buffer } from "buffer";

const uploadToS3 = async (fileName: string, buffer: Buffer, mimeType: string) => {
  try {
    // await s3.send(new PutObjectCommand({
    //   Bucket: process.env.AWS_BUCKET_NAME || " ", // Replace with your bucket name
    //   Key: fileName, // Replace with the desired file name
    //   Body: buffer, // Replace with the file buffer
    //   ContentType: mimeType, // Replace with the file MIME type
    //   ACL: "public-read" // Enable public access
    // }));
    
  } catch (err) {
    throw err;
  };
};



export { uploadToS3 };