export const schemas = {
  register_agent: {
    type: 'object',
    properties: {
      domain: { type: 'string', minLength: 1 }
    },
    required: ['domain'],
    additionalProperties: false
  },
  authorize_feedback: {
    type: 'object',
    properties: {
      clientId: { type: 'integer', minimum: 1 },
      serverId: { type: 'integer', minimum: 1 }
    },
    required: ['clientId', 'serverId'],
    additionalProperties: false
  },
  request_validation: {
    type: 'object',
    properties: {
      validatorId: { type: 'integer', minimum: 1 },
      serverId: { type: 'integer', minimum: 1 },
      dataHash: { type: 'string', pattern: '^[0-9a-fA-F]{64}$' }
    },
    required: ['validatorId', 'serverId', 'dataHash'],
    additionalProperties: false
  },
  submit_validation_response: {
    type: 'object',
    properties: {
      dataHash: { type: 'string', pattern: '^[0-9a-fA-F]{64}$' },
      score: { type: 'integer', minimum: 0, maximum: 100 }
    },
    required: ['dataHash', 'score'],
    additionalProperties: false
  },
  resolve_agent_by_address: {
    type: 'object',
    properties: {
      address: { type: 'string', pattern: '^0x[0-9a-fA-F]{40}$' }
    },
    required: ['address'],
    additionalProperties: false
  },
  resolve_agent_by_domain: {
    type: 'object',
    properties: {
      domain: { type: 'string', minLength: 1 }
    },
    required: ['domain'],
    additionalProperties: false
  },
  get_validation_response: {
    type: 'object',
    properties: {
      dataHash: { type: 'string', pattern: '^[0-9a-fA-F]{64}$' }
    },
    required: ['dataHash'],
    additionalProperties: false
  }
};
