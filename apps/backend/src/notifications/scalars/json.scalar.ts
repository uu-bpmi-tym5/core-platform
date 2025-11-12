import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
    [x: string]: JSONValue;
}
type JSONArray = Array<JSONValue>

@Scalar('JSON', () => Object)
export class JSONScalar implements CustomScalar<JSONValue, JSONValue> {
    description = 'JSON custom scalar type';

    parseValue(value: unknown): JSONValue {
        return value as JSONValue; // value from the client
    }

    serialize(value: unknown): JSONValue {
        return value as JSONValue; // value sent to the client
    }

    parseLiteral(ast: ValueNode): JSONValue | null {
        if (ast.kind === Kind.STRING) {
            return JSON.parse(ast.value) as JSONValue;
        }
        return null;
    }
}
