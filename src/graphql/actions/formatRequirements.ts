import { SubmittedRequirementData, Requirement } from "@lib/types";
import { Buffer } from "buffer";
import { uploadToS3 } from "@actions/awsS3";
import crypto from "crypto";

const formatRequirements = async (requirements: SubmittedRequirementData[]) => {
  // Convert all uri base64 to buffer
  const convertedBuffers = requirements.map((req) => {
    return {
      fileName: req.name,
      name: req.requirement,
      uri: Buffer.from(req.uri, 'base64'),
      type: req.type,
      class: req.class,
      subclass: req.subclass
    }
  });

  // Upload each file to s3 and format
  const formattedRequirements = await Promise.all(convertedBuffers.map(async (req) => {
    const fileName = crypto.randomUUID() + "-" + req.fileName;

    await uploadToS3(fileName, req.uri, req.type);
    
    return {
      name: req.name,
      class: req.class,
      subclass: req.subclass,

      type: req.type,
      url:`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
    }
  }))

  // Remove duplicates
  const removedDuplicates: Requirement[] = [];

  formattedRequirements.forEach((req) => {
    const isExist = removedDuplicates.find((item) => item.name === req.name);

    if (isExist) {
      isExist.files.push({type: req.type, url: req.url});
    } else {
      removedDuplicates.push({
        name: req.name,
        class: req.class,
        subclass: req.subclass,
        files: [{type: req.type, url: req.url}]
      });
    }
  })

  // Format to prisma create
  const formattedPrismaCreate = removedDuplicates.map((req) => {
    return {
      name: req.name,
      class: req.class,
      subclass: req.subclass,
      files: {
        create: req.files
      }
    }
  })

  return {prismaCreate: formattedPrismaCreate, numberOfDocs: removedDuplicates.length};
};

export { formatRequirements };