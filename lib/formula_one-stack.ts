import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';

const lambdaDir = lambda.Code.fromAsset('./lambda');

export class FormulaOneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const raceTable = new dynamo.Table(this, 'raceData', {
      partitionKey : { name : 'grandPrix#driver', type : dynamo.AttributeType.STRING },
      sortKey : { name : 'year#session', type : dynamo.AttributeType.STRING },
      tableName : 'raceData',
      removalPolicy : RemovalPolicy.DESTROY
    });

    const buildItemFunction = new lambda.Function(this, 'buildItem', {
      functionName: 'buildItem',
      code : lambdaDir,
      handler : 'webscrape.buildItem',
      runtime : lambda.Runtime.NODEJS_16_X
    });
    buildItemFunction.applyRemovalPolicy(RemovalPolicy.DESTROY);
    
    const getYearDataFunction = new lambda.Function(this, 'getYearData', {
      functionName: 'getYearData',
      code : lambdaDir,
      handler : 'webscrape.getYearData',
      runtime : lambda.Runtime.NODEJS_16_X,
      environment : {
        DOWN_STREAM_FUNCTION_NAME : buildItemFunction.functionName
      }
    });
    getYearDataFunction.applyRemovalPolicy(RemovalPolicy.DESTROY);
    
    const scrapeDataFunction = new lambda.Function(this, 'scrapeData', {
      functionName : 'scrapeData',
      code : lambdaDir,
      handler : 'webscrape.scrapeData',
      runtime : lambda.Runtime.NODEJS_16_X,
      environment : {
        DOWN_STREAM_FUNCTION_NAME : getYearDataFunction.functionName,
        RACE_TABLE_NAME : raceTable.tableName
      }
    });
    scrapeDataFunction.applyRemovalPolicy(RemovalPolicy.DESTROY);
    
    raceTable.grantReadWriteData(buildItemFunction);
  }
}
