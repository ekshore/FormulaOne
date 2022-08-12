import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';

export class FormulaOneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const raceTable = new dynamo.Table(this, 'raceData', {
      partitionKey : { name : 'year_grandPrix', type : dynamo.AttributeType.STRING },
      sortKey : { name : 'session_driver', type : dynamo.AttributeType.STRING },
      tableName : 'race-data-table',
      removalPolicy : RemovalPolicy.DESTROY
    });
  }
}
