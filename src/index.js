const aws = require('aws-sdk');
aws.config.update({region:"us-east-1"});

async function face_compare(doc_bucket, photo_bucket, source_image, target_image) {
    const client = new aws.Rekognition();
    let result = {};
    const params = {
        SourceImage: {
            S3Object: {
                Bucket: doc_bucket,
                Name: source_image
            }
        },
        TargetImage: {
            S3Object: {
                Bucket: photo_bucket,
                Name: target_image
            }
        },
        SimilarityThreshold: 80
    }
    try {
        const rekognition_result = await client.compareFaces(params).promise();
        console.log(`The face compare similarity score : ${rekognition_result.FaceMatches[0].Similarity}`);
        result = {
            success: true
        }
    } catch (error) {
        console.error(error);
        result = {
            error: true
        }
    }
    return result;
}

async function detect_text(doc_bucket, doc_image){
    const client = new aws.Rekognition();
    let result = {};
    const params = {
        Image: {
            S3Object: {
                Bucket: doc_bucket,
                Name: doc_image
            }
        }
    }
    try {
        const detect_text_result = await client.detectText(params).promise();
        result = {
            success: true,
            data: detect_text_result
        }
    } catch (error) {
        console.error(error);
        result = {
            success: false,
            error: true
        }
    }
    return result
}

async function save_result_dynamodb(id, face_match, texts) {
    const dynamodb = new aws.DynamoDB.DocumentClient();
    const params = {
        TableName: process.env.TABLE_NAME,
        Item: {
            "id": id,
            "face_match": face_match,
            "text_detection": texts
        }
    }
    try {
        const result = await dynamodb.put(params).promise();
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}
module.exports.handler = async (event, context) => {
    // event details 
    const bucket_name = event.Records[0].s3.bucket.name;
    console.log('BUCKET NAME : ',bucket_name);
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    console.log('FILE NAME : ', key); // source photo - doc
    let fields = key.split('-');
    
    //unique user id user face image and bucket
    const user_uuid = fields[0];
    let target_image = `${user_uuid}-photo.jpg`; // target photo - face image
    let photo_bucket = process.env.PHOTO_BUCKET

    // face compare
    let face_compare_result = await face_compare(bucket_name, photo_bucket, key, target_image);
    console.log('Face compare result : ', face_compare_result);

    // text detection
    let text_detect_result = await detect_text(bucket_name, key);
    console.log('Text detection completed');
    console.log('Text detection result : ', text_detect_result);
    // store result in dynamo
    await save_result_dynamodb(user_uuid, face_compare_result, text_detect_result);
    console.log('Result stored in Dynamodb');
}