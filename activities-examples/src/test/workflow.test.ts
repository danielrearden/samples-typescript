import { ActivityFailure, ApplicationFailure, WorkflowClient, WorkflowFailedError } from '@temporalio/client';
import { Runtime, DefaultLogger, Worker } from '@temporalio/worker';
import assert from 'assert';
import axios from 'axios';
import { after, afterEach, before, describe, it } from 'mocha';
import sinon from 'sinon';
import { v4 as uuid } from 'uuid';
import * as activities from '../activities';
import { httpWorkflow } from '../workflows';

describe('example workflow', function () {
  let shutdown: () => Promise<void>;
  let execute: () => ReturnType<typeof httpWorkflow>;

  this.slow(1000);

  before(async function () {
    this.timeout(10 * 1000);
    // Filter INFO log messages for clearer test output
    Runtime.install({ logger: new DefaultLogger('WARN') });
    const worker = await Worker.create({
      taskQueue: 'test-activities',
      workflowsPath: require.resolve('../workflows'),
      activities,
    });

    const runPromise = worker.run();
    shutdown = async () => {
      worker.shutdown();
      await runPromise;
    };
  });

  beforeEach(() => {
    const client = new WorkflowClient();

    execute = () =>
      client.execute(httpWorkflow, {
        taskQueue: 'test-activities',
        workflowExecutionTimeout: 1000,
        // Use random ID because ID is meaningless for this test
        workflowId: `test-${uuid()}`,
      });
  });

  after(async () => {
    await shutdown();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns correct result', async () => {
    const result = await execute();
    assert.equal(result, 'The answer is 42');
  });

  it('retries one failure', async () => {
    // Make the first request fail, but subsequent requests succeed
    let numCalls = 0;
    sinon.stub(axios, 'get').callsFake(() => {
      if (numCalls++ === 0) {
        return Promise.reject(new Error('first error'));
      }
      return Promise.resolve({ data: { args: { answer: '88' } } });
    });

    const result = await execute();
    assert.equal(result, 'The answer is 88');
  });

  it('bubbles up activity errors', async () => {
    sinon.stub(axios, 'get').callsFake(() => Promise.reject(new Error('example error')));

    await assert.rejects(
      execute,
      (err: unknown) =>
        err instanceof WorkflowFailedError &&
        err.cause instanceof ActivityFailure &&
        err.cause.cause instanceof ApplicationFailure &&
        err.cause.cause.message === 'example error'
    );
  });
});
