import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class FormulaOneDataLoadStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const grandPrixTopic = new sns.Topic(this, 'grand-prix-topic', {
      topicName: 'grand-prix-topic',
      displayName: 'grand-prix-topic'
    });

    const dataLoader = new NodejsFunction(this, 'data-loader', {
      functionName: 'data-loader',
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: './lambda/data-loader.ts',
      handler: 'handler',
      timeout: Duration.minutes(15),
      environment: {
        F1_HOST: 'https://www.formula1.com',
        ENDPOINT: '/en/results.html',
        GP_TOPIC_ARN: grandPrixTopic.topicArn
      }
    });

    const grandPrixProcessor = new NodejsFunction(this, 'grand-prix-processor', {
      functionName: 'grand-prix-processor',
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: './lambda/grand-prix-processor.ts',
      handler: 'handler',
      timeout: Duration.minutes(5),
      environment: {
        F1_HOST: 'https://www.formula1.com'
      }
    });

    grandPrixTopic.grantPublish(dataLoader);
    grandPrixTopic.addSubscription(new subscriptions.LambdaSubscription(grandPrixProcessor));

    grandPrixProcessor.grantInvoke(dataLoader);

    const raceTable = new dynamo.Table(this, 'raceData', {
      partitionKey : { name : 'year_grandPrix', type : dynamo.AttributeType.STRING },
      sortKey : { name : 'session_driver', type : dynamo.AttributeType.STRING },
      tableName : 'race-data-table',
      removalPolicy : RemovalPolicy.DESTROY,
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST
    });

    raceTable.addGlobalSecondaryIndex({
      indexName: 'year',
      partitionKey: { name : 'year', type : dynamo.AttributeType.STRING },
      sortKey: { name : 'grandPrix_session_driver', type : dynamo.AttributeType.STRING },
      projectionType: dynamo.ProjectionType.ALL
    });

    raceTable.grantWriteData(grandPrixProcessor);
  }
}
