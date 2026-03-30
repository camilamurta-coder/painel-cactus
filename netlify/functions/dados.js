const SHEETS_URL = "https://script.google.com/macros/s/AKfycbz2pGNXA3ooyqlqhKMg0SrI0AIaa3MfNRtMQH888Wr5Nqobf6dXkPlQIzeDqajiaeO8/exec";

export default async () => {
  try {
    const res = await fetch(SHEETS_URL + "?t=" + Date.now(), {
      redirect: "follow",
      headers: { "User-Agent": "netlify-proxy/1.0" }
    });
    const text = await res.text();
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
