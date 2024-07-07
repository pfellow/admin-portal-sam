import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = 'items';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let body;
    let statusCode = 200;
    const headers = {
        'Content-Type': 'application/json',
    };
    try {
        if (event.pathParameters?.id) {
            if (event.httpMethod === 'DELETE') {
                await dynamo.send(
                    new DeleteCommand({
                        TableName: tableName,
                        Key: {
                            id: event.pathParameters.id,
                        },
                    }),
                );
                body = `Deleted item ${event.pathParameters.id}`;
            } else if (event.httpMethod === 'GET') {
                const result = await dynamo.send(
                    new GetCommand({
                        TableName: tableName,
                        Key: {
                            id: event.pathParameters.id,
                        },
                    }),
                );
                body = result.Item;
            } else {
                throw new Error(`Unsupported route: ${event.httpMethod} ${event.path}`);
            }
        } else {
            if (event.httpMethod === 'GET') {
                const result = await dynamo.send(new ScanCommand({ TableName: tableName }));
                body = result.Items;
            } else if (event.httpMethod === 'PUT') {
                if (event.body) {
                    const requestJSON = JSON.parse(event.body);
                    await dynamo.send(
                        new PutCommand({
                            TableName: tableName,
                            Item: {
                                id: requestJSON.id,
                                price: requestJSON.price,
                                name: requestJSON.name,
                            },
                        }),
                    );
                    body = `Put item ${requestJSON.id}`;
                } else {
                    throw new Error('Body should not be empty');
                }
            } else {
                throw new Error(`Unsupported route: ${event.httpMethod} ${event.path}`);
            }
        } 
    } catch (err) {
        statusCode = 400;
        if (err instanceof Error) {
            body = err.message;
        } else {
            body = err;
        }
    } finally {
        body = JSON.stringify(body);
    }
    return {
        statusCode,
        body,
        headers,
    };
};
