import {
  aws_apigateway,
  aws_certificatemanager,
  RemovalPolicy
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IDomainName, Period } from 'aws-cdk-lib/aws-apigateway';
import { IRestApi, RestApiProps } from 'aws-cdk-lib/aws-apigateway/lib/restapi';

/**
 * Abstracts a RestAPi with base path mapping and a dedicated API key + usage plan
 */
export interface ApiWithKeyAndBasePathMappingProps {
  basePath: string;
  certificate: aws_certificatemanager.ICertificate;
  apiDomainName: aws_apigateway.DomainName;
  apiProps: RestApiProps;
  useApiKey: boolean;
}

export class ApiWithKeyAndBasePathMapping extends Construct {
  public readonly api: aws_apigateway.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: ApiWithKeyAndBasePathMappingProps
  ) {
    super(scope, id);
    this.api = new aws_apigateway.RestApi(this, 'Api', props.apiProps);
    if (props.useApiKey) {
      const apiKey = new aws_apigateway.ApiKey(this, 'ApiKey');
      this.api
        .addUsagePlan('ApiUsagePlan', {
          name: 'ApiUsagePlan',
          description: 'Rest api usage plan',
          apiStages: [{ api: this.api, stage: this.api.deploymentStage }],
          throttle: { burstLimit: 50, rateLimit: 1000 },
          quota: { limit: 1000000, period: Period.MONTH }
        })
        .addApiKey(apiKey);
    }
    new aws_apigateway.BasePathMapping(this, 'BasePathMapping', {
      domainName: props.apiDomainName as IDomainName,
      restApi: this.api as IRestApi,
      basePath: props.basePath
    }).applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
