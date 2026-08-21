import type { APIRoute } from 'astro';
import { EmailMessage } from 'cloudflare:email';

export const prerender = false;

const DESTINATION = 'hello@bringleads.in';
const SENDER = 'contact-form@bringleads.in';

function encodeHeader(value: string): string {
	// RFC 2047 encode header values that contain non-ASCII characters.
	if (/^[\x20-\x7e]*$/.test(value)) return value;
	const b64 = btoa(unescape(encodeURIComponent(value)));
	return `=?UTF-8?B?${b64}?=`;
}

function buildRawEmail(opts: {
	from: string;
	fromName: string;
	to: string;
	subject: string;
	replyTo: string;
	body: string;
}): string {
	const headers = [
		`From: ${encodeHeader(opts.fromName)} <${opts.from}>`,
		`To: ${opts.to}`,
		`Subject: ${encodeHeader(opts.subject)}`,
		`Reply-To: ${opts.replyTo}`,
		`MIME-Version: 1.0`,
		`Content-Type: text/plain; charset="UTF-8"`,
		`Content-Transfer-Encoding: 8bit`,
	];
	return `${headers.join('\r\n')}\r\n\r\n${opts.body.replace(/\r?\n/g, '\r\n')}`;
}

export const POST: APIRoute = async ({ request, locals }) => {
	let data: Record<string, string>;
	try {
		data = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: 'Invalid request.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { name, email, company, website, industry, market, challenge, hp_field } = data;

	// Honeypot: bots fill every field, real visitors never see this one.
	if (hp_field) {
		return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
	}

	if (!name || !email || !company || !challenge) {
		return new Response(JSON.stringify({ ok: false, error: 'Please fill in all required fields.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const lines = [
		`Name: ${name}`,
		`Email: ${email}`,
		`Company: ${company}`,
		`Website: ${website || '—'}`,
		`Industry: ${industry || '—'}`,
		`Priority market: ${market || '—'}`,
		'',
		'What they are trying to change:',
		challenge,
	].join('\n');

	try {
		const env = (locals as any).runtime.env;
		const raw = buildRawEmail({
			from: SENDER,
			fromName: 'Bringleads contact form',
			to: DESTINATION,
			subject: `Growth enquiry from ${company}`,
			replyTo: email,
			body: lines,
		});

		const message = new EmailMessage(SENDER, DESTINATION, raw);
		await env.CONTACT_EMAIL.send(message);

		return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
	} catch (err) {
		const debugMessage = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
		console.error('Failed to send contact email:', debugMessage);
		return new Response(
			JSON.stringify({
				ok: false,
				error: 'Something went wrong sending your message. Please email hello@bringleads.in directly.',
				debug: debugMessage,
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
