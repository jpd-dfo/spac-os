// ============================================================================
// SPAC OS AI Chat API Endpoint
// ============================================================================

import { type NextRequest, NextResponse } from 'next/server';

import { getClaudeClient, type ClaudeMessage } from '@/lib/ai/claude';
import { SYSTEM_PROMPTS, AI_CONFIG } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

interface ChatRequest {
  message: string;
  context?: {
    page?: string;
    spacId?: string;
    targetId?: string;
    documentId?: string;
  };
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
}

// ============================================================================
// System Prompt Builder
// ============================================================================

function buildSystemPrompt(context?: ChatRequest['context']): string {
  let prompt = `You are an AI assistant for SPAC OS, a comprehensive SPAC management platform. You help users with:

1. Understanding SPAC transactions and processes
2. Analyzing documents and contracts
3. Evaluating target companies
4. Navigating SEC compliance requirements
5. Managing deal pipelines and tasks

Guidelines:
- Be helpful, accurate, and professional
- Provide specific, actionable advice when possible
- Reference relevant SEC regulations when discussing compliance
- Explain technical M&A and SPAC terminology when used
- Suggest relevant features or actions within the platform

`;

  if (context) {
    prompt += '\nCurrent Context:\n';
    if (context.page) {prompt += `- User is on: ${context.page}\n`;}
    if (context.spacId) {prompt += `- Working with SPAC ID: ${context.spacId}\n`;}
    if (context.targetId) {prompt += `- Viewing Target ID: ${context.targetId}\n`;}
    if (context.documentId) {prompt += `- Analyzing Document ID: ${context.documentId}\n`;}
  }

  return prompt;
}

// ============================================================================
// POST Handler - Non-streaming chat
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, context, history, stream } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const client = getClaudeClient();

    if (!client.checkConfigured()) {
      return NextResponse.json(
        {
          error: 'AI service not configured',
          message: 'Please configure the ANTHROPIC_API_KEY environment variable.',
        },
        { status: 503 }
      );
    }

    // Handle streaming request
    if (stream) {
      return handleStreamingChat(client, message, context, history);
    }

    // Build conversation history
    const messages: ClaudeMessage[] = [];

    if (history?.length) {
      messages.push(...history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })));
    }

    messages.push({ role: 'user', content: message });

    // Send request
    const response = await client.sendConversation(messages, {
      systemPrompt: buildSystemPrompt(context),
      maxTokens: AI_CONFIG.maxTokens.qa,
      temperature: AI_CONFIG.temperature.qa,
    });

    return NextResponse.json({
      success: true,
      response: response.content,
      metadata: {
        model: response.metadata.model,
        tokensUsed: response.metadata.tokensUsed,
        processingTime: response.metadata.processingTime,
      },
    });
  } catch (error) {
    logger.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Streaming Handler
// ============================================================================

async function handleStreamingChat(
  client: ReturnType<typeof getClaudeClient>,
  message: string,
  context?: ChatRequest['context'],
  history?: ChatRequest['history']
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Build conversation
        const messages: ClaudeMessage[] = [];

        if (history?.length) {
          messages.push(...history.map((h) => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })));
        }

        messages.push({ role: 'user', content: message });

        // Stream response
        const streamGenerator = client.streamConversation(messages, {
          systemPrompt: buildSystemPrompt(context),
          maxTokens: AI_CONFIG.maxTokens.qa,
          temperature: AI_CONFIG.temperature.qa,
        });

        for await (const chunk of streamGenerator) {
          if (chunk.type === 'text' && chunk.text) {
            const data = JSON.stringify({ type: 'text', content: chunk.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } else if (chunk.type === 'done') {
            const data = JSON.stringify({ type: 'done' });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } else if (chunk.type === 'error') {
            const data = JSON.stringify({ type: 'error', error: chunk.error });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        controller.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Stream error';
        const data = JSON.stringify({ type: 'error', error: errorMessage });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ============================================================================
// GET Handler - Health check
// ============================================================================

export async function GET() {
  const client = getClaudeClient();

  return NextResponse.json({
    status: 'ok',
    configured: client.checkConfigured(),
    rateLimitStatus: client.getRateLimitStatus(),
  });
}
