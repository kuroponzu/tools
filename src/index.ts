import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function parseIPv4(ip: string): number[] | null {
  const match = ip.match(IPV4_REGEX);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  if (parts.some((n) => n < 0 || n > 255)) return null;
  return parts;
}

function isPrivateOrReservedIPv4(parts: number[]): boolean {
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  if (a >= 224) return true;
  return false;
}

app.get("/api/ip-info", async (c) => {
  const ip = c.req.query("ip")?.trim() ?? "";

  const parts = parseIPv4(ip);
  if (!parts) {
    return c.json({ error: "有効なIPv4アドレスを入力してください" }, 400);
  }
  if (isPrivateOrReservedIPv4(parts)) {
    return c.json(
      { error: "プライベート/予約済みIPアドレスは調査できません" },
      400,
    );
  }

  const fields =
    "status,message,country,regionName,city,zip,lat,lon,isp,org,as,timezone,proxy,hosting,query";
  const upstream = await fetch(
    `http://ip-api.com/json/${ip}?fields=${fields}`,
  );

  if (upstream.status === 429) {
    return c.json(
      { error: "リクエストが多すぎます。しばらくしてから再試行してください" },
      429,
    );
  }

  const data = (await upstream.json()) as Record<string, unknown>;

  if (data.status === "fail") {
    return c.json(
      { error: (data.message as string) ?? "情報を取得できませんでした" },
      502,
    );
  }

  return c.json({
    ip: data.query,
    country: data.country,
    region: data.regionName,
    city: data.city,
    postal: data.zip,
    latitude: data.lat,
    longitude: data.lon,
    isp: data.isp,
    org: data.org,
    asn: data.as,
    timezone: data.timezone,
    security: {
      anonymizer: data.proxy,
      hosting: data.hosting,
    },
  });
});

export default app;
