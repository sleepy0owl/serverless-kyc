const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const lambda = require('@aws-cdk/aws-lambda');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const iam = require('@aws-cdk/aws-iam');
const path = require('path');
const S3EventSource = require('@aws-cdk/aws-lambda-event-sources').S3EventSource;

class ServerlessKycStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here
    // dynamodb to store the result
    const table = new dynamodb.Table(this, 'sm-user-result', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // s3 bucket to store photos
    const s3_photo = new s3.Bucket(this, 'sm-kyc-photo', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
    const s3_document = new s3.Bucket(this, 'sm-kyc-doc', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
    
    // lambda to process the event
    const fn = new lambda.Function(this, 'sm-kyc-function', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src')),
      timeout: cdk.Duration.seconds(5)
    })
    // lambda trigger
    fn.addEventSource(new S3EventSource(s3_document, {
      events: [ s3.EventType.OBJECT_CREATED]
    }))

    // sns to send notification

    //permission for lambda
    s3_document.grantRead(fn);
    s3_photo.grantRead(fn);
    table.grantReadWriteData(fn);
    fn.addEnvironment('TABLE_NAME', table.tableName);
    fn.addEnvironment('PHOTO_BUCKET', s3_photo.bucketName);
    fn.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rekognition:CompareFaces', 'rekognition:DetectText'],
      resources: ['*']
    }));
  }
}

module.exports = { ServerlessKycStack }
