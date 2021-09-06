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
        const result = await client.compareFaces(params).promise();
        console.log(result);
        result = {
            success: true
        }
    } catch (error) {
        console.error(error);
        result = {
            success: false
        }
    }
    return result;
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
    let target_image = `${user_uuid}-photo.jpg`;
    let photo_bucket = process.env.PHOTO_BUCKET
    let result = await face_compare(bucket_name, photo_bucket, key, target_image);
    console.log('result : ', result);
}