import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class FormulaOneDataLoadStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const lambdaDir = path.join(__dirname, './../lambda/');

    const raceTable = new dynamo.Table(this, 'raceData', {
      partitionKey : { name : 'year_grandPrix', type : dynamo.AttributeType.STRING },
      sortKey : { name : 'session_driver', type : dynamo.AttributeType.STRING },
      tableName : 'race-data-table',
      removalPolicy : RemovalPolicy.DESTROY
    });

    const grandPrixProcessor = new NodejsFunction(this, 'grand-prix-processor', {
      functionName: 'grand-prix-processor',
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: './lambda/grand-prix-processor.ts',
      handler: 'handler'
    });
  }
}
