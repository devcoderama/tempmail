export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  console.log('Incoming email:', {
    to: payload.to,
    from: payload.from,
    subject: payload.subject,
  });

  return new Response('OK', { status: 200 });
};
