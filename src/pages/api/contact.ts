import type { APIRoute } from 'astro';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export const prerender = false;

const DESTINATION = 'hello@bringleads.in';
const SENDER = 'contact-form@bringleads.in';

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
		const msg = createMimeMessage();
		msg.setSender({ name: 'Bringleads contact form', addr: SENDER });
		msg.setRecipient(DESTINATION);
		msg.setSubject(`Growth enquiry from ${company}`);
		msg.setHeader('Reply-To', email);
		msg.addMessage({ contentType: 'text/plain', data: lines });

		const message = new EmailMessage(SENDER, DESTINATION, msg.asRaw());
		await env.CONTACT_EMAIL.send(message);

		return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
	} catch (err) {
		console.error('Failed to send contact email', err);
		return new Response(
			JSON.stringify({
				ok: false,
				error: 'Something went wrong sending your message. Please email hello@bringleads.in directly.',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
