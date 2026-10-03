import { proxyPdf } from "@/app/lib/pdfProxy";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  return proxyPdf("fill", slug);
}
