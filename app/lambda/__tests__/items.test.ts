import { APIGatewayProxyEvent, APIGatewayProxyEventPathParameters, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../items';
import { expect, describe, it, jest } from '@jest/globals';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

type SupportedPaths = '/items' | '/items/1';
type SupportedRoutes = 'GET' | 'PUT' | 'DELETE';

function generateEvent(
    path: SupportedPaths,
    httpMethod: SupportedRoutes,
    pathParameters: APIGatewayProxyEventPathParameters | null = null,
    body: string | null = null,
) {
    const event: APIGatewayProxyEvent = {
        httpMethod,
        body,
        headers: {},
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: {},
        path,
        pathParameters,
        queryStringParameters: {},
        requestContext: {
            accountId: '123456789012',
            apiId: '1234',
            authorizer: {},
            httpMethod,
            identity: {
                accessKey: '',
                accountId: '',
                apiKey: '',
                apiKeyId: '',
                caller: '',
                clientCert: {
                    clientCertPem: '',
                    issuerDN: '',
                    serialNumber: '',
                    subjectDN: '',
                    validity: { notAfter: '', notBefore: '' },
                },
                cognitoAuthenticationProvider: '',
                cognitoAuthenticationType: '',
                cognitoIdentityId: '',
                cognitoIdentityPoolId: '',
                principalOrgId: '',
                sourceIp: '',
                user: '',
                userAgent: '',
                userArn: '',
            },
            path,
            protocol: 'HTTP/1.1',
            requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            requestTimeEpoch: 1428582896000,
            resourceId: '123456',
            resourcePath: path,
            stage: 'dev',
        },
        resource: '',
        stageVariables: {},
    };
    return event;
}

const dynamoSendSpy = jest.spyOn(DynamoDBDocumentClient.prototype, 'send');

describe('items handler', function () {
    it('returns a list of items', async () => {
        const items = [
            { id: 1, price: '1.01', name: 'sand' },
            { id: 2, price: '1.02', name: 'boulders' },
        ];
        dynamoSendSpy.mockImplementationOnce(() => Promise.resolve({ Items: items }));

        const result: APIGatewayProxyResult = await handler(generateEvent('/items', 'GET'));

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify(items));
    });

    it('returns an item', async () => {
        const item = { id: 1, price: '1.01', name: 'sand' };

        dynamoSendSpy.mockImplementationOnce(() => Promise.resolve({ Item: item }));

        const result: APIGatewayProxyResult = await handler(generateEvent('/items/1', 'GET', { id: '1' }));

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify(item));
    });

    it('deletes an item', async () => {

        dynamoSendSpy.mockImplementationOnce(() => Promise.resolve());

        const result: APIGatewayProxyResult = await handler(generateEvent('/items/1', 'DELETE', { id: '1' }));

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify("Deleted item 1"));
    })

    it('puts an item', async () => {

        dynamoSendSpy.mockImplementationOnce(() => Promise.resolve({ id: 3 }));

        const result: APIGatewayProxyResult = await handler(generateEvent('/items', 'PUT', {}, JSON.stringify({ id: 3, price: '1.03', name: 'clock' })));

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify("Put item 3"));
    });

    it('returns 400 for unsupported route delete /items', async () => {

        const result: APIGatewayProxyResult = await handler(generateEvent('/items', 'DELETE'));

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify("Unsupported route: DELETE /items"));
    })

    it('returns 400 for unsupported route put /items/1', async () => {

        const result: APIGatewayProxyResult = await handler(generateEvent('/items/1', 'PUT', {id: '1'} ));

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify("Unsupported route: PUT /items/1"));
    });

    it('returns 400 for PUT if body is empty', async () => {

        const result: APIGatewayProxyResult = await handler(generateEvent('/items', 'PUT', {}, ""));

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify("Body should not be empty"))
    });
});
