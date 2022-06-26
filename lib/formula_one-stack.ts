import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';

export class FormulaOneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const raceTable = new dynamo.Table(this, 'raceData', {
      partitionKey : { name : 'grandPrix#driver', type : dynamo.AttributeType.STRING },
      sortKey : { name : 'year#session', type : dynamo.AttributeType.STRING },
      tableName : 'raceData',
      removalPolicy : RemovalPolicy.DESTROY
    });
  }
}
