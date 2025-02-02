// @@@SNIPSTART typescript-ejson-converter-impl
import {
  EncodingType,
  errorMessage,
  METADATA_ENCODING_KEY,
  Payload,
  PayloadConverterWithEncoding,
  str,
  u8,
} from '@temporalio/common';
import { PayloadConverterError } from '@temporalio/internal-workflow-common';
import EJSON from 'ejson';

/**
 * Converts between values and [EJSON](https://docs.meteor.com/api/ejson.html) Payloads.
 */
export class EjsonPayloadConverter implements PayloadConverterWithEncoding {
  public encodingType = 'ejson/plain' as EncodingType;

  public toPayload(value: unknown): Payload | undefined {
    if (value === undefined) return undefined;
    let ejson;
    try {
      ejson = EJSON.stringify(value);
    } catch (e) {
      throw new UnsupportedEjsonTypeError(
        `Can't run EJSON.stringify on this value: ${value}. Either convert it (or its properties) to EJSON-serializable values (see https://docs.meteor.com/api/ejson.html ), or create a custom data converter. EJSON.stringify error message: ${errorMessage(
          e
        )}`,
        e as Error
      );
    }

    return {
      metadata: {
        [METADATA_ENCODING_KEY]: u8('ejson/plain'),
      },
      data: u8(ejson),
    };
  }

  public fromPayload<T>(content: Payload): T {
    return content.data ? EJSON.parse(str(content.data)) : content.data;
  }
}

export class UnsupportedEjsonTypeError extends PayloadConverterError {
  public readonly name: string = 'UnsupportedJsonTypeError';

  constructor(message: string | undefined, public readonly cause?: Error) {
    super(message ?? undefined);
  }
}
// @@@SNIPEND
