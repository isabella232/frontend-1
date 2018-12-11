// @flow

import invariant from 'invariant';
import { Environment as RelayEnvironment, Network, RecordSource, Store } from 'relay-runtime';

function wrapFetch(wrapped) {
  if (process.env.NODE_ENV === 'development') {
    const { createRelayNetworkLogger, RelayNetworkLoggerTransaction } = require('relay-runtime');
    const logger = createRelayNetworkLogger(RelayNetworkLoggerTransaction);
    return logger.wrapFetch(wrapped);
  }
  return wrapped;
}

function fetchQuery(operation, variables) {
  return fetch(window._graphql.url, {
    method: 'POST',
    headers: {
      ...window._graphql.headers,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      query: operation.text,
      variables
    })
  }).then(response => response.json());
}

let relayEnvironment = null;

export default class Environment {
  static get(): RelayEnvironment {
    invariant(relayEnvironment, `Cannot get the current Relay Environment as one has not yet been configured!`);
    return relayEnvironment;
  }

  static create(): RelayEnvironment {
    if (relayEnvironment === null) {
      const network = Network.create(wrapFetch(fetchQuery));
      const source = new RecordSource({});
      const store = new Store(source);
      const handlerProvider = null;
      relayEnvironment = new RelayEnvironment({ handlerProvider, network, store });
    }
    return relayEnvironment;
  }
}