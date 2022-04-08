// @@@SNIPSTART typescript-hello-client
import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';

async function run() {
  const connection = new Connection({
    // // Connect to localhost with default ConnectionOptions.
    // // In production, pass options to the Connection constructor to configure TLS and other settings:
    // address: 'foo.bar.tmprl.cloud', // as provisioned
    address: 'does-not-exist'
    // tls: {} // as provisioned
  });

  const client = new WorkflowClient(connection.service, {
    // namespace: 'default', // change if you have a different namespace
  });

  console.log('Starting workflow...')

  // The process exits with a 0 status code when client.start is called
  const handle = await client.start(example, {
    args: ['Temporal'], // type inference works! args: [name: string]
    taskQueue: 'hello-world',
    // in practice, use a meaningful business id, eg customerId or transactionId
    workflowId: 'wf-id-' + Math.floor(Math.random() * 1000),
  });
  // We never get to this point
  console.log(`Started workflow ${handle.workflowId}`);

  console.log(await handle.result()); // Hello, Temporal!
}

process.on('unhandledRejection', (reason) => {
  console.log('unhandledRejection', reason)
})

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
