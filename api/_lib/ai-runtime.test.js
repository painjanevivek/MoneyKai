const assert = require('node:assert/strict');
const test = require('node:test');

const { analyzeInlineImages } = require('./ai-runtime');
const { readJsonBody } = require('./http');

const pngDataUrl = (byteLength) => {
  const bytes = Buffer.alloc(byteLength);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
  return `data:image/png;base64,${bytes.toString('base64')}`;
};

const attachment = (byteLength, filename = 'receipt.png') => ({
  filename,
  mimeType: 'image/png',
  dataUrl: pngDataUrl(byteLength),
});

test('parsed JSON bodies still honor the configured byte limit', async () => {
  await assert.rejects(
    () => readJsonBody({ body: { message: 'x'.repeat(2_000) } }, { limitBytes: 1_024 }),
    (error) => error?.statusCode === 413,
  );
});

test('AI analysis rejects oversized UTF-8 prompts before provider work', async () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousFetch = global.fetch;
  let fetchCalls = 0;
  process.env.OPENROUTER_API_KEY = 'test-key';
  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error('Provider must not be called.');
  };

  try {
    await assert.rejects(
      () => analyzeInlineImages({
        task: 'receipt_extract',
        message: '₹'.repeat(3_000),
        inlineAttachments: [attachment(16)],
      }),
      (error) => error?.statusCode === 413 && error?.code === 'AI_MESSAGE_TOO_LARGE',
    );
    assert.equal(fetchCalls, 0);
  } finally {
    if (previousKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = previousKey;
    }
    global.fetch = previousFetch;
  }
});

test('AI analysis caps aggregate decoded image bytes before provider work', async () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousFetch = global.fetch;
  let fetchCalls = 0;
  process.env.OPENROUTER_API_KEY = 'test-key';
  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error('Provider must not be called.');
  };

  try {
    await assert.rejects(
      () => analyzeInlineImages({
        task: 'image_analysis',
        message: 'Review these images.',
        inlineAttachments: [attachment(2_200_000, 'one.png'), attachment(2_200_000, 'two.png')],
      }),
      (error) => error?.statusCode === 413 && error?.code === 'AI_ATTACHMENTS_TOO_LARGE',
    );
    assert.equal(fetchCalls, 0);
  } finally {
    if (previousKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = previousKey;
    }
    global.fetch = previousFetch;
  }
});

test('bounded AI input still reaches the provider and returns normalized output', async () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousFetch = global.fetch;
  let providerBody;
  process.env.OPENROUTER_API_KEY = 'test-key';
  global.fetch = async (_url, options) => {
    providerBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        id: 'request-1',
        model: 'test-model',
        choices: [{ message: { content: '{"message":"Looks valid","structured":null,"warnings":[]}' } }],
      }),
    };
  };

  try {
    const result = await analyzeInlineImages({
      task: 'image_analysis',
      message: 'Review this image.',
      inlineAttachments: [attachment(16)],
    });

    assert.equal(result.message, 'Looks valid');
    assert.match(providerBody.messages[0].content[0].text, /Review this image\./);
    assert.equal(providerBody.messages[0].content.length, 2);
  } finally {
    if (previousKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = previousKey;
    }
    global.fetch = previousFetch;
  }
});
