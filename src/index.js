const aws = require('aws-sdk');

function send_to_rekognition(operation, source_image, target_image) {
    
}

function save_result_dynamodb(params) {
    
}
module.exports.handler = async (event, context) => {
    const s3 = new aws.S3();
    const bucket_name = event.Records[0].s3.bucket.name;
    console.log('BUCKET NAME : ',bucket_name);
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    console.log('FILE NAME : ', key);
    let fields = key.split('-');
    const user_uuid = fields[0];
    const param1 = {
        Bucket: bucket_name,
        Key: key,
    };
    const param2 = {
        Bucket: process.env.PHOTO_BUCKET,
        Key: `${user_uuid}-photo.jpg`
    }
    try {
        const s3_object_doc = await s3.getObject(param1).promise();
        const s3_object_photo = await s3.getObject(param2).promise();
        console.log(typeof s3_object_doc.Body);
        console.log(typeof s3_object_photo.Body);
    } catch (error) {
        console.log(error);
    }
}