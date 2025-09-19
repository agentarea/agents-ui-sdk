import type { TransportFactory as ITransportFactory, Transport, TransportConfig, RestEndpointMapping } from './index'
import { JsonRpcTransport } from './json-rpc-transport'
import { JsonRestTransport } from './json-rest-transport'

export class TransportFactory implements ITransportFactory {
  createTransport(type: 'json-rpc' | 'json-rest', config: TransportConfig, mapping?: RestEndpointMapping): Transport {
    switch (type) {
      case 'json-rpc':
        return new JsonRpcTransport(config)
      case 'json-rest':
        return new JsonRestTransport(config, mapping)
      default:
        throw new Error(`Unsupported transport type: ${type}`)
    }
  }
}

export function createTransportFactory() {
  return new TransportFactory()
}