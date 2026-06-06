// Runs on Vercel's Edge runtime. Your ANTHROPIC_API_KEY stays on the server and
// is never shipped to the browser. We call Anthropic over native fetch (no SDK)
// so the function always bundles cleanly on the Edge runtime.
export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = `You are a content moderator for Homeroom, a professional and educational social network for high school students.

Decide whether a post belongs on the platform. ALLOW posts about: academics, studying, classes, careers, internships, jobs, scholarships, competitions, programs, research, clubs and extracurriculars, sports, volunteering, achievements and awards, school life, college admissions, personal or professional growth, asking for or sharing advice, and networking among students.

BLOCK posts that are clearly off-topic or harmful: spam or advertising of unrelated products, random off-topic chatter with no educational or career value, profanity-laden rants, harassment, hate speech, sexual content, graphic violence, self-harm encouragement, or anything unsafe for a teen audience.

When unsure, lean toward ALLOW — only block posts that clearly do not belong.

Respond with ONLY a JSON object and nothing else, in this exact shape:
{"allowed": true|false, "reason": "<short friendly explanation a student can read if blocked>"}`

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ allowed: true }, 405)

  const apiKey = process.env.ANTHROPIC_API_KEY
  // Fail open if moderation isn't configured, so posting never breaks.
  if (!apiKey) return json({ allowed: true, reason: 'moderation-disabled' })

  let content = ''
  try {
    const body = await req.json()
    content = String(body?.content ?? '')
  } catch {
    return json({ allowed: true })
  }

  if (!content.trim()) return json({ allowed: true })

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Post to review:\n"""\n${content}\n"""` }],
      }),
    })

    if (!resp.ok) return json({ allowed: true, reason: 'moderation-error' })

    const data = (await resp.json()) as { content?: Array<{ type: string; text?: string }> }
    const text = (data.content ?? [])
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('')

    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { allowed: true }

    return json({
      allowed: parsed.allowed !== false,
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    })
  } catch {
    // Fail open on any API error.
    return json({ allowed: true, reason: 'moderation-error' })
  }
}
